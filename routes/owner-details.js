// Inports the required libraries and files.
const express = require('express');
const router = express.Router();
const dao = require ('../data/dao.js');
const auth = require('../models/authenticate.js');
const emailRoutes = require('./email.js');

// Catches all get requests to the owner details form.
router.get('/', (req, res, next) => {
    // The first-load page of the form is rendered, passing the vin in so it can be prefilled. Pug checks it isn't null.
    res.render('owner-details/first-load', {
        pageTitle: 'MyRV Owner Details Form',
        path: req.baseUrl
    });
});

// Catches all requests to veriry the owner details from the first page of the form.
router.use('/verifyDetails', (req, res, next) => {
    // Gets the given VIN and Build Number.
    let givenVin = req.body.vin;
    let givenBuildNo = req.body.buildNo;
    let givenId;
    // Checks to see if a vehicleTrackingData cookie is present, as if so it should contain a vin.
    if (req.cookies.vehicleTrackingData != undefined && req.cookies.vehicleTrackingData != null && req.cookies.vehicleTrackingData != '') {
        // The tracking data is taken from the cookie and put into the data.
        const trackingData = JSON.parse(req.cookies.vehicleTrackingData);
        givenVin = trackingData.vin;
        givenId = parseInt(trackingData.trackingNumber)/process.env.TRACKING_MULTIPLIER;
    }
    // Sets the values for the log object, with success defaulting to false.
    const logDetails = {
        ip: req.ip,
        url: req.originalUrl,
        user: 'owner',
        success: false
    }
    // Tests if it is a new page request, and if so, if there is a vin input.
    if (req.method == 'GET' && (typeof givenVin != 'string' || givenVin == '')) {
        // Redirects to the verify details page.
        return res.redirect(req.baseUrl.includes('/recall-registration') ? '/recall-registration' : '/owner-registration');
    }
    // Queries the database to see if there are any vins matching the one given.
    dao.getVehicleByVin(givenVin).then(data => {
        // Tests the data isn't null, which means the vehicle cannot be found.
        if (data != null) {
            // Tests that the given build number is the same as the one returned by the database.
            if (givenBuildNo == data.buildNo || givenId == data.id) {
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
                // Gets the date as yyyy-mm-dd.
                const date = new Date();
                const year = date.getFullYear().toString();
                const month = (date.getMonth()<9 ? '0' : '') + (date.getMonth()+1).toString();
                const day = (date.getDate()<10 ? '0' : '') + date.getDate().toString();
                const stringDate = year + '-' + month + '-' + day;
                if (req.method == 'POST') {
                    // Renders the second page of the owner registration form (details form) with the model description.
                    res.render('owner-details/details-form', {
                        data: data,
                        todayDate: stringDate,
                        recallSection: req.headers.referer.includes('/recall-registration')
                    });
                } else {
                    // Renders the second page of the owner registration form (details form) with the model description as a full page load.
                    console.log(data.owners[0]);
                    res.render('owner-details/first-load', {
                        pageTitle: 'MyRV Owner Details Form',
                        path: req.baseUrl,
                        skipFirstForm: true,
                        data: data,
                        todayDate: stringDate,
                        recallSection: (req.originalUrl.includes('/recall-registration') || (req.headers.referer && req.headers.referer.includes('/recall-registration'))),
                        emailLink: (givenId != undefined)
                    });
                }
                // Changes the success value of the log object to true.
                logDetails.success = true;
            } else {
                // Tests if the method used was post.
                if (req.method == 'POST') {
                    // Returns the status 500.
                    res.sendStatus(500);
                } else {
                    // Redirects to the verify details page.
                    res.redirect(req.baseUrl.includes('/recall-registration') ? '/recall-registration' : '/owner-registration');
                }
            }
        } else {
            // Tests if the method used was post.
            if (req.method == 'POST') {
                // Returns the status 500.
                res.sendStatus(500);
            } else {
                // Redirects to the verify details page.
                res.redirect(req.baseUrl.includes('/recall-registration') ? '/recall-registration' : '/owner-registration');
            }
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
            // Updates data in the body for the database calls.
            body.vehicleId = req.payload.id;
            body.updatedBy = 'owner';
            // Gets the vehicle data.
            dao.getVehicleByVin(req.payload.vin)
            .then(vehicleData => {
                // Tests if the name given is the same as the one previously recorded.
                if (vehicleData.owners != null && vehicleData.owners[0].name.toLowerCase() == body.name.toLowerCase()) {
                    // Updates the data in the body for the database call, and then calls the updateOwner function using the body data.
                    body.id = vehicleData.owners[0].id;
                    return dao.updateOwner(body);
                } else {
                    // Updates the data in the body for the database call, and then calls the newOwner function using the body data.
                    body.createdBy = 'owner';
                    return dao.newOwner(body);
                }
            })
            .then(data => {
                // Tests if the request came from the recall registration page, and if so, creates a new recall contact record.
                if (req.headers.referer.includes('/recall-registration')) {
                    return dao.newRecallContact({
                        vehicleId: req.payload.id, 
                        action: 'recall registration', 
                        response: 'positive', 
                        createdBy: 'owner', 
                        updatedBy: 'owner'
                    });
                }
            })
            .then(data => {
                // Tests if the request came from the recall registration page, and if so, creates a new recall feedback record.
                if (req.headers.referer.includes('/recall-registration')) {
                    return dao.newRecallFeedback({
                        recallContactId: data.dataValues.id, 
                        name: body.name, 
                        tag: 'recall acknowledged', 
                        feedback: body.workshopChoice + ';' + body.notes, 
                        createdBy: 'owner', 
                        updatedBy: 'owner'
                    })
                }
            })
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