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
        gmail.createTokenFromCode(givenCode).then(() => {
            res.redirect('/workshop/admin/google/auth/success');
        }).catch(err => {
            res.redirect('/workshop/admin/google/auth/error');
        });
    } else {
        res.redirect('/workshop/admin/google/auth/scope-error');
    }
});

router.get('/auth/success', (req, res, next) => {
    res.render('workshop/admin/google/auth-success', {
        pageTitle: 'Authentication Success',
        path: '/workshop/admin/google/auth/success',
        role: req.payload.role
    });
});

router.get('/auth/error', (req, res, next) => {
    res.render('workshop/admin/google/auth-error', {
        pageTitle: 'Authentication Error',
        path: '/workshop/admin/google/auth/error',
        role: req.payload.role
    });
});

router.get('/auth/scope-error', (req, res, next) => {
    res.render('workshop/admin/google/scope-error', {
        pageTitle: 'Authentication Success',
        path: '/workshop/admin/google/auth/scope-error',
        role: req.payload.role
    });
});

// The router is exported.
module.exports = router;