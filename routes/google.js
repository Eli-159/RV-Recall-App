// Inports the required libraries and other files.
const express = require('express');
const router = express.Router();
const gmail = require('../google/gmail.js')

router.get('/auth/url', (req, res, next) => {
    gmail.getAuthUrl().then(url => {
        res.redirect(url);
    });
});

router.get('/auth/code', (req, res, next) => {
    const requestedScopes = JSON.stringify(gmail.scopes.sort());
    const givenScopes = JSON.stringify(req.query.scope.includes(' ') ? req.query.scope.split(' ').sort() : req.query.scope);
    const givenCode = req.query.code;
    if (requestedScopes == givenScopes) {
        gmail.createTokenFromCode(givenCode).then(() => gmail.sendEmail().then(() => res.redirect('/workshop/actions'))).catch(err => console.log(err));
    } else {
        res.redirect('/workshop/admin/google/auth/url');
    }
});

// The router is exported.
module.exports = router;