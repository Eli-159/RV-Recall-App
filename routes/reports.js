// Inports the required libraries and other files.
const express = require('express');
const router = express.Router();
const auth = require('../models/authenticate.js');
const fs = require('fs');
const path = require('path');

// Catches all requests for the reports route.
router.get('/', (req, res, next) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const filesData = [];
    fs.readdir('./data/reports', (err, files) => {
        files.forEach(file => {
            if (file.includes('MonthlyReport.zip')) {
                filesData.unshift({
                    file: file,
                    title: months[parseInt(file[4] + file[5])-1] + ' ' + file[0] + file[1] + file[2] + file[3] + ' Report'
                });
            }
        });
        res.render('workshop/admin/reports/select-file.pug', {
            monthlyReports: filesData,
            pageTitle: 'Select Report',
            path: '/workshop/admin/reports/',
            role: req.payload.role
        });
    });
});

// The router is exported.
module.exports = router;