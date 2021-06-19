// Inports the required libraries and files.
const express = require('express');
const router = express.Router();
const dao = require ('../data/dao.js');
const auth = require('../models/authenticate.js');
const emailRoutes = require('./email.js');

// Catches all get requests to the owner details form.
router.get('/', (req, res, next) => {
    // Declares a variable to hold a vin if one is found.
    let vin;
    // Checks to see if a vehicleTrackingData cookie is present, as if so it should contain a vin.
    if (req.cookies.vehicleTrackingData != undefined && req.cookies.vehicleTrackingData != null && req.cookies.vehicleTrackingData != '') {
        // If so, the cookie is parsed as a JSON and the vin is extracted.
        vin = JSON.parse(req.cookies.vehicleTrackingData).vin;
    }
    // The first-load page of the form is rendered, passing the vin in so it can be prefilled. Pug checks it isn't null.
    res.render('owner-details/first-load', {
        pageTitle: 'MyRV Owner Details Form',
        path: '/owner-registration',
        vin: vin
    });
});

// Catches all post requests to veriry the owner details from the first page of the form.
router.post('/verifyDetails', (req, res, next) => {
    // Gets the given VIN and Build Number.
    const givenVin = req.body.vin;
    const givenBuildNo = req.body.buildNo;
    // Sets the values for the log object, with success defaulting to false.
    const logDetails = {
        ip: req.ip,
        url: req.originalUrl,
        user: 'owner',
        success: false
    }
    // Queries the database to see if there are any vins matching the one given.
    dao.getVehicleByVin(givenVin).then(data => {
        // Tests the data isn't null, which means the vehicle cannot be found.
        if (data != null) {
            // Tests that the given build number is the same as the one returned by the database.
            if (givenBuildNo == data.buildNo) {
                // Provided the previous two tests are passed, a JWT is issued and added to the response as a cookie.
                // TODO: Add secure true option to cookie.
                res.cookie("jwt", auth.generateToken({
                    user: 'owner',
                    role: 'owner', 
                    id: data.id, 
                    vin: data.vin
                }), { httpOnly: true});
                // Sets the response status to 200.
                res.status(200);
                // Renders the second page of the owner registration form (details form) with the model description.
                res.render('owner-details/details-form', {
                    data: data
                });
                // Changes the success value of the log object to true.
                logDetails.success = true;
            } else {
                // Returns the status 500 if the two build numbers were not matches.
                res.sendStatus(500);
            }
        } else {
            // Returns the status 500 if the data returned from the database was null.
            res.sendStatus(500);
        }
        // Logs the log object to the database.
        dao.newAccessLog(logDetails);
    });
});

// Catches all post requests to submit the owner regestration details form.
router.post('/submit-details', auth.authenticateToken, emailRoutes, (req, res, next) => {
    // Tests that the response status is 200.
    if (res.statusCode == 200) {
        // Tests that the role of the user is owner.
        if (req.payload.role == 'owner') {
            // Loads the body of the request into a variable.
            const body = req.body;
            // Adds the new owner to the database using the vehicleId from the payload and the data from the request body.
            body.vehicleId = req.payload.id;
            body.createdBy = 'owner';
            body.updatedBy = 'owner';
            dao.newOwner(body)
            .then(data => {
                // Renders the success message page.
                res.render('owner-details/success-message');
            })
            .catch(err => {
                // Returns a status of 500 with an unexpected error message.
                res.status(500);
                res.render('errors/small-error-message', {
                    errorTitle: 'An Unexpected Error Occured',
                    errorBody: 'Sorry, an unexpected error occured when trying to save your data. Please try agian.',
                    hide: true
                });
            });
        } else {
            // If the role of the user was not 'owner', the status is set to 401 and an unauthorized error is returned.
            res.status(401);
            res.render('errors/general-redirect-error', {
                errorHeading: 'Unauthorized',
                errorBody: 'Sorry, it appears you are unauthorized to save that data.',
                includeRedirect: true,
                redirectTime: 15,
                redirectAddress: '/owner-registration',
                redirectPageName: 'Owner Registration'
            });
        }
    } else if (res.statusCode == 401) {
        // If the response status is 401, an unauthorized error is returned.
        res.render('errors/general-redirect-error', {
            errorHeading: 'Unauthorized',
            errorBody: 'Sorry, it appears you are unauthorized to save that data.',
            includeRedirect: true,
            redirectTime: 15,
            redirectAddress: '/owner-registration',
            redirectPageName: 'Owner Registration'
        });
    } else if (res.statusCode == 403) {
        // If the response status is 403, a page timeout error is returned.
        res.render('errors/general-redirect-error', {
            errorHeading: 'Page Timeout',
            errorBody: 'Sorry, it appears your connection timed out. Please try again.',
            includeRedirect: true,
            redirectTime: 15,
            redirectAddress: '/owner-registration',
            redirectPageName: 'Owner Registration'
        });
    }
});

// The router is exported.
module.exports = router;