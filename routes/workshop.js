// Inports the required libraries and other files.
const express = require('express');
const router = express.Router();
const gmail = require('../google/gmail.js');

// Inports the other files containing routes accessed through this file.
const eliteRoutes = require('./elite.js')
const adminRoutes = require('./admin.js');
const recallRoutes = require('./recall.js');
const contactRoutes = require('./contact.js');

// Catches all requests requests that end on the '/workshop' route.
router.get('/', (req, res, next) => {
    // Redirects the request to the actions page.
    res.redirect('/workshop/actions');
});

// Catches all requests for the actions page
router.get('/actions', (req, res, next) => {
    // Decalres a promise.
    new Promise((resolve, reject) => {
        // Tests if the role is admin.
        if (req.payload.role == 'admin') {
            // Gets the gmail health update and returns the data.
            gmail.getHealthUpdate().then(data => resolve(data))
        } else {
            // Resolves the promise, returning an empty object.
            resolve({});
        }
    }).then(emailHealthData => {
        // Renders and returns the actions page.
        res.render('workshop/actions', {
            healthData: emailHealthData,
            pageTitle: 'Admin Actions - MyRV',
            role: req.payload.role,
            path: '/workshop/actions',
            role: req.payload.role
        });
    })
});

// Catches all requests going through the recall route and points them to the recall routes file.
router.use('/recall', recallRoutes);

// Catches all requests going through the contact route and points them to the contact routes file.
router.use('/contact', contactRoutes);

// Catches all requests going through the elite route and points them to the elite routes file.
router.use('/elite', eliteRoutes);

// Catches all requests going through the admin route and points them to the admin routes file.
router.use('/admin', adminRoutes);


// Exports the router.
module.exports = router;