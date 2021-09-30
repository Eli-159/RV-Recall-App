// Inports the required libraries and other files.
const express = require('express');
const router = express.Router();
const fs = require('fs');
const emailKeys = require('../google/email-data-desc.json');
const gmail = require('../google/gmail.js');
const googleAuth = require('../google/auth.js');
const sendEmail = require('../google/send-email.js');

// Catches all requests that have no further url.
router.get('/', (req, res, next) => {
    // Redirects to the google actions page.
    res.redirect('/workshop/admin/google/actions');
});

// Catches all requests for the actions page.
router.get('/actions', (req, res, next) => {
    // Renders the pug page.
    res.render('workshop/admin/google/actions', {
        pageTitle: 'Google Actions - MYRV',
        path: '/workshop/admin/google/actions',
        role: req.payload.role
    })
});

// Catches all requests for the authentication url.
router.get('/auth/url', (req, res, next) => {
    // Gets the authentication url from google.
    googleAuth.getAuthUrl().then(url => {
        // Redirects the user to the given url.
        res.redirect(url);
    });
});

// Catches all requests for the auth code. This should be a redirect from google, containing the scopes and auth code as url parameters.
router.get('/auth/code', (req, res, next) => {
    // Loads the requested and given scopes into variables, sorting and stringifying them for comparison.
    const requestedScopes = JSON.stringify(googleAuth.scopes.sort());
    const givenScopes = JSON.stringify(req.query.scope.includes(' ') ? req.query.scope.split(' ').sort() : req.query.scope);
    // Loads the access code into a variable.
    const givenCode = req.query.code;
    // Tests if the requested scopes are all granted by the user.
    if (requestedScopes == givenScopes) {
        // Generates an access token.
        googleAuth.createTokenFromCode(givenCode).then(() => {
            // Redirects the user to the success page.
            res.redirect('/workshop/admin/google/auth/success');
        }).catch(err => {
            // Redirects the user to the error page.
            res.redirect('/workshop/admin/google/auth/error');
        });
    } else {
        // Redirects the user to the scope error page, asking them to authenticate for all scopes.
        res.redirect('/workshop/admin/google/auth/scope-error');
    }
});

// Catches all requests for the success page.
router.get('/auth/success', (req, res, next) => {
    // Renders the success page.
    res.render('workshop/admin/google/auth-success', {
        pageTitle: 'Authentication Success',
        path: '/workshop/admin/google/auth/success',
        role: req.payload.role
    });
});

// Catches all requests for the error page.
router.get('/auth/error', (req, res, next) => {
    // Renders the error page.
    res.render('workshop/admin/google/auth-error', {
        pageTitle: 'Authentication Error',
        path: '/workshop/admin/google/auth/error',
        role: req.payload.role
    });
});

// Catches all requests for the scope error.
router.get('/auth/scope-error', (req, res, next) => {
    // Renders the scope error page.
    res.render('workshop/admin/google/scope-error', {
        pageTitle: 'Authentication Success',
        path: '/workshop/admin/google/auth/scope-error',
        role: req.payload.role
    });
});

router.get('/email-keys', (req, res, next) => {
    res.render('workshop/admin/google/email-keys.pug', {
        emailKeys: emailKeys,
        pageTitle: 'Email Keys',
        path: '/workshop/admin/google/email-keys',
        role: req.payload.role
    });
});

router.get('/sending-failed-emails', (req, res, next) => {
    // Reads the failed-emails.json file.
    fs.readFile('./google/failed-emails.json', (err, data) => {
        const numEmails = (err ? -1 : JSON.parse(data).length);
        if (numEmails == 0) {
            res.redirect('/workshop/admin/google/send-failed-emails');
        } else {
            res.render('workshop/admin/google/send-failed-emails', {
                numEmails: numEmails,
                error: (err ? true : false),
                pageTitle: 'Sending Emails...',
                path: '/workshop/admin/google/sending-failed-emails',
                role: req.payload.role
            });
        }
    });
});

router.get('/send-failed-emails', (req, res, next) => {
    sendEmail.sendFailedEmails().then(emailData => {
        res.render('workshop/admin/google/sent-emails.pug', {
            emails: emailData,
            pageTitle: 'Emails Sent',
            path: '/workshop/admin/google/sending-failed-emails',
            role: req.payload.role
        });
    })
});

// The router is exported.
module.exports = router;