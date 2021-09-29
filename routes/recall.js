// The required libraries and other files are inported.
const express = require('express');
const router = express.Router();
const dao = require ('../data/dao.js');
const auth = require('../models/authenticate.js');
const sendEmail = require('../google/send-email.js');

// All get requests for the recall form are caught.
router.get('/', (req, res, next) => {
    // The first-load page of the recall form is rendered and returned.
    res.render('workshop/recall-form/first-load', {
        pageTitle: 'MyRV Recall Form',
        path: '/workshop/recall',
        role: req.payload.role
    });
});

// All post requests to verify the vin of the vehicle are caught.
router.use('/verifyDetails', (req, res, next) => {
    // Loads the request body, query parameters and method into a variable.
    const body = req.body;
    const query = req.query;
    const method = req.method;
    // Determines the vin based on the request type.
    const vehicleVin = (method=='POST' ? body.vin : query.vin);
    // Terminates and redirects the request if the vin is not found in the appropriate location.
    if (typeof vehicleVin != 'string' || vehicleVin.length != 17) return res.redirect('/workshop/recall');
    // Quiries the database for the vehicle data matching the vin provided in the body of the request.
    dao.getVehicleByVin(vehicleVin).then(vehicleData => {
        // Tests if the vehicle was found, which is inplied by the data being equal to null.
        if (vehicleData != null) {
            // Declares variables with the data required for rendering the pug file.
            const workshopName = req.payload.user;
            const workshopRole = req.payload.role;
            const vehicleModel = vehicleData.modelDesc;
            const givenRecallItems = vehicleData.recallItems;
            const recallItems = [];
            const recallItemIds = [];
            // Loops over the recall items given by the database to generate a reformatted array for pug and an array of ids for the payload.
            for (let i = 0; i < givenRecallItems.length; i++) {
                // Pushes an object containing recall and vehicle recall data. For use in rendering the pug file.
                recallItems.push({
                    name: givenRecallItems[i].description,
                    workInstructions: givenRecallItems[i].workInstructionUrl,
                    status: givenRecallItems[i].vehicleRecallItem.status,
                    id: givenRecallItems[i].vehicleRecallItem.id
                });
                // Pushes the id of the vehcile recall item to an array if its status is new. For use in JWT payload and saving data later.
                if (givenRecallItems[i].vehicleRecallItem.status == 'new') {
                    recallItemIds.push(givenRecallItems[i].vehicleRecallItem.id);
                }
            }
            // Gets the owner data, replacing it for the expected object with empty data values if it doesn't exist.
            let owner;
            if (vehicleData.owners[0] != undefined && vehicleData.owners[0] != null) {
                owner = vehicleData.owners[0];
            } else {
                owner = {name: '', email: '', phone: '', street: '', suburb: '', postcode: ''};
            }
            // Issues a new jwt with new infomation to make sure the data is saved for the vehicle it was validated for.
            res.cookie('jwt', auth.generateToken({
                user: workshopName,
                role: workshopRole,
                owner: owner,
                vin: vehicleVin,
                buildNo: vehicleData.buildNo,
                modelDesc: vehicleModel,
                vehicleId: vehicleData.id,
                recallIds: recallItemIds
            }), { httpOnly: true});
            // Sets the response status to 200.
            res.status(200);
            // Tests if the request was made using a post request.
            if (method == 'POST') {
                // Renders the part page pug file using the data stored in the previously delacred variables.
                res.render('workshop/recall-form/recall-work-form', {
                    workshop: workshopName,
                    vin: vehicleVin,
                    model: vehicleModel,
                    recallWorkItems: recallItems,
                    role: req.payload.role,
                    data: vehicleData
                });
            } else {
                // Renders the full page pug file using the data stored in the previously delacred variables.
                res.render('workshop/recall-form/first-load', {
                    workshop: workshopName,
                    vin: vehicleVin,
                    model: vehicleModel,
                    recallWorkItems: recallItems,
                    skipFirstForm: true,
                    data: vehicleData,
                    pageTitle: 'MyRV Recall Form',
                    path: '/workshop/recall',
                    role: req.payload.role
                });
            }
        } else {
            // If the vehicle was not found, either the status code 500 is returned or the page redirected, depending on the method.
            if (method == 'POST') {
                res.sendStatus(500);
            } else {
                res.redirect('/workshop/recall');
            }
        }
    });
});

