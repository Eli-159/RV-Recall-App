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
        if (values[mapWithVals.replaceValues[currKey]]) {
            // Updates the value.
            mapWithVals.replaceValues[currKey] = values[mapWithVals.replaceValues[currKey]];
        }
    }
    // Returns the upadated map.
    return mapWithVals;
};



// Declares a function to send an automated email, based on the url requested and vin of the current vehicle.
module.exports.sendAutoEmail = (url, vin) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Waits for the getEmailDataMap and getEmailDataObject functions to resolve.
        Promise.all([
            module.exports.getEmailDataMap(url),
            dataFuncs.getEmailDataObject(vin)
        ]).then(data => {
            // Tests if there was an email map enabled for the given url.
            if (data[0]) {
                // Loads the data map, with the substituted values, into a variable.
                const emailDataMap = module.exports.matchMapWithVals(data[0], data[1]);
                // Sends the template email with the map data.
                gmail.sendTemplateEmail(emailDataMap.draftId, emailDataMap.address, emailDataMap.replaceValues).then(resolve).catch(err => {
                    console.log(err);
                });
            }
        }).catch(err => console.log(err));
    });
};