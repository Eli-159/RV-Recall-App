// Inports the required libraries and other files.
const express = require('express');
const router = express.Router();
const fs = require('fs');
const csv = require('csv-parser');
const stripBom = require('strip-bom-stream');

const dao = require ('../data/dao.js');
const reportsRoutes = require('./reports.js');

// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         cb(null, '/');
//     },

//     // By default, multer removes file extensions so let's add them back
//     filename: function(req, file, cb) {
//         cb(null, 'vehicle.csv');
//     }
// });


// If no further route is provided, the client is redirected to the actions page.
router.get('/', (req, res, next) => {
    res.redirect('/workshop/actions');
});

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

// If the request url includes '/reports', it is parsed off to the reports routes file.
router.use('/reports', reportsRoutes);

// If the request url is for the '/csv-upload' route, the initial page is rendered.
router.get('/csv-upload', (req, res, next) => {
    res.render('workshop/admin/update-csv/csv-upload-form', {
        pageTitle: 'Upload CSV',
        path: '/workshop/admin/csv-upload',
        role: req.payload.role
    })
});

// If the request to submit the vehicle csv file, the file is processed and saved.
router.post('/csv-upload/submit', (req, res, next) => {
    // Defines a function to execute if an error occurs.
    const failFunc = reason => {
        // Renders the full page error pug page.
        res.render('errors/full-page-error', {
            errorHeading: 'Vehicle Upload Failed',
            errorBody: 'The vehilcle upload failed. ' + reason,
            includeRedirect: true,
            redirectTime: 20,
            redirectAddress: '/workshop/admin/csv-upload/',
            redirectPageName: 'Upload Vehicle Data',
            pageTitle: 'Vehicle Upload Failed',
            path: '/workshop/admin/csv-upload/',
            role: req.payload.role
        });
    };

    // Tests if a file has been submitted.
    if (!req.files || Object.keys(req.files).length === 0) {
        // Executes the failFunc.
        return failFunc('No file was found.');
    }
    // Saves the csv file to the data folder and provides a callback.
    req.files.csvFile.mv('./data/vehicle_upload.csv', function(err) {
        // Executes the failFunc if an error occurs.
        if (err) return failFunc('An unexpected error occured while attempting to save the file.');

        // Method to handle update & insert of vehicle records from the CSV file
        const upsertVehicle = (vehicle, user) => {
          const upsertResult = (action, id, vin, msg) => {return {action, id, vin, msg}};
          return new Promise((resolve, reject) => {
            // Attempt to update the vehicle record
            dao.updateVehicle(vehicle, user)
            .then(res => {
              if (res[0] == 0) {
                // No record was modified by the update so insert the record
                dao.loadVehicle(vehicle, user)
                .then(res => {
                  if (res[1] != 1) {
                    // Insert failed
                    resolve(upsertResult('Failed', vehicle.id, vehicle.vin))
                  } else {
                    resolve(upsertResult('Inserted', vehicle.id, vehicle.vin))  
                  }
                })
                .catch(err => resolve(upsertResult('Failed', vehicle.id, vehicle.vin, err)));
                
              } else {
                // Update succeeded
                resolve(upsertResult('Updated', vehicle.id, vehicle.vin))
              }
            })
            .catch(err => resolve(upsertResult('Failed', vehicle.id, vehicle.vin, err)))
          })
        }

        const expectedLine = 'id,ipa,buildNo,vin,engineNo,modelDesc,addSpec,variantCode';
        let results = [];
        try {
            let csvStream = fs.createReadStream('./data/vehicle_upload.csv')
            csvStream.on('error', (e) => {failFunc(e)})
            .pipe(stripBom())
            .pipe(csv())
            .on('headers', (headers) => {
                // Verify headers match expected
                if (headers.join(',').trim() != expectedLine) {
                    csvStream.emit('error', new Error('CSV file headers do not match the expected values'));
                }
            })
            .on('data', (rowData) => {
                results.push(upsertVehicle(rowData, req.payload.user));
            })
            .on('end', () => {
                Promise.all(results)
                .then((dbUpdates) => {
                    let summ = dbUpdates.reduce((final, current) => {
                        final.actions[current.action] = (final.actions[current.action] || 0) + 1;
                        if (current.action == 'Failed') {final.errs.push(current)}
                        return final
                    }, {actions: {}, errs: []});
                    // Renders the success page.
                    res.render('workshop/admin/update-csv/upload-success', {
                        pageTitle: 'Upload CSV',
                        path: '/workshop/admin/csv-upload',
                        role: req.payload.role,
                        data: summ
                    });
                })
            })
        } catch (e) {
            failFunc(e);
        }
    });
});

// The router is exported.
module.exports = router;