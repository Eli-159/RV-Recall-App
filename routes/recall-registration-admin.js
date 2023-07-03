// Inports the required libraries and files.
const express = require('express');
const router = express.Router();
const dao = require ('../data/dao.js');
const sendEmail = require('../google/send-email.js');

// Catches all requests to verify the owner details from the first page of the form.
router.get('/', (req, res, next) => {
    // Gets the given VIN and Build Number.
    const vin = req.query.vin;
    // Sets the values for the log object, with success defaulting to false.
    const logDetails = {
        ip: req.ip,
        url: req.originalUrl,
        user: req.payload.user,
        success: false
    }

    if (vin && typeof vin == 'string' && vin.length == 17) {
        // Queries the database to see if there are any vins matching the one given.
        dao.getVehicleByVin(vin).then(data => {
            // Tests the data isn't null, which means the vehicle cannot be found.
            if (data != null) {
                // Sets the response status to 200.
                res.status(200);
                // Gets the date as yyyy-mm-dd.
                const date = new Date();
                const year = date.getFullYear().toString();
                const month = (date.getMonth()<9 ? '0' : '') + (date.getMonth()+1).toString();
                const day = (date.getDate()<10 ? '0' : '') + date.getDate().toString();
                const stringDate = year + '-' + month + '-' + day;
                // Renders the second page of the owner registration form (details form) with the model description as a full page load.
                res.render('workshop/admin/recall-registration-admin-form', {
                    pageTitle: 'Owner Details Form',
                    path: req.baseUrl,
                    data: data,
                    todayDate: stringDate,
                    recallSection: true,
                    emailLink: true,
                    admin: true
                });
                // Changes the success value of the log object to true.
                logDetails.success = true;
            } else {
                // Show an error page
                res.render('errors/full-page-error', {
                    pageTitle: 'MyRV Owner Details Form',
                    path: req.baseUrl,
                    errorHeading: 'Vehicle Doesn\'t Exist',
                    errorBody: 'No vehicle with that Vin could be found',
                    includeRedirect: false
                });
            }
            // Logs the log object to the database.
            dao.newAccessLog(logDetails);
        });
    } else {
        // Show an error page
        res.render('errors/full-page-error', {
            pageTitle: 'MyRV Owner Details Form',
            path: req.baseUrl,
            errorHeading: 'Invalid Vin',
            errorBody: 'No recognised vehicle Vin was provided',
            includeRedirect: false
        });
    }
});

// Catches all post requests to submit the owner regestration details form.
router.post('/submit-details', (req, res, next) => {
    // Loads the body of the request into a variable.
    const body = req.body;
    // Sets the updatedBy value for database calls.
    body.updatedBy = req.payload.user;
    // Gets the vehicle data.
    dao.getVehicleByVin(body.vin)
    .then(vehicleData => {
        // Sets the vehicleId for database calls.
        body.vehicleId = vehicleData.id;
        // Tests if the name given is the same as the one previously recorded.
        if (vehicleData.owners != null && vehicleData.owners[0].name.toLowerCase() == body.name.toLowerCase()) {
            // Updates the data in the body for the database call, and then calls the updateOwner function using the body data.
            body.id = vehicleData.owners[0].id;
            return dao.updateOwner(body);
        } else {
            // Updates the data in the body for the database call, and then calls the newOwner function using the body data.
            body.createdBy = req.payload.user;
            return dao.newOwner(body);
        }
    })
    .then(data => {
        // Tests if the request came from the recall registration page, and if so, creates a new recall contact record.
        return dao.newRecallContact({
            vehicleId: body.vehicleId,
            action: 'recall registration', 
            response: 'positive', 
            createdBy: req.payload.user, 
            updatedBy: req.payload.user
        });
    })
    .then(data => {
        // Tests if the request came from the recall registration page, and if so, creates a new recall feedback record.
        return dao.newRecallFeedback({
            recallContactId: data.dataValues.id, 
            name: body.name, 
            tag: 'recall acknowledged', 
            feedback: body.workshopChoice + ';' + body.notes, 
            createdBy: req.payload.user, 
            updatedBy: req.payload.user
        })
    })
    .then(data => {
        // Renders the success message (using an error message template).
        res.render('errors/general-redirect-error', {
            errorHeading: 'Recall Contact Successfully Submitted',
            errorBody: 'The owner infomation has been updated and a positive recall contact record was created',
            includeRedirect: true,
            redirectTime: 10,
            redirectAddress: `/workshop/elite/get-vehicle-details/vehicle-details/${body.vin}`,
            redirectPageName: 'Vehicle Details'
        });
        // Calls the auto email function.
        sendEmail.sendAutoEmail('/recall-registration/submit-details', body.vin);
    })
    .catch(err => {
        console.log(err);
        // Returns a status of 500 with an unexpected error message.
        res.status(500);
        res.render('errors/small-error-message', {
            errorTitle: 'An Unexpected Error Occured',
            errorBody: 'Sorry, an unexpected error occured when trying to save your data. Please try agian.',
            hide: true
        });
    });
});

// The router is exported.
module.exports = router;