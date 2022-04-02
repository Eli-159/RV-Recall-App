// Inports the required libraries and other files.
const express = require('express');
const router = express.Router();
const dao = require ('../data/dao.js');
const auth = require('../models/authenticate.js');
const sendEmail = require('../google/send-email.js');


// If the 'get-owner-contact-details' page is requested, the necessary data is requested, reformatted and rendered in a pug file.
router.get('/get-owner-contact-details', (req, res, next) => {
    // Gets all of the current owners.
    dao.listOwnerCurrent().then(owners => {
        // The pug file is rendered with the processed owner details.
        res.render('workshop/admin/owners-contact-details', {
            pageTitle: 'All Owner Contact Details',
            path: '/workshop/admin/get-owner-contact-details',
            owners: owners,
            role: req.payload.role
        });
    });
});

// If the 'get-vehicle-details' form is requested, it is rendered and sent.
router.get('/get-vehicle-details', (req, res, next) => {
    res.render('workshop/admin/vehicle-details/first-load', {
        pageTitle: 'Get Vehicle Details',
        path: '/workshop/admin/get-vehicle-details',
        role: req.payload.role
    });
});

// If the request is for the 'vehicle-details' page, it is processed regardless of the method.
router.use('/get-vehicle-details/vehicle-details', (req, res, next) => {
    // Whether or not a the method used is POST is tested and recorded into the postMethod variable.
    const postMethod = req.method == 'POST';
    // Other variables are declared with default or no values.
    let vehiclePromise = null;
    let vin;
    let buildNo;
    if (postMethod) {
        // If the post mehtod was used, the vin and build number are loaded into their variables from the body.
        vin = req.body.vin;
        buildNo = req.body.buildNo;
    } else {
        // If the post method was not used, the vin and build number are both set to the next paramater in the url.
        vin = req.url.split('/')[1];
        buildNo = req.url.split('/')[1];
    }
    if (vin != undefined && vin != null && vin.length == 17) {
        // If the vin is deemed to potentially be valid, the vehicle fetched from it and the returned promise is loaded into its variable.
        vehiclePromise = dao.getVehicleByVin(vin);
    } else if (buildNo != undefined && buildNo != null && buildNo != '') {
        // If the vin is not deemed to potentially be valid and the build number is, the vehicle fetched from it and the returned promise is loaded into its variable.
        vehiclePromise = dao.getVehicleByBuildNo(buildNo);
    }
    if (vehiclePromise !== null) {
        // If the promise variable isn't null, a function is declared to be executed upon it resolving.
        vehiclePromise.then(data => {
            if (data != null) {
                // The data required to render the pug file is loaded into a variable.
                const renderDetails = {
                    data: data,
                    success: true,
                    pageTitle: 'Get Vehicle Details',
                    path: '/workshop/admin/get-vehicle-details',
                    role: req.payload.role
                };
                if (postMethod) {
                    // If the data was submited through a post request, a div is rendered and returned based on the renderDetails.
                    res.render('workshop/admin/vehicle-details/vehicle-data', renderDetails);
                } else {
                    // If the data was not submited through a post request, a full page is rendered and returned based on the renderDetails.
                    res.render('workshop/admin/vehicle-details/vehicle-data-page', renderDetails);
                }
            } else {
                // If the data from the vehiclePromise was equal to null, a 500 status code is returned, with a full page if it wasn't requested through a post.
                res.status(500)
                if (postMethod) {
                    res.send();
                } else {
                    res.render('workshop/admin/vehicle-details/vehicle-data-page', {
                        success: false,
                        pageTitle: 'Get Vehicle Details',
                        path: '/workshop/admin/get-vehicle-details',
                        role: req.payload.role
                    });
                }
            }
        }).catch((err) => {
            // If an error is caught while resolving vehiclePromise, a 500 status code is returned, with a full page if it wasn't requested through a post.
            res.status(500);
            if (postMethod) {
                res.send();
            } else {
                res.render('workshop/admin/vehicle-details/vehicle-data-page', {
                    success: false,
                    pageTitle: 'Get Vehicle Details',
                    path: '/workshop/admin/get-vehicle-details',
                    role: req.payload.role
                });
            }
        });
    } else {
        // If the vehiclePromise was equal to null, meaning neither the vin or build number were deemed possible,
        // A 500 status code is returned, with a full page if it wasn't requested through a post.
        if (postMethod) {
            res.sendStatus(500);
        } else {
            res.render('workshop/admin/vehicle-details/vehicle-data-page', {
                success: false,
                pageTitle: 'Get Vehicle Details',
                path: '/workshop/admin/get-vehicle-details',
                role: req.payload.role
            });
        }
    }
});


router.get('/update-owner-details', (req, res, next) => {    
    // The first-load page of the recall form is rendered and returned.
    res.render('workshop/update-owner-details/first-load', {
        pageTitle: 'MyRV Recall Form',
        path: '/workshop/elite/update-owner-details',
        role: req.payload.role
    });
});

