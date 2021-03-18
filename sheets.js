const fs = require('fs');
const readline = require('readline');
const express = require('express');
const router = express.Router();
const {google} = require('googleapis');


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

const SHEET_ID = '1FWHm8879jYwAspAvDS0eawJZK5dYt0kdxPLSdjY94yQ';

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      callback.onerror(err);
    }
    oAuth2Client.setCredentials(JSON.parse(token));
    callback.onsuccess(oAuth2Client);
  });
}

function getById(auth, id, callback) {
  let filtered = [];
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Lista!A:D',
  }, (err, rsp) => {
    if (err) {
      callback.onerror(err);
      return;
    }
    const rows = rsp.data.values;
    for (let i = 0; i < rows.length; ++i) {
      const row = rows[i];
      if (row[0] === id) {
        filtered.push({id, name: row[1], checked: row[3] == 1, range: `D${i + 1}`});
      }
    }
    callback.onsuccess(filtered);
  });
}

function putByRange(auth, range, value, callback) {
  let filtered = [];
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Lista!${range}`,
    resource: { values: [[ value ? 1 : 0 ]] },
    valueInputOption: 'USER_ENTERED'
  }, (err, rsp) => {
    if (err) {
        callback.onerror(err);
        return;
    }
    callback.onsuccess(rsp);
  });
}

router.put('/:id', function(req, res, next) {
  /**
   *  req.body = {
   *    "name": "Rocco",
   *    "checked": true
   *  }
   */
  fs.readFile('credentials.json', (err, content) => {
    authorize(JSON.parse(content), {
      onsuccess: (auth) => {
        getById(auth, req.params.id, {
          onsuccess: (data) => {
            for (const entry of data) {
              if (entry.name === req.body.name) {
                // update entry.range using req.body.checked
                res.json({message: `Updated ${entry.range} as ${req.body.checked}`});
                putByRange(auth, entry.range, req.body.checked, {
                  onsuccess: (data) => {
                    res.json({message: `Updated ${entry.range} as ${req.body.checked}`, data});
                  },
                  onerror: (err) => {
                    res.json({error: err})
                  }
                });
              }
            }
            res.json({message: 'Not found', payload: req.body.name});
          },
          onerror: (err) => {
            res.json({error: err})
          }
        });
      },
      onerror: (err) => {
        res.json({error: err})
      }
    });
  });
});

router.get('/:id', function(req, res, next) {
  fs.readFile('credentials.json', (err, content) => {
    authorize(JSON.parse(content), {
      onsuccess: (auth) => {
        getById(auth, req.params.id, {
          onsuccess: (data) => {
            res.json(data)
          },
          onerror: (err) => {
            res.json({error: err})
          }
        });
      },
      onerror: (err) => {
        res.json({error: err})
      }
    });
  });
});

module.exports = router;
