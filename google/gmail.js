const google = require('googleapis').google;
const fs = require('fs');
const googleAuth = require('./auth.js');

// Exports a function to get the authenticated user's profile.
module.exports.getUserProfile = () => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Loads the auth token.
        googleAuth.loadToken().then(token => {
            // Declares an instance of the gmail api.
            const gmail = google.gmail({version: 'v1', auth: token});
            // Gets the profile.
            gmail.users.getProfile({
                userId: 'me'
            }).then(res => {
                // Resolves the promise, passing through the profile data.
                resolve(res.data);
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
};

// Exports a function to list the user's draft emails.
module.exports.listDrafts = () => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Loads the auth token.
        googleAuth.loadToken().then(token => {
            // Declares an instance of the gmail api.
            const gmail = google.gmail({version: 'v1', auth: token});
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

// Declares a function to get the draft object and raw message data.
module.exports.getRawDraftData = (token, draftId) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Declares an instance of the gmail api.
        const gmail = google.gmail({version: 'v1', auth: token});
        // Calls the gmail api to get the draft object.
        gmail.users.drafts.get({
            userId: 'me',
            id: draftId
        }).then(draft => {
            // Calls the gmail api to get the raw message data.
            gmail.users.messages.get({
                userId: 'me',
                id: draft.data.message.id,
                format: 'RAW'
            }).then(message => {
                // Resolves an object with the draft and message.
                resolve({
                    draft: draft.data,
                    message: message.data.raw
                });
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

// Declares a function to alter the message to include the new properties.
module.exports.replaceMessageData = (message, address, replaceValues) => {
    // Gets the keys from the replaceValues object.
    const replaceKeys = Object.keys(replaceValues);
    // Decodes the base64 message passed in.
    let stringMessage = Buffer.from(message, 'base64').toString();
    // Loops over the keys pulled from the replaceValues object.
    for (key in replaceKeys) {
        // Creates a regular expression replace key, using the replace key and adding optional charaters inbetween to handle new lines.
        const replaceKey = new RegExp(('{{'+replaceKeys[key]+'}}').split('').join('=?\\n?\\r?\\n?'),'g');
        // Replaces any instance of the replace key with the replace value passed in through the replaceValues object.
        stringMessage = stringMessage.replace(replaceKey, replaceValues[replaceKeys[key]]);
    }
    // Splits the message on each new line.
    const messageLines = stringMessage.split('\n');
    // Adds the 'To' header.
    messageLines.splice(0, 0, 'To: ' + address);
    // Finds the index of subject.
    const subIndex = messageLines.findIndex(line => line.includes('Subject:'));
    // If it's found, which should always be the case, the string 'TEMPLATE' is removed, along with a colen on either side.
    if (subIndex >= 0) {
        messageLines[subIndex] = messageLines[subIndex].replace(/:?TEMPLATE:?/, '');
    }
    // The index of id is seached for.
    const idIndex = messageLines.findIndex(line => line.includes('Message-ID:'));
    // If it's found, it's removed.
    if (idIndex >= 0) {
        messageLines.splice(idIndex, 1);
    }
    // The messageLines array is joined by the token '\n', as that is what it was split on.
    stringMessage = messageLines.join('\n');
    // Returns the base64 encoded version of stringMessage.
    return Buffer.from(stringMessage).toString('base64');
}

module.exports.createAndSendDraft = (token, message) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Declares an instance of the gmail api.
        const gmail = google.gmail({version: 'v1', auth: token});
        // Creates a draft.
        gmail.users.drafts.create({
            userId: 'me',
            resource: {
                message: {
                    raw: message
                }
            }
        }).then(newDraft => {
            // Sends the created draft.
            gmail.users.drafts.send({
                userId: 'me',
                requestBody: newDraft.data
            }).then(resolve).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

// Exports a function to send an email.
module.exports.sendTemplateEmail = (draftId, address, replaceValues) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Loads the auth token.
        googleAuth.loadToken().then(token => {
            // Gets the raw draft data.
            module.exports.getRawDraftData(token, draftId).then(draftData => {
                // Updates the message.
                const updatedMessage = module.exports.replaceMessageData(draftData.message, address, replaceValues);
                // Creates a new draft and sends it.
                module.exports.createAndSendDraft(token, updatedMessage).then(() => resolve()).catch(err => reject(err));
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
};

// Exports a function to get a general update on gmail api health.
module.exports.getHealthUpdate = () => {
    // Returns a promise.
    return new Promise((finalResolve) => {
        Promise.all([
            new Promise((resolve) => {
                // Gets the user profile.
                module.exports.getUserProfile().then(data => {
                    // Resolves the promise, passing throgh the data.
                    resolve(data);
                }).catch(err => {
                    // Logs the error and resolve the promise, passing through nothing.
                    console.log(err);
                    resolve();
                });
            }),
            new Promise((resolve) => {
                // Reads the email data map file.
                fs.readFile('./google/email-data-map.json', (err, data) => {
                    // Tests for an error.
                    if (err) {
                        // Resolves the promise, passing through that the number of failed emails is unknown.
                        resolve('Unknown');
                    } else {
                        // Resolves the promise, passing through the number of automated emails.
                        resolve(JSON.parse(data).filter(email => email.active).length);
                    }
                });
            }),
            new Promise((resolve) => {
                // Reads the failed emails file.
                fs.readFile('./google/failed-emails.json', (err, data) => {
                    // Tests for an error.
                    if (err) {
                        // Resolves the promise, passing through that the number of failed emails is unknown.
                        resolve('Unknown');
                    } else {
                        // Resolves the promise, passing through the number of failed emails.
                        resolve(JSON.parse(data).length);
                    }
                });
            })
        ]).then(healthData => {
            // Resolves the overall promise, passing through an object with the data fetched.
            finalResolve({
                auth: (healthData[0] ? 'Ok' : 'Expired'),
                account: (healthData[0] ? healthData[0].emailAddress : 'Unknown'),
                numEmails: healthData[1],
                failedEmails: healthData[2]
            });
        })
    });
}