// All requests to verify the vin of the vehicle are caught.
router.use('/update-owner-details/verifyDetails', (req, res, next) => {
    // Loads the request body, query parameters and method into a variable.
    const body = req.body;
    const query = req.query;
    const method = req.method;
    // Determines the vin based on the request type.
    const vehicleVin = (method=='POST' ? body.vin : query.vin);
    // Terminates and redirects the request if the vin is not found in the appropriate location.
    if (typeof vehicleVin != 'string' || vehicleVin.length != 17) return res.redirect('/workshop/elite/update-owner-details');
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
            // Gets the owner data, replacing it for the expected object with empty data values if it doesn't exist and then inserting it back into the data object.
            let owner;
            if (vehicleData.owners[0] != undefined && vehicleData.owners[0] != null) {
                owner = vehicleData.owners[0];
            } else {
                owner = {name: '', email: '', phone: '', street: '', suburb: '', postcode: ''};
            }
            vehicleData.owner = owner;
            // Issues a new jwt with new infomation to make sure the data is saved for the vehicle it was validated for.
            res.cookie('jwt', auth.generateToken({
                user: workshopName,
                role: workshopRole,
                owner: owner,
                vin: vehicleVin,
                model: vehicleModel,
                vehicleId: vehicleData.id,
                recallIds: recallItemIds
            }), { httpOnly: true});
            // Sets the response status to 200.
            res.status(200);
            // Gets the date as yyyy-mm-dd.
            const date = new Date();
            const year = date.getFullYear().toString();
            const month = (date.getMonth()<9 ? '0' : '') + (date.getMonth()+1).toString();
            const day = (date.getDate()<10 ? '0' : '') + date.getDate().toString();
            const stringDate = year + '-' + month + '-' + day;
            // Tests if the request was made using a post request.
            if (method == 'POST') {
                // Renders the part page pug file using the data stored in the payload.
                res.render('workshop/recall-form/details-form', {
                    data: vehicleData,
                    todayDate: stringDate,
                    allowSkip: false
                });
            } else {
                // Renders the full page pug file using the data stored in the payload.
                res.render('workshop/update-owner-details/first-load', {
                    data: vehicleData,
                    allowSkip: false,
                    skipFirstForm: true,
                    pageTitle: 'MyRV Recall Form',
                    path: '/workshop/elite/update-owner-details',
                    role: req.payload.role
                });
            }
        } else {
            // If the vehicle was not found, either the status code 500 is returned or the page redirected, depending on the method.
            if (method == 'POST') {
                res.sendStatus(500);
            } else {
                res.redirect('/workshop/elite/update-owner-details');
            }
        }
    });
});

// Catches all post requests to save owner details from the recall form.
router.post('/update-owner-details/submit-owner-details', (req, res, next) => {
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
        body.vehicleId = payload.vehicleId;
        body.createdBy = payload.user;
        body.updatedBy = payload.user;
        successPromise = dao.newOwner(body);
    }
    // Waits for the promise assigned to the 'successPromise' variable to resolve.
    successPromise.then(() => {
        // If the 'successPromise' resolves without error, the success message page is rendered and returned.
        res.render('workshop/update-owner-details/success-message', {
            role: req.payload.role
        });
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

router.get('/vehicle-checklist', (req, res, next) => {
    // Gets the vin from the query string.
    const vin = req.query.vin;
    // Defines a function to execute if an error occurs.
    const failFunc = () => {
        // Renders the full page error pug page.
        res.render('errors/full-page-error', {
            errorHeading: 'Checklist Load Failed',
            errorBody: 'The creation of the checklist failed and it could not be loaded.',
            includeRedirect: true,
            redirectTime: 20,
            redirectAddress: '/workshop/elite/get-vehicle-details/vehicle-details/' + vin,
            redirectPageName: 'Vehicle Details',
            pageTitle: 'Checklist Fail',
            path: '/workshop/elite/checklist',
            role: req.payload.role
        });
    };
    // Gets the vehicle data using the stored vin.
    dao.getVehicleByVin(vin).then(vehicleData => {
        if (vehicleData) {
            // Gets the checklist data using the ipa from the vehicle data.
            dao.listChecklistItemByIpa(vehicleData.ipa, String(vehicleData.buildNo).substring(0, 2)).then(checklistData => {
                if (checklistData) {
                    // Renders the checklist page with the data fetched.
                    res.render('workshop/checklist', {
                        vehicleData: vehicleData,
                        checklistItems: checklistData,
                        pageTitle: 'Build Checklist - ' + vehicleData.ipa,
                        path: '/workshop/elite/checklist',
                        role: req.payload.role
                    });
                } else {
                    failFunc();
                }
            }).catch(failFunc);
        } else {
            failFunc();
        }
    }).catch(failFunc);
});

module.exports = router;