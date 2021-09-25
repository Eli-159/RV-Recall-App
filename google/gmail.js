const google = require('googleapis').google;
const readline = require('readline');
const fs = require('fs');
const MailParser = require('mailparser').MailParser;

const SCOPES = ['https://www.googleapis.com/auth/script.external_request', 'https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = './google/token.json';

// Exports the scopes, so they are available in other files.
module.exports.scopes = SCOPES;

// Exports a function to get the OAuth2 details.
module.exports.getAuthDetails = () => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Load client secrets from a local file.
        fs.readFile('./google/oauth-credentials.json', (err, content) => {
            // Rejects an error.
            if (err) return reject(err);
            // Resolves the promise, passing the file content as an object.
            resolve(JSON.parse(content));
        });
    });
}

// Exports a function to get the auth url.
module.exports.getAuthUrl = () => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Load client secrets from a local file.
        fs.readFile('./google/oauth-credentials.json', (err, content) => {
            // Rejects an error.
            if (err) return reject(err);
            // Loads the client auth data into variables.
            const credentials = JSON.parse(content);
            const client_secret = credentials.web.client_secret;
            const client_id = credentials.web.client_id;
            // Declares a new instance of the google OAuth2 client.
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);
            // Resolves the promise, passing the authentication url.
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

// Exports a function to create and save an access token.
module.exports.createTokenFromCode = (code) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Load client secrets from a local file.
        fs.readFile('./google/oauth-credentials.json', (err, content) => {
            // Rejects an error.
            if (err) return reject(err);
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

// Exports a function to load the access token from the json file.
module.exports.loadToken = () => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Load client secrets from a local file.
        fs.readFile('./google/oauth-credentials.json', (err, content) => {
            // Rejects an error.
            if (err) return reject(err);
            // Loads the client auth data into variables.
            const credentials = JSON.parse(content);
            const client_secret = credentials.web.client_secret;
            const client_id = credentials.web.client_id;
            // Declares a new instance of the google OAuth2 client.
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);
            // Reads the file where the would be a previously stored token.
            fs.readFile(TOKEN_PATH, (err, savedToken) => {
                // Rejects an error.
                if (err) return reject(err);
                // Sets the OAuth2 client credentials to the saved token.
                oAuth2Client.setCredentials(JSON.parse(savedToken.toString()));
                // Resolves the promise, returning the OAuth2 client, meaning that it can just be passed as the auth in an api.
                resolve(oAuth2Client);
            });
        });
    });
};

// Exports a function to list the user's draft emails.
module.exports.listEmails = () => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Loads the auth token.
        module.exports.loadToken().then(auth => {
            // Declares an instance of the gmail api.
            const gmail = google.gmail({version: 'v1', auth});
            // Gets a list of drafts.
            gmail.users.drafts.list({
                userId: 'me'
            }).then(res => {
                // Declares a variable to hold the final draft data.
                const draftData = [];
                // Declares a variable to hold the message promises.
                const messageProms = [];
                // Loops over the returned drafts.
                for (draft in res.data.drafts) {
                    // Pushes the draft id and message id to the draftData array.
                    draftData.push({
                        draftId: res.data.drafts[draft].id,
                        messageId: res.data.drafts[draft].message.id
                    });
                    // Pushes a promise, containing the call to get the message data, to the messageProms array.
                    messageProms.push(gmail.users.messages.get({
                        userId: 'me',
                        id: res.data.drafts[draft].message.id
                    }));
                }
                // Waits for the promises to resolve.
                Promise.all(messageProms).then(messages => {
                    // Loops over the message data.
                    for (mes in messages) {
                        // Adds the subject and a snippet of the body to the draftData array.
                        draftData[mes].subject = messages[mes].data.payload.headers.find(header => header.name == 'Subject').value;
                        draftData[mes].snippet = messages[mes].data.snippet.replace('{{', '(').replace('}}', ')').substring(0, 99)+'...';
                    }
                    // Resolves the promise, passing the draftData array.
                    resolve(draftData);
                }).catch(err => reject(err));
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

// Exports a function to send an email.
module.exports.sendEmail = (draftId, address, replaceValues) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Loads the auth token.
        module.exports.loadToken().then(auth => {
            // Declares an instance of the gmail api.
            const gmail = google.gmail({version: 'v1', auth});
            gmail.users.drafts.get({
                userId: 'me',
                id: draftId
            }).then(draft => {
                gmail.users.messages.get({
                    userId: 'me',
                    id: draft.data.message.id,
                    format: 'RAW'
                }).then(message => {

                    // ********************************************************************************

                    

                    // ********************************************************************************


                    gmail.users.drafts.create({
                        userId: 'me',
                        resource: {
                            message: {
                                raw: message.data.raw
                            }
                        }
                    }).then(newDraft => {
                        Promise.all([
                            gmail.users.drafts.get({
                                userId: 'me',
                                id: newDraft.data.id
                            }),
                            gmail.users.messages.get({
                                userId: 'me',
                                id: newDraft.data.message.id,
                                format: 'FULL'
                            })
                        ]).then(res => {
                            const updatedDraft = res[0].data;
                            const updatedMessage = res[1].data;
                            const html = Buffer.from(updatedMessage.payload.parts[0].parts[1].body.data, 'base64').toString();
                            const replaceKeys = Object.keys(replaceValues);
                            for (key in replaceKeys) {
                                html.replace(replaceKeys[key], replaceValues[replaceKeys[key]]);
                            }
                            updatedMessage.payload.parts[0].parts[1].body.data = Buffer.from(html).toString('base64');

                            const subjectIndex = updatedMessage.payload.headers.findIndex(header => header.name == 'Subject');
                            if (subjectIndex >= 0) {
                                updatedMessage.payload.headers[subjectIndex].value = updatedMessage.payload.headers[subjectIndex].value.replace(/:?TEMPLATE:?/, '');
                            } else {
                                updatedMessage.payload.headers.push({
                                    name: 'Subject',
                                    value: updatedMessage.payload.headers[subjectIndex].value.replace(/:?TEMPLATE:?/, '')
                                });
                            }

                            const toIndex = updatedMessage.payload.headers.findIndex(header => header.name == 'To');
                            if (toIndex >= 0) {
                                updatedMessage.payload.headers[toIndex].value = address;
                            } else {
                                updatedMessage.payload.headers.push({
                                    name: 'To',
                                    value: address
                                });
                            }
                            updatedDraft.message = updatedMessage;
                            console.log(JSON.stringify(updatedDraft));


                            gmail.users.drafts.update({
                                userId: 'me',
                                id: updatedDraft.id,
                                resource: updatedDraft
                            }).then(() => {
                                resolve();
                            }).catch(err => reject(err));
                            

                        }).catch(err => reject(err))
                    }).catch(err => reject(err));
                }).catch(err => reject(err));
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
};




// module.exports.getAuthUrl().then(url => console.log(url));
// module.exports.createTokenFromCode('4/0AX4XfWhZveE3NYNqdVXEBU3x6p2My5Zs-xAl-JJJbSIw7KxnF1XUr0bOw8rd7yKa3IZvjQ');
// module.exports.listEmails().then(data => console.log(data)).catch(err => console.log(err));
module.exports.sendEmail('r-8695073299110056522', 'eli.gearing@gmail.com', {
    name: 'Eli Gearing',
    vin: 'TestVin101',
    buildNo: 'TestBuildNo202'
}).then(data => console.log(data)).catch(err => console.log(err));