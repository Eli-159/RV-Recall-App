// Inports the required libraries and other files.
const express = require('express');
const router = express.Router();
const dao = require ('../data/dao.js');
const auth = require('../models/authenticate.js');
const sendEmail = require('../google/send-email.js');

// Catches any requests ending with /contact
router.get('/', (req, res, next) => {
    // Renders the first page of the contact form.
    res.render('workshop/contact-form/first-load', {
        pageTitle: 'Contact Form',
        path: '/workshop/contact',
        role: req.payload.role
    });
});

// Catches all requests to the /verifyVin route (expected as an api call from the contact form).
router.use('/verifyVin', (req, res, next) => {
    // Gets the payload, query paramaters and method from the request and loads them into variables.
    const payload = req.payload;
    const query = req.query;
    const method = req.method;
    // Determines the vin based on the request type.
    const vin = (method=='POST' ? req.body.vin : query.vin);
    // Terminates and redirects the request if the vin is not found in the appropriate location.
    if (typeof vin != 'string' || vin.length != 17) return res.redirect('/workshop/contact');
    // Queries the database for the vehicle details of the vehicle with the vin supplied.
    dao.getVehicleByVin(vin).then(data => {
        // Tests if the vehicle was found.
        if (data != null && data != undefined) {
            // Supplies a new jwt with the vehicle infomation for future data submits.
            res.cookie('jwt', auth.generateToken({
                user: payload.user,
                role: payload.role,
                vehicleId: data.id,
                vin: vin
            }), {httpOnly: true});
            // Tests if the request was made using a post request.
            if (method == 'POST') {
                // Renders the main contact form with vehicle/owner data as a part page.
                res.render('workshop/contact-form/contact-form', {
                    ownerName: (data.owners[0] ? data.owners[0].name : ''),
                    data: data,
                    role: req.payload.role
                });
            } else {
                // Renders the main contact form with vehicle/owner data as a full page.
                res.render('workshop/contact-form/first-load', {
                    workshop: req.payload.user,
                    data: data,
                    vin: data.vin,
                    model: data.modelDesc,
                    ownerName: (data.owners[0] ? data.owners[0].name : ''),
                    role: req.payload.role,
                    skipFirstForm: true,
                    pageTitle: 'Contact Form',
                    path: '/workshop/contact',
                    role: req.payload.role
                });
            }
            
        } else {
            // If the vehicle was not found, either the status code 500 is returned or the page redirected, depending on the method.
            if (method == 'POST') {
                res.sendStatus(500);
            } else {
                res.redirect('/workshop/contact');
            }
        }
    });
});

// Catches the main submit of contact data.
router.post('/submit-contact-details', (req, res, next) => {
    // Loads the body and payload into variables.
    const body = req.body;
    const payload = req.payload;
    // Pulls the action, user and vehicle id from the body and payload and loads them into variables.
    const action = body.action;
    const user = payload.user;
    const vehicleId = payload.vehicleId;
    // Declares reasons and response variables with default values to be used in processing other data.
    let reasons = [];
    let response = null;
    // Tests for all of the reasons for contacts and appends all of the found ones to the reasons array.
    if (body.recallBookingReason) {
        reasons.push('booking');
        // If the reasons for contact include for a recall booking, the response type is set to postive, rather than null.
        response = 'positive';
        // Sends an automatic email.
        sendEmail.sendAutoEmail(req.originalUrl+'#booking', payload.vin);
    }
    if (body.ownerAcknowledgedRecallReason) {
        reasons.push('recall acknowledged');
        response = 'positive'
    }
    if (body.notOwnerReason) {
        reasons.push('not owner');
        // Sends an automatic email.
        sendEmail.sendAutoEmail(req.originalUrl+'#notOwner', payload.vin);
    }
    if (body.complaintReason) reasons.push('complaint');
    if (body.complimentReason) reasons.push('compliment');
    // Sets the reasons variable to the array constructed, joined by semicolons.
    reasons = reasons.join(';');
    // Records the recall contact with the variables declared above.
    dao.newRecallContact({
        vehicleId: vehicleId, 
        action: action, 
        response: response, 
        createdBy: user, 
        updatedBy: user
    }).then(data => {
        // When the recall contact item has been added, a recall feedback item is also appended.
        return dao.newRecallFeedback({
            recallContactId: data.dataValues.id, 
            name: body.name, 
            tag: reasons, 
            feedback: body.notes, 
            createdBy: user, 
            updatedBy: user
        });
    }).then(data => {
        // If both database call execute as expected, a success message is returned to the client.
        res.render('workshop/contact-form/success-message', {
            role: req.payload.role
        });
    }).catch(e => {
        // If an error is caught while attempting to save the data to the database, an error message with the error code 500 is returned to the client.
        res.status(500);
        res.render('errors/small-error-message', {
            errorTitle: 'Unexpected Error',
            errorBody: 'Sorry, an unexpected error occured when trying to save the data. Please try again.',
            role: req.payload.role
        });
    });
});

// The router is exported.
module.exports = router;