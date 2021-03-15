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


/* GET */
router.get('/:id', function(req, res, next) {
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    // authorize(JSON.parse(content), listMajors);

    const credentials = JSON.parse(content);
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) {
          res.json({message:'token expired'});
          return;
      }
      oAuth2Client.setCredentials(JSON.parse(token));
      const sheets = google.sheets({version: 'v4', auth: oAuth2Client});
      sheets.spreadsheets.values.get({
        spreadsheetId: '1FWHm8879jYwAspAvDS0eawJZK5dYt0kdxPLSdjY94yQ',
        range: 'Lista!A:B',
      }, (err, rsp) => {
        if (err) {
            res.json({message: 'The API returned an error: ' + err});
            return;
        }
        const rows = rsp.data.values;
        let filtered = [];
        if (rows.length) {
          // Print columns A and E, which correspond to indices 0 and 4.
          rows.map((row) => {
            const id = req.params.id;
            if (row[0] === id) {
                filtered.push({id, name: row[1]});
            }
          });
          res.json(filtered);
        } else {
          console.log('No data found.');
        }
      });
    });
  });
});

module.exports = router;
