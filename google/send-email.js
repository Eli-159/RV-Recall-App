const fs = require('fs');
const gmail = require('./gmail.js');
const dataFuncs = require('./data.js');
const googleAuth = require('./auth.js');

// Declares a function to get the email data map for an email tied to a specific url.
module.exports.getEmailDataMap = (url) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Reads the json file storing the data map.
        fs.readFile('./google/email-data-map.json', (err, value) => {
            // Rejects the promise if an error occurs.
            if (err) return reject(err);
            // Passes the returned json.
            const dataMap = JSON.parse(value);
            // Filters the array for all emails tied to the given url and that are active.
            const emailData = dataMap.filter(email => email.triggerUrl == url && email.active);
            // Resolves the promise, passing through the filtered array.
            resolve(emailData);
        });
    });
};

// Declares a function to substitue the data map with the values from the database.
module.exports.matchMapWithVals = (dataMap, values) => {
    // Declares a variable to hold the data map, updated with the values.
    const mapWithVals = dataMap;
    // Substitutes the address value with address value.
    mapWithVals.address = (values[mapWithVals.address] ? values[mapWithVals.address] : mapWithVals.address);
    // Gets the object keys of the replace values.
    const mapKeys = Object.keys(mapWithVals.replaceValues);
    // Loops over the keys.
    for (key in mapKeys) {
        // Loads the current object key into a variable.
        const currKey = mapKeys[key];
        // Tests if there is a value for the current item.
        if (values[mapWithVals.replaceValues[currKey]] != undefined) {
            // Updates the value.
            mapWithVals.replaceValues[currKey] = values[mapWithVals.replaceValues[currKey]];
        }
    }
    // Returns the upadated map.
    return mapWithVals;
};

// Exports a function to handle an error sending the emails.
module.exports.handleFailedEmail = (url, vin, numFails) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Reads the failed-emails.json file.
        fs.readFile('./google/failed-emails.json', (err, data) => {
            // Rejects an error if one occurs.
            if (err) return reject(err);
            // Parses the json data.
            const updatedData = JSON.parse(data);
            // Pushes a new object.
            updatedData.push({
                vin: vin,
                url: url,
                time: Date.now(),
                numFails: (numFails ? numFails+1 : 1)
            });
            // Writes the data back to the failed-emails.json file.
            fs.writeFile('./google/failed-emails.json', JSON.stringify(updatedData), (err) => {
                // Rejects an error, if one occurs, and resolves the promise if not.
                if (err) return reject(err);
                resolve();
            });
        })
    });
}

// Declares a function to send an automated email, based on the url requested and vin of the current vehicle.
module.exports.sendAutoEmail = (url, vin, numFails) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Waits for the getEmailDataMap and getEmailDataObject functions to resolve.
        Promise.all([
            module.exports.getEmailDataMap(url),
            dataFuncs.getEmailDataObject(vin)
        ]).then(data => {
            // Declares variables to hold the email data and promises respectively.
            const emailDataObject = data[1];
            const promises = [];
            // Loops over the email maps.
            for (email in data[0]) {
                // Gets the current email map.
                const currEmail = data[0][email];
                // Tests if there was an email map enabled for the given url and if the workshop email is required and present.
                if (currEmail && (currEmail.address != "workshopEmail" || emailDataObject.workshopFound)) {
                    // Loads the data map, with the substituted values, into a variable.
                    const emailDataMap = module.exports.matchMapWithVals(currEmail, emailDataObject);
                    // Sends the template email with the map data and pushes the returned promise to the previously declared array.
                    promises.push(gmail.sendTemplateEmail(emailDataMap.draftId, emailDataMap.address, emailDataMap.replaceValues));
                }
            }
            // Waits for all of the promises to resolve.
            Promise.all(promises).then(resolve).catch(err => {
                // Logs the error.
                console.log(err);
                // Calls the function to write the error to the json file.
                module.exports.handleFailedEmail(url, vin, numFails).then(resolve).catch(error => {
                    // Logs the error and resolves the promise.
                    console.log(error);
                    resolve();
                });
            });
        }).catch(err => {
            // Logs the error.
            console.log(err);
            // Calls the function to write the error to the json file.
            module.exports.handleFailedEmail(url, vin, numFails).then(resolve).catch(error => {
                // Logs the error and resolves the promise.
                console.log(error);
                resolve();
            });
        });
    });
};

module.exports.sendFailedEmails = () => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Reads the failed-emails.json file.
        fs.readFile('./google/failed-emails.json', (err, data) => {
            // Rejects an error if one occurs.
            if (err) return reject(err);
            // Clears the failed-emails.json file.
            fs.writeFile('./google/failed-emails.json', '[]', (err) => {
                // Rejects an error, if one occurs.
                if (err) return reject(err);
                // Parses the email data.
                const failedEmails = JSON.parse(data);
                // Saves the number of emails to be sent.
                const originalEmailCount = failedEmails.length;
                // Declares a function to send each email.
                const sendEmail = () => {
                    // TEsts if there are any emails left.
                    if (failedEmails.length > 0) {
                        // Removes the first element of the array and stores it in a variable.
                        const currEmail = failedEmails.shift();
                        // Calls the function to send the email, recalling this function when it is finished.
                        module.exports.sendAutoEmail(currEmail.url, currEmail.vin, currEmail.numFails).then(sendEmail).catch(sendEmail);
                    } else {
                        // If no emails remain, the failed emails json file is read.
                        fs.readFile('./google/failed-emails.json', (err, remainingEmailData) => {
                            // The promise is resolved if there is an error reading the file.
                            if (err) return resolve({original: originalEmailCount, failed: '?', sent: '?'});
                            // The read file is passed an the number of properties it has read into a variable.
                            const remainingEmailCount = JSON.parse(remainingEmailData).length;
                            // The promise is resolved with that data.
                            resolve({
                                original: originalEmailCount,
                                failed: remainingEmailCount,
                                sent: originalEmailCount-remainingEmailCount
                            });
                        });
                    }
                }
                // The previously declared function is called for the first time.
                sendEmail();
            });
        });
    });
};