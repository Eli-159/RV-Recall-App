const express = require('express');
const router = express.Router();

let okDetails = [
    {vin: 'ZFA25000001234567', buildNo: '987654321', description: "2020 AUTO-TRAIL EKS HI LINE"}
];

router.get('/', (req, res, next) => {
    res.render('owner-details/first-load', {
        pageTitle: 'MyRV Owner Details Form'
    });
});

router.post('/verifyDetails', (req, res, next) => {
    // This is the API that compares the VIN and Build Number given by the user to those known and returns its finding.
    // Gets and logs given VIN and Build Number.
    const givenVin = req.body.vin;
    const givenBuildNo = req.body.buildNo;
    // Loops over known values and tests to see if they match the given ones.
    let found = false;
    for (let i = 0; i < okDetails.length; i++) {
        if (givenVin == okDetails[i].vin && givenBuildNo == okDetails[i].buildNo) {
            // If the given data matches, it returns a message to that effect, with random assigned security number.
            let securityNo = (Math.floor(Math.random() * 9)).toString();;
            for (let x = 1; x < 100; x++) {
                securityNo = securityNo + (Math.floor(Math.random() * 9)).toString();
            }
            okDetails[i]['securityNo'] = okDetails[i].vin + securityNo + okDetails[i].buildNo;
            //res.json(JSON.stringify({proceed: true, description: okDetails[i].description, securityNo: securityNo}));
            res.setHeader('proceed', true);
            res.setHeader('securityNo', securityNo);
            res.render('owner-details/details-form');
            found = true;
            break;
        }
    }
    if (!found) {
        // If the given data is not known, return a message to that effect.
        res.sendStatus(501);
    }
    const logDetails = {
        ip: req.ip,
        url: req.protocol + '://' + req.get('host') + req.originalUrl,
        date: Date.now(),
        vin: givenVin,
        buildNo: givenBuildNo,
        found: found
    }
    console.log(logDetails);
});

router.post('/submit-details', (req, res, next) => {
    const body = req.body;
    const headers = req.headers;
    let found = false;
    for (let i = 0; i < okDetails.length; i++) {
        if (headers.securityno == okDetails[i]['securityNo']) {
            found = true;
            res.render('owner-details/success-message');
            console.log(body);
        }
    }
    if (!found) {
        res.status(501);
        res.render('errors/general-redirect-error', {
            errorHeading: 'Page Timeout',
            errorBody: 'Sorry, it appears your connection timed out. Please try again.',
            includeRedirect: true,
            redirectTime: 15,
            redirectAddress: '/owner-registration',
            redirectPageName: 'Owner Registration'
        })
    }
});

module.exports = router;