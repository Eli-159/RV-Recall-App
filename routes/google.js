// Inports the required libraries and other files.
const express = require('express');
const router = express.Router();
const fs = require('fs');
const auth = require('../models/authenticate.js');
const gmail = require('../google/gmail.js');
const googleData = require('../google/data.js');
const googleAuth = require('../google/auth.js');
const sendEmail = require('../google/send-email.js');
const emailKeys = require('../google/email-data-desc.json');

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
    const givenScopes = JSON.stringify(req.query.scope.includes(' ') ? req.query.scope.split(' ').sort() : [req.query.scope]);
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
    res.render('workshop/admin/google/auth/auth-success', {
        pageTitle: 'Authentication Success',
        path: '/workshop/admin/google/auth/success',
        role: req.payload.role
    });
});

// Catches all requests for the error page.
router.get('/auth/error', (req, res, next) => {
    // Renders the error page.
    res.render('workshop/admin/google/auth/auth-error', {
        pageTitle: 'Authentication Error',
        path: '/workshop/admin/google/auth/error',
        role: req.payload.role
    });
});

// Catches all requests for the scope error.
router.get('/auth/scope-error', (req, res, next) => {
    // Renders the scope error page.
    res.render('workshop/admin/google/auth/scope-error', {
        pageTitle: 'Authentication Success',
        path: '/workshop/admin/google/auth/scope-error',
        role: req.payload.role
    });
});

// Catches all requests for the list of email keys.
router.get('/email-keys', (req, res, next) => {
    // Renders the email keys page.
    res.render('workshop/admin/google/email-keys.pug', {
        emailKeys: emailKeys,
        pageTitle: 'Email Keys',
        path: '/workshop/admin/google/email-keys',
        role: req.payload.role
    });
});

// Catches all requests for the list of auto emails.
router.get('/view-auto-emails', (req, res, next) => {
    // Reads the data map file.
    fs.readFile('./google/email-data-map.json', (err, content) => {
        // Tests for an error.
        if (err) {
            // Logs the error.
            console.log(err);
            // Renders an error page.
            res.render('errors/full-page-error.pug', {
                includeRedirect: true,
                errorHeading: 'Unexpected Error',
                errorBody: 'Sorry, an unexpected error occurred while trying to read the email map. Please try again.',
                redirectTime: '30',
                redirectAddress: '/workshop/admin/google/actions',
                redirectPageName: 'Google Actions Page',
                pageTitle: 'Error',
                path: '/workshop/admin/google/view-auto-emails',
                role: req.payload.role
            });
        } else {
            // Passes the JSON content.
            const mappedEmails = JSON.parse(content);
            // Gets a list of all gmail drafts.
            gmail.listDrafts().then(drafts => {
                // Declares a variable to hold all of the draft data.
                const autoEmailData = [];
                // Loops over the mapped emails.
                for (email in mappedEmails) {
                    // Gets the draft object for the current email.
                    const draft = drafts.find(draft => draft.draftId == mappedEmails[email].draftId);
                    // Pushes an object with the wanted data to the autoEmailData array.
                    autoEmailData.push({
                        url: mappedEmails[email].triggerUrl,
                        active: mappedEmails[email].active.toString().toUpperCase(),
                        draft: (draft ? draft.subject : 'Not Linked'),
                        id: mappedEmails[email].id
                    });
                }
                // Renders the view-emails page.
                res.render('workshop/admin/google/view-emails', {
                    autoEmailData: autoEmailData,
                    pageTitle: 'Automatic Emails',
                    path: '/workshop/admin/google/view-auto-emails',
                    role: req.payload.role
                });
                
            }).catch(error => {
                // Logs the error.
                console.log(error);
                // Renders an error page.
                res.render('errors/full-page-error.pug', {
                    includeRedirect: true,
                    errorHeading: 'Unexpected Error',
                    errorBody: 'Sorry, an unexpected error occurred while fetching the draft data from google. Please try again.',
                    redirectTime: '30',
                    redirectAddress: '/workshop/admin/google/actions',
                    redirectPageName: 'Google Actions Page',
                    pageTitle: 'Error',
                    path: '/workshop/admin/google/view-auto-emails',
                    role: req.payload.role
                });
            });
        }
    });
});

router.get('/create-auto-email', (req, res, next) => {
    // Loads the payload into a variable.
    const payload = req.payload;
    // Waits for a list of all gmail drafts to be fetched.
    gmail.listDrafts().then(drafts => {
        // Issues a new jwt without a email data map id.
        res.cookie('jwt', auth.generateToken({
            user: payload.user,
            role: payload.role
        }), { httpOnly: true});
        res.render('workshop/admin/google/edit-email-map/first-load.pug', {
            email: {
                keys: emailKeys,
                drafts: drafts,
                map: {}
            },
            deleteOpt: false,
            pageTitle: 'Create Auto Email',
            path: '/workshop/admin/google/create-auto-email',
            role: req.payload.role
        });
    }).catch(err => {
        // Logs the error.
        console.log(err);
        // Renders an error page.
        res.render('errors/full-page-error.pug', {
            includeRedirect: true,
            errorHeading: 'Unexpected Error',
            errorBody: 'Sorry, an unexpected error occurred while loading the email data. Please try again.',
            redirectTime: '30',
            redirectAddress: '/workshop/admin/google/actions',
            redirectPageName: 'Google Actions Page',
            pageTitle: 'Error',
            path: '/workshop/admin/google/view-auto-emails',
            role: req.payload.role
        });
    })
});

