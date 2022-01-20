// Inports required libraries and other files.
const express = require('express');
const router = express.Router();
const path = require('path');
const dao = require ('../data/dao.js');
const vehicle = require('../data/models/vehicle.js');
const auth = require('../models/authenticate.js');

// /email/recall-registration/ZFA25000002775146/123457188700
// Catches all requests for the owner-details form from the email.
router.use(['/owner-registration/:vin/:trackingNumber', '/recall-registration/:vin/:trackingNumber'], (req, res, next) => {
    // Loads the url parameters into a variable.
    const urlParams = req.params;
    // Loads the vin and tracking number into variables.
    const vin = urlParams.vin;
    const trackingNumber = urlParams.trackingNumber;
    // Tests that the vin and tracking number are correctly formatted and could be correct.
    if ((vin != undefined && vin != null && vin.length == 17) && (trackingNumber != undefined && trackingNumber != null && !isNaN(parseInt(trackingNumber)))) {
        // If the vin and tracking number appear to be fine, the vehicle id is extracted from the tracking number.
        const vehicleId = parseInt(trackingNumber)/process.env.TRACKING_MULTIPLIER;
        // Quiries the database for data on the vehicle with the vin given.
        dao.getVehicleByVin(vin).then(data => {
            // Tests that the data from the database is not null, meaning the vehicle doesn't exist.
            if (data != null) {
                // The vehicle id from the database is compared to the one extracted from the tracking number to ensure the data is valid.
                if (data.id == vehicleId) {
                    // If the two ids match, a 'vehicleTrackingData' cookie is added to the response with the data from the url parameters.
                    res.cookie('vehicleTrackingData', JSON.stringify(urlParams));
                }
            }
            // The request is redirected to the owner registration form, regardless of whether the cookie was added.
            res.redirect((req.originalUrl.includes('/recall-registration')) ? '/recall-registration/verifyDetails' : '/owner-registration/verifyDetails');
        });
    } else {
        // If the vin and tracking number were not formatted correctly, the request is redirected to the owner registration form.
        // This has to be done seperatly to the previous redirect as the one above is inside a '.then' statement.
        res.redirect((req.originalUrl.includes('/recall-registration')) ? '/recall-registration/verifyDetails' : '/owner-registration/verifyDetails');
    }
});
// Catches all requests that are passed in from the submit of the owner registration form.
router.use('/submit-details', (req, res, next) => {
    // Tests if the response status is 200, meaning it has a valid jwt.
    if (res.statusCode == 200) {
        // Deletes the vehicle tracking cookie from the response, regardless of success.
        res.clearCookie('vehicleTrackingData', {path: '/'});
        // Proceeds to the next function.
        next();
    } else {
        // If the response status was not 200, the request is allowed to proceed to the next function without the cookie deleted.
        next();
    }
});

// https://test.my-rv.com.au/email/logo/ZFA25000002E10013/246914377400
// https://test.my-rv.com.au/email/logo/ZFA25000002775146/123457188700
// Catches all requests for the email tracking image.
router.use('/logo/:vin/:trackingNumber', (req, res, next) => {
    // Sends the image file so that there is no delay.
    res.status(200);
    res.download(path.resolve('./Public/images/email-logo.png'), 'Email_Logo.png');
    // Loads the vin and tracking number into variables.
    const vin = req.params.vin;
    const trackingNumber = req.params.trackingNumber;
    // Tests that the vin and tracking number are formatted correctly.
    if (vin != null && vin != undefined && vin.length == 17 && trackingNumber != null && trackingNumber != undefined && !isNaN(parseInt(trackingNumber))) {
        // If the vin and tracking number were correctly formatted, the vehicle id is extracted from the tracking number.
        const vehicleId = trackingNumber/process.env.TRACKING_MULTIPLIER;
        // Quiries the database for the vehicled data associated with the vin supplied.
        dao.getVehicleByVin(vin).then(rawData => {
            // Tests that the data from the database is not null, meaning the vehicle doesn't exist.
            if (rawData != null) {
                // The data from the json is cleaned up using a stringify and parse.
                const data = JSON.parse(JSON.stringify(rawData));
                // The vehicle id from the database is compared to the one extracted from the tracking number to ensure the data is valid.
                if (data.id == vehicleId) {
                    // A new recall contact record in created.
                    dao.newRecallContact({
                        vehicleId: vehicleId, 
                        action: 'image', 
                        response: 'passive', 
                        createdBy: 'owner', 
                        updatedBy: 'owner'
                    });
                }
            }
        });
    }
});

module.exports = router;