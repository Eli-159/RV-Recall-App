const google = require('googleapis').google;
const readline = require('readline');
const fs = require('fs');

function authenticate() {
    const SCOPES = ['https://www.googleapis.com/auth/script.external_request', 'https://www.googleapis.com/auth/gmail.modify'];
    const TOKEN_PATH = './token.json';
    return new Promise((resolve, reject) => {
        // Load client secrets from a local file.
        fs.readFile('oauth-credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Loads the client auth data into variables.
            const credentials = JSON.parse(content);
            const {client_secret, client_id, redirect_uris} = credentials.web;
            // Declares a new instance of the google OAuth2 client.
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);

            // Reads the file where the would be a previously stored token.
            fs.readFile(TOKEN_PATH, (err, savedToken) => {
                const prom = new Promise((res, rej) => {
                    if (err) {
                        const authUrl = oAuth2Client.generateAuthUrl({
                            access_type: 'offline',
                            response_type: 'code',
                            client_id: client_id,
                            scope: SCOPES,
                            redirect_uri: redirect_uris[0]
                        });
                        console.log('Authorize this app by visiting this url:', authUrl);
                        const rl = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout,
                        });
                        rl.question('Enter the code from that page here: ', (code) => {
                            rl.close();
                            oAuth2Client.getToken({code, redirect_uri: redirect_uris[0]}, (err, fetchedToken) => {
                                if (err) rej(err);
                                oAuth2Client.setCredentials(fetchedToken);
                                // Store the token to disk for later program executions
                                fs.writeFile(TOKEN_PATH, JSON.stringify(fetchedToken), (err) => {
                                    if (err) return console.error(err);
                                });
                                res(fetchedToken);
                            });
                        });
                    } else {
                        // res((typeof savedToken == 'string' ? JSON.parse(savedToken) : savedToken));
                        res(JSON.parse(savedToken.toString()));
                    }
                });
                prom.then(token => {
                    console.log(token);
                    console.log(Date.now());
                    console.log(Date.now() < token.expiry_date);
                    oAuth2Client.setCredentials(token);
                    resolve(oAuth2Client);
                }).catch(err => console.log(err));
            });
        });
    });
}

module.exports.sendEmail = () => {
    authenticate().then(auth => {
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
}

module.exports.sendEmail();