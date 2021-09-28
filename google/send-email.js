const fs = require('fs');
const gmail = require('./gmail.js');
const data = require('./data.js');

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
            // Searches for an email tied to the given url.
            const emailData = dataMap.find(email => email.triggerUrl == url);
            // Tests if the found email exists, and if so, is set to not active.
            if (emailData && emailData.active == false) {
                // Resolves the promise, passing undefined, the same value as if no record was found.
                resolve(undefined);
            } else {
                // Returns the record, or undefined if none were found.
                resolve(emailData);
            }
        });
    });
};