// Catches all post requests to submit the recall work details.
router.post('/submit-recall-work-details', (req, res, next) => {
    // Loads the body and payload into variables.
    const body = req.body;
    const payload = req.payload;
    // Declares an array to hold the promises from the database when trying to save the data.
    const promises = [];
    // Loops over all of the recallIds in the payload.
    for (let i = 0; i < payload.recallIds.length; i++) {
        // Tests if the vehicle recall item was checked off on the form (body item value is the checked property of the checkbox).
        if (body[payload.recallIds[i]]) {
            // If it has been checked, the promise returned by the database is pushed to the array.
            promises.push(dao.updateVehicleRecallItem({
                id: payload.recallIds[i],
                status: 'complete',
                updatedBy: payload.user
            }, payload));
        }
    }
    // Waits for all of the promises in the array to resolve.
    Promise.all(promises).then(() => {
        // Tests if the current user has the role of elite or admin.
        if (payload.role == 'elite' || payload.role == 'admin') {
            // Gets the date as yyyy-mm-dd.
            const date = new Date();
            const year = date.getFullYear().toString();
            const month = (date.getMonth()<9 ? '0' : '') + (date.getMonth()+1).toString();
            const day = (date.getDate()<10 ? '0' : '') + date.getDate().toString();
            const stringDate = year + '-' + month + '-' + day;
            // The owner details form is rendered and returned.
            res.render('workshop/recall-form/details-form', {
                data: payload,
                todayDate: stringDate
            });
        } else {
            // Returns the success page.
            res.render('workshop/recall-form/success-message', {
                role: req.payload.role
            });
        }
    }).catch(err => {
        // If an error occurs when saving the data, the status is set to 500 and a small error message is rendered and returned.
        res.status(500);
        res.render('errors/small-error-message', {
            errorTitle: 'Unexpected Error',
            errorBody: 'Sorry, an unexpected error occured when trying to save the data. Please try again.',
            role: req.payload.role
        });
    });
});

// Catches all post requests to save owner details from the recall form.
router.post('/submit-owner-details', (req, res, next) => {
    // Loads the request body and payload into variables.
    const body = req.body;
    const payload = req.payload;
    // Defines a variable to hold a promise.
    let successPromise;
    // Tests if the owner is known.
    if (payload.owner.name.toLowerCase() == body.name.toLowerCase() && payload.owner.id != undefined) {
        // Updates the owner if the owner is known with the new data and assigns the returned promise to the 'successPromise' variable.
        body.id = payload.owner.id;
        body.updatedBy = payload.user;
        successPromise = dao.updateOwner(body);
    } else {
        // Creates a new owner if the owner given is not known and assigns the returned promise to the 'successPromise' variable.
        body.createdBy = payload.user;
        body.updatedBy = body.createdBy;
        body.vehicleId = payload.vehicleId;
        successPromise = dao.newOwner(body);
    }
    // Waits for the promise assigned to the 'successPromise' variable to resolve.
    successPromise.then(() => {
        // If the 'successPromise' resolves without error, the success message page is rendered and returned.
        res.render('workshop/recall-form/success-message', {
            role: req.payload.role
        });
        // Sends automatic email.
        sendEmail.sendAutoEmail(req.originalUrl, payload.vin);
    }).catch(err => {
        // If an error occurs while trying to save the data, the status code is set to 500 and a small error rendered and returned.
        res.status(500);
        res.render('errors/small-error-message', {
            errorTitle: 'Unexpected Error',
            errorBody: 'Sorry, an unexpected error occured when trying to save the data. Please try again.',
            role: req.payload.role
        });
    });
});

// Catches all post requests to skip the owner details submit.
router.post('/skip-details-submit', (req, res, next) => {
    // Renders and returns the success message page.
    res.render('workshop/recall-form/success-message', {
        role: req.payload.role
    });
});

// Exports the router.
module.exports = router;