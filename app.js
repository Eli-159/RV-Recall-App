const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const express = require('express');
const app = express();

let okDetails = [
    {vin: '123456789', buildNo: '987654321', description: "2020 AUTO-TRAIL EKS HI LINE"}
];

app.set('view engine', 'pug');
app.set('views', 'Views');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "Public")));

app.use('/form-submit', (req, res, next) => {
    const body = req.body;
    let found = false;
    for (let i = 0; i < okDetails.length; i++) {
        console.log(body);
        if (body['securityNo'] == okDetails[i]['securityNo']) {
            console.log(body);
            found = true;
            res.redirect('/pages/details-form-success.html');
        }
    }
    if (!found) {
        res.redirect('/pages/RV-Form.html'); 
    }
});

app.get('/verifyDetails', (req, res, next) => {
    // This is the API that compares the VIN and Build Number given by the user to those known and returns its finding.
    // Gets and logs given VIN and Build Number.
    console.log(req.headers);
    const givenVin = req.headers.vin;
    const givenBuildNo = req.headers.buildno;
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
            res.json(JSON.stringify({proceed: true, description: okDetails[i].description, securityNo: securityNo}));
            found = true;
            break;
        } else {
            console.log('vin: ' + givenVin + ' != ' + okDetails[i].vin);
            console.log('buildNo: ' + givenBuildNo + ' != ' + okDetails[i].buildNo);
        }
    }
    if (!found) {
        // If the given data is not known, return a message to that effect.
        res.json(JSON.stringify({proceed: false}));
    }
});

app.use('/email-logo/', (req, res, next) => {
    console.log(req.url.split('/')[1]);
    res.sendFile(path.join(__dirname, 'Public', 'images', 'logo.png'));
});

app.listen(3000);