router.get('/edit-auto-email', (req, res, next) => {
    // Loads the email id and payload into variables.
    const emailId = req.query.id;
    const payload = req.payload;
    // Waits for a list of all gmail drafts and the data map of the email to be fetched.
    Promise.all([
        gmail.listDrafts(),
        googleData.getEmailDataMapById(emailId)
    ]).then(data => {
        // Issues a new jwt with the email data map id.
        res.cookie('jwt', auth.generateToken({
            user: payload.user,
            role: payload.role,
            emailId: emailId
        }), { httpOnly: true});
        res.render('workshop/admin/google/edit-email-map/first-load.pug', {
            email: {
                keys: emailKeys,
                drafts: data[0],
                map: data[1]
            },
            deleteOpt: true,
            pageTitle: 'Edit Auto Email',
            path: '/workshop/admin/google/edit-auto-email',
            role: req.payload.role
        });
    }).catch(err => {
        // Logs the error.
        console.log(err);
        // Renders an error page.
        res.render('errors/full-page-error.pug', {
            includeRedirect: true,
            errorHeading: 'Unexpected Error',
            errorBody: 'Sorry, an unexpected error occurred while loading the email data. Please try again.',
            redirectTime: '30',
            redirectAddress: '/workshop/admin/google/actions',
            redirectPageName: 'Google Actions Page',
            pageTitle: 'Error',
            path: '/workshop/admin/google/view-auto-emails',
            role: req.payload.role
        });
    })
});

router.post('/edit-auto-email/submit', (req, res, next) => {
    // Loads the body and email id into variables.
    const body = req.body;
    const emailId = parseInt(req.payload.emailId);
    // Filters the keys of the replace keys out of the body keys.
    const replaceKeys = Object.keys(body).filter(key => key.includes('repKey'));
    // Declares a variable to hold the new replace value pairs.
    const replaceValues = {};
    // Loops over the replaceKeys variable.
    for (key in replaceKeys) {
        // Loads the replace key, number, and value into variables.
        const repKey = body[replaceKeys[key]];
        const repNum = replaceKeys[key].replace('repKey', '');
        const repVal = body['repVal'+repNum];
        // Tests that the repKey and repVal variables both have contents and the contents aren't empty strings.
        if (repKey && repKey != '' && repVal && repVal != '') {
            // Adds the replace value pair to the replaceValues object.
            replaceValues[repKey] = repVal;
        }
    }
    // Updates the email data map json file with the values from the body and previously declared variables.
    googleData.writeEmailDataMap({
        id: emailId,
        triggerUrl: body.url,
        active: body.active,
        address: body.email,
        draftId: body.draft,
        replaceValues: replaceValues
    }).then(idFound => {
        // Renders the success page.
        res.render('workshop/admin/google/edit-email-map/success-message', {
            created: !idFound,
            updated: idFound
        });
    }).catch(err => {
        // Logs the error.
        console.log(err);
        // Sets the reponse status to 500 and renders an error page.
        res.status(500);
        res.render('errors/general-redirect-error', {
            errorHeading: 'Error',
            errorBody: 'An unexpected error occured while trying to save the data. Please try again.',
            includeRedirect: true,
            redirectTime: '15',
            redirectAddress: '/workshop/admin/google/view-auto-emails',
            redirectPageName: 'View Auto Emails'
        });
    });
});

router.post('/edit-auto-email/delete', (req, res, next) => {
    // Loads the email id into a variable.
    const emailId = req.payload.emailId;
    // Deletes the map.
    googleData.deleteEmailDataMapById(emailId).then(() => {
        res.render('workshop/admin/google/edit-email-map/success-message', {
            created: false,
            updated: false
        });
    }).catch(err => {
        // Logs the error.
        console.log(err);
        // Sets the reponse status to 500 and renders an error page.
        res.status(500);
        res.render('errors/general-redirect-error', {
            errorHeading: 'Error',
            errorBody: 'An unexpected error occured while trying to delete the email map. Please try again.',
            includeRedirect: true,
            redirectTime: '15',
            redirectAddress: '/workshop/admin/google/view-auto-emails',
            redirectPageName: 'View Auto Emails'
        });
    });
})

// Catches all requests for the initial page while the server sends the emails.
router.get('/send-failed-emails', (req, res, next) => {
    // Reads the failed-emails.json file.
    fs.readFile('./google/failed-emails.json', (err, data) => {
        // Loads the number of emails into a variable.
        const numEmails = (err ? -1 : JSON.parse(data).length);
        // Tests if there are no failed emails.
        if (numEmails == 0) {
            // Redirects the user directly to the send-failed-emails page, as there should be none to send.
            res.redirect('/workshop/admin/google/send-failed-emails');
        } else {
            // Renders the send-failed-emails page.
            res.render('workshop/admin/google/failed-emails/send-failed-emails', {
                numEmails: numEmails,
                error: (err ? true : false),
                pageTitle: 'Sending Emails...',
                path: '/workshop/admin/google/sending-failed-emails',
                role: req.payload.role
            });
        }
    });
});

// Catches all requests to send the failed emails.
router.get('/send-failed-emails/start-send', (req, res, next) => {
    // Sends the emails.
    sendEmail.sendFailedEmails().then(emailData => {
        // Renders the send-emails page.
        res.render('workshop/admin/google/failed-emails/sent-emails.pug', {
            emails: emailData,
            pageTitle: 'Emails Sent',
            path: '/workshop/admin/google/sending-failed-emails',
            role: req.payload.role
        });
    })
});

// The router is exported.
module.exports = router;