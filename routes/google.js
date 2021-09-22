// Inports the required libraries and other files.
const express = require('express');
const router = express.Router();
const gmail = require('../google/gmail.js')

router.get('/authorise/url', (req, res, next) => {
    gmail.getAuthUrl().then(url => {
        res.redirect(url);
    });
});

router.get('/authorise/code', (req, res, next) => {
    const requestedScopes = gmail.scopes.join(' ');
    const givenScopes = req.params.scopes;
    const givenCode = req.params.code;
    if (requestedScopes == givenScopes) {
        gmail.createTokenFromCode(givenCode).then(res.redirect('/workshop/actions')).catch(next());
    } else {
        res.redirect('/workshop/admin/google/authorise/url');
    }
});

// The router is exported.
module.exports = router;