const fs = require('fs');
const readline = require('readline');
const express = require('express');
const router = express.Router();
const {google} = require('googleapis');


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const JWT_PATH = 'jwt.keys.json';

//const SHEET_ID = '1FWHm8879jYwAspAvDS0eawJZK5dYt0kdxPLSdjY94yQ'; // Anna Domenico 5 settembre
//const SHEET_ID = '14j53zk63XntBbG0LQ5LR9gq2K5DdZeJa4x0zhHDJ8V8';
const SHEET_ID = '1-AzabjENPnJwW8wYL2vmxuyqrepv9rdmsU6Wg9N0HuE'; // Anna Domenico 28 Aprile

const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const {client_secret, client_id, redirect_uris} = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

function authorize(credentials, callback) {

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      callback.onerror({
        error: err,
        message: `Please try to refresh token ${authUrl}`
      });
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
    range: 'Lista!A:M',
  }, (err, rsp) => {
    if (err) {
      callback.onerror(err);
      return;
    }

    const rows = rsp.data.values;
    for (let i = 0; i < rows.length; ++i) {
      const row = rows[i];
      if (row[0] === id) {
        filtered.push({
          id,
          name: row[1],
          range: `D${i + 1}`,
          line: `${i + 1}`,
          checked: row[3]   == 1,
          under5: row[5]    == 1,
          bet5and10: row[6] == 1,
          gluten: row[7]    == 1,
          lactose: row[8]   == 1,
          notes: row[9],
        });
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
    callback.onsuccess({values: [[ value ? 1 : 0 ]]});
  });
}

function putByLine(auth, line, data, callback) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Lista!D${line}:M${line}`,
    resource: { values: [[
      data.checked ? 1 : 0,
      '',
      data.under5 ? 1:0,
      data.bet5adn10 ? 1:0,
      data.gluten ? 1:0,
      data.lactose ? 1:0,
    ]] },
    valueInputOption: 'USER_ENTERED'
  }, (err, rsp) => {
    if (err) {
        callback.onerror(err);
        return;
    }
    callback.onsuccess(data);
  });
}

router.put('/line/:line', function(req, res, next) {
  fs.readFile('credentials.json', (err, content) => {
    authorize(JSON.parse(content), {
      onsuccess: (auth) => {
        putByLine(auth, `${req.params.line}`, {
          checked: req.body.checked,
          under5: false,
          bet5and10: true,
          gluten: false,
          lactose: false,
          notes: 'Prova',
        }, {
          onsuccess: (data) => {
            res.json({message: `Updated D${req.params.line} as ${req.body.checked}`, data});
          },
          onerror: (err) => {
            res.json({error: err})
          }
        });
      }
    });
  });
});

router.put('/:id', function(req, res, next) {
  /**
   *  req.body = {
   *    "range": "D234",
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
                return putByRange(auth, entry.range, req.body.checked, {
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

router.get('/auth', function(req, res, next) {
  const code = req.query.code;
  oAuth2Client.getToken(code, (err, tokens) => {
    if (err) {
      console.error('Error getting oAuth tokens:');
      throw err;
    }
    res.json(tokens);
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
