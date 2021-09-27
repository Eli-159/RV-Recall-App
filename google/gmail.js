const google = require('googleapis').google;
const fs = require('fs');
const dao = require ('../data/dao.js');

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
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

// Declares a function to get the draft object and raw message data.
module.exports.getRawDraftData = (auth, draftId) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Declares an instance of the gmail api.
        const gmail = google.gmail({version: 'v1', auth});
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

module.exports.createAndSendDraft = (auth, message) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Declares an instance of the gmail api.
        const gmail = google.gmail({version: 'v1', auth});
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
        module.exports.loadToken().then(auth => {
            // Gets the raw draft data.
            module.exports.getRawDraftData(auth, draftId).then(draftData => {
                // Updates the message.
                const updatedMessage = module.exports.replaceMessageData(draftData.message, address, replaceValues);
                // Creates a new draft and sends it.
                module.exports.createAndSendDraft(auth, updatedMessage).then(() => resolve()).catch(err => reject(err));
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
};

// Declares a function to sort the vehicle data for the email.
module.exports.sortVehicleDataForEmail = (vehicleData) => {
    // Declares an object that contains the vehicle data required for the email.
    const processedVehicleData = {
        vehicleVin: vehicleData.vin,
        vehicleBuildNo: vehicleData.buildNo,
        vehicleIpa: vehicleData.ipa,
        vehicleEngineNo: vehicleData.engineNo,
        vehicleModelDesc: vehicleData.modelDesc,
        vehicleAddSpec: vehicleData.addSpec,
        vehicleVariantCode: vehicleData.variantCode
    };
    // Returns the previously delcared object.
    return processedVehicleData;
};

// Declares a function to sort the owner data for the email.
module.exports.sortOwnerDataForEmail = (vehicleData) => {
    // Declares an object that contains the owner data required for the email.
    const processedOwnerData =  {
        ownerName: vehicleData.owners[0].name,
        ownerEmail: vehicleData.owners[0].email,
        ownerPhone: vehicleData.owners[0].phone,
        ownerStreet: vehicleData.owners[0].street,
        ownerSuburb: vehicleData.owners[0].suburb,
        ownerState: vehicleData.owners[0].state,
        ownerPostcode: vehicleData.owners[0].postcode,
        ownerRegoState: vehicleData.owners[0].regoState,
        ownerRegoNo: vehicleData.owners[0].regoNo,
        ownerRegoDt: vehicleData.owners[0].regoDt
    };
    // Returns the previously delcared object.
    return processedOwnerData;
};

// Declares a function to sort and add the workshop data for the email.
module.exports.sortWorkshopDataForEmail = (vehicleData) => {
    // Declares an object to contaiin the sorted workshop data.
    const processedWorkshopData = {};
    // Declares variables to hold the most recent date, and the index of the record containing them.
    let recentDate = 0;
    let recentIndex = 0;
    // Loops over the contact records.
    for (record in vehicleData.recallContacts) {
        // Gets the current record and current date.
        const currRec = vehicleData.recallContacts[record];
        const currDate = new Date(currRec.createdAt).getTime();
        // Tests if the date is more recent than the previously found one, and if it from a recall registration record created by the owner.
        if (currDate > maxDate && currRec.action == 'recall registration' && currRec.createdBy == 'owner') {
            // Updates the recentDate and recentIndex variables.
            recentDate = currDate;
            recentIndex = record;
        }
    }
    // Checks if a workshop record has been found.
    if (recentDate != 0) {
        // Sets the workshopFound value to true, indicating there was a record found.
        processedWorkshopData.workshopFound = true;
        // Loads the most recent record and the feedback from it into variables.
        const recentRecord = vehicleData.recallContacts[recentIndex];
        const recallFeedback = recentRecord.recallFeedbacks[0].feedback;
        // Loads the saved workshop location into a variable.
        const chosenWorkshop = (recallFeedback.includes(';') ? recallFeedback.split(';')[0] : undefined);
        // Tests if the selected workshop was Sydney.
        if (chosenWorkshop == 'sydney') {
            // Loads the appropriate data into the processedWorkshopData variable.
            processedWorkshopData.workshopLocation = 'Sydney';
            processedWorkshopData.workshopCode = 'EN01';
            processedWorkshopData.workshopName = 'Elite NSW';
            processedWorkshopData.workshopEmail = 'nsw@elite.com.au'
        // Tests if the selected workshop was Melbourne.
        } else if (chosenWorkshop == 'melbourne') {
            // Loads the appropriate data into the processedWorkshopData variable.
            processedWorkshopData.workshopLocation = 'Melbourne';
            processedWorkshopData.workshopCode = 'EV01';
            processedWorkshopData.workshopName = 'Elite Vic';
            processedWorkshopData.workshopEmail = 'vic@elite.com.au'
        // Tests if the selected workshop was the Gold Coast.
        } else if (chosenWorkshop == 'gold-coast') {
            // Loads the appropriate data into the processedWorkshopData variable.
            processedWorkshopData.workshopLocation = 'Gold Coast';
            processedWorkshopData.workshopCode = 'EQ01';
            processedWorkshopData.workshopName = 'Elite Qld';
            processedWorkshopData.workshopEmail = 'qld@elite.com.au'
        // Tests if there was no workshop that was accessible for the owner.
        } else if (chosenWorkshop == 'other') {
            // Loads the appropriate data into the processedWorkshopData variable.
            processedWorkshopData.workshopLocation = 'Other';
            processedWorkshopData.workshopCode = 'MYRV';
            processedWorkshopData.workshopName = 'Other';
            processedWorkshopData.workshopEmail = 'recalls@my-rv.com.au'
        } else {
            // If none of the expected options were in chosenWorkshop, the workshopFound property is set to false.
            processedWorkshopData.workshopFound = false;
        }
    } else {
        // If no owner registration contact record was found, the workshopFound property is set to false.
        processedWorkshopData.workshopFound = false;
    }
    return processedWorkshopData;
};

module.exports.getEmailDataObject = (vin) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        dao.getVehicleByVin(vin).then(rawVehicleData => {
            const vehicleData = JSON.parse(JSON.stringify(rawVehicleData));
            const emailDataObject = {
                ...module.exports.sortVehicleDataForEmail(vehicleData),
                ...module.exports.sortOwnerDataForEmail(vehicleData),
                ...module.exports.sortWorkshopDataForEmail(vehicleData)
            };
            resolve(emailDataObject);
        }).catch(err => reject(err));
    });
}

module.exports.getEmailDataObject('ZFA25000002775146').then(data => {
    console.log(data)
}).catch(err => console.log(err));