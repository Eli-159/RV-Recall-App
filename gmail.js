const google = require('googleapis').google;
const readline = require('readline');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/script.external_request', 'https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = './token.json';

module.exports.getAuthUrl = () => {
    return new Promise((resolve, reject) => {
        // Load client secrets from a local file.
        fs.readFile('oauth-credentials.json', (err, content) => {
            if (err) return reject(err);
            // Loads the client auth data into variables.
            const credentials = JSON.parse(content);
            const client_secret = credentials.web.client_secret;
            const client_id = credentials.web.client_id;
            // Declares a new instance of the google OAuth2 client.
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);
            // Returns the authentication url.
            resolve(oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                response_type: 'code',
                client_id: credentials.web.client_id,
                scope: SCOPES,
                redirect_uri: credentials.web.redirect_uris[0]
            }));
        });
    });
};

module.exports.createTokenFromCode = (code) => {
    return new Promise((resolve, reject) => {
        // Load client secrets from a local file.
        fs.readFile('oauth-credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Loads the client auth data into variables.
            const credentials = JSON.parse(content);
            const client_secret = credentials.web.client_secret;
            const client_id = credentials.web.client_id;
            const redirect_uri = credentials.web.redirect_uris[0];
            // Declares a new instance of the google OAuth2 client.
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);
            // Gets a new OAuth token.
            oAuth2Client.getToken({code, redirect_uri}, (err, fetchedToken) => {
                // Rejects the error if one occurs.
                if (err) reject(err);
                // Sets the oAuth credentials to those fetched.
                oAuth2Client.setCredentials(fetchedToken);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(fetchedToken), (err) => {
                    if (err) return console.error(err);
                });
                // Resolves the promise, parsing the OAuth2 client.
                resolve(oAuth2Client);
            });
        });
    });
};

module.exports.loadToken = () => {
    return new Promise((resolve, reject) => {
        // Load client secrets from a local file.
        fs.readFile('oauth-credentials.json', (err, content) => {
            if (err) return resolve(err);
            // Loads the client auth data into variables.
            const credentials = JSON.parse(content);
            const client_secret = credentials.web.client_secret;
            const client_id = credentials.web.client_id;
            // Declares a new instance of the google OAuth2 client.
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);
            // Reads the file where the would be a previously stored token.
            fs.readFile(TOKEN_PATH, (err, savedToken) => {
                if (err) return reject(err);
                oAuth2Client.setCredentials(JSON.parse(savedToken.toString()));
                resolve(oAuth2Client);
            });
        });
    });
};

module.exports.sendEmail = () => {
    module.exports.loadToken().then(auth => {
        console.log(auth);
        const appsScript = google.script('v1');
        appsScript.scripts.run({
            auth: auth,
            scriptId: '17YmwpeFyhYDR8DDx2nMYhzQMcLnLq1027Il_LMCXTXOMA8kVQ9gep6wg',
            resource: {
                function: 'sendEmailFromDraft',
                parameters: [
                    'TEMPLATE:MyRV - Registration Confirmation',
                    'eli.gearing@gmail.com',
                    {
                        name: 'Eli',
                        vin: '2F354289jfj234',
                        buildNo: '345755'
                    }
                ],
                devMode: true
            }
        }).then(res => console.log(res.data)).catch(err => console.log(err));
    }).catch(err => console.log(err));
};

module.exports.sendEmail();