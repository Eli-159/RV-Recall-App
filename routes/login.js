// Inports the required libaries and other files.
const express = require('express');
const router = express.Router();
const dao = require ('../data/dao.js');
const auth = require('../models/authenticate.js');

// Catches all get requests for the login page, passing them first through the JWT authentication function.
router.get('/login', auth.authenticateToken, (req, res, next) => {
    // Tests if the current response code is 200, meaning that it has already been validated as a logged on user.
    if (res.statusCode == 200) {
        // Tests if the users role is as an admin or workshop, meaning that they have already been logged in and are authenticated users.
        if (req.payload.role == 'admin' || req.payload.role == 'elite' || req.payload.role == 'workshop') {
            // If the user is already logged in as a workshop or admin, they are redirected to the actions page.
            res.redirect('/workshop/actions');
        } else {
            // Otherwise, the status is corrected to 200 and the login page is rendered.
            res.status(200);
            res.render('login', {
                pageTitle: 'Admin Login - MyRV',
                path: '/login'
            });
        }
    } else {
        // If the request had failed the first status code test, the status is corrected to 200 and the login page rendered.
        res.status(200);
        res.render('login', {
            pageTitle: 'Admin Login - MyRV',
            path: '/login'
        });
    }
});

// Catches all login submits.
router.post('/login/submit', (req, res, next) => {
    // Loads the request body and initial log details into variables.
    const body = req.body;
    const logDetails = {
        ip: req.ip,
        url: req.originalUrl,
        user: 'Unidentified - ' + body.name,
        success: false
    }
    // Queries the database for the workshop by the dealer code provided in the request body.
    dao.getWorkshopByCode(body.dealerCode)
    .then(workshopData => {
        // Tests that the dealer code is valid (implied by the workshopData not being null), and that the name of the workshop matches the one provided.
        if (workshopData != null) {
            if (workshopData.name === body.name) {
                // If the workshop data has been validated, a jwt is issued with the user name and role in the payload.
                res.cookie('jwt', auth.generateToken({
                    user: body.name,
                    role: workshopData.role
                }), { httpOnly: true});
                // Sets the response status to 200 and updates the log details.
                res.status(200);
                logDetails.user = body.name;
                logDetails.success = true;
            } else {
                // If the name given does not match the one expected for the dealer code, the response status is set to 401.
                res.status(401);
            }
        } else {
            // If the dealer code was not linked to a known workshop, the response status is set to 401.
            res.status(401);
        }
        // The response is set and the request logged to the access log.
        res.send();
        dao.newAccessLog(logDetails);
    });
});

// Catches all get requests for a post-login redirect.
router.get('/login/redirect', (req, res, next) => {
    // Loads the redirectUrl cookie value into a variable and then deletes it from the response.
    const redirectUrl = req.cookies.redirectUrl;
    res.clearCookie('redirectUrl', {path: '/'});
    // Tests if the cookie contained a value/existed.
    if (redirectUrl) {
        // If the cookie did contain a value, the user is redireced to the url inside of it.
        res.redirect(redirectUrl);
    } else {
        // If the cookie did not contain a value, the user is redirected to the workshop actions page.
        res.redirect('/workshop/actions');
    }
});

// Catches all requests to logout.
router.get('/logout', (req, res, next) => {
    // Clears the jwt cookie from the response.
    res.clearCookie('jwt', {path: '/'});
    // Redirects the user to the home page.
    res.redirect('/home');
});

// Catches every other request that entered the file, which is assumed to have been passed in from another function to be authenticated.
// All requests caught in this are first authenticated as JWTs and then passed into the function defined below.
router.use('/', auth.authenticateToken, (req, res, next) => {
    // Declares a variable containing the default log details.
    const logDetails = {
        ip: req.ip,
        url: req.originalUrl,
        user: (req.payload!=undefined ? (req.payload.user!=undefined ? req.payload.user : 'Unidentified Dealer or Admin')  : 'Unidentified Dealer or Admin'),
        success: false
    }
    // Tests if the request url includes the /workshop route.
    if (req.originalUrl.includes('/workshop')) {
        // If the request was to a page through the workshop route, it is further authenticated.
        // Keyy infomation from the request is loaded into variables.
        const status = res.statusCode;
        const method = req.method;
        const role = ((req.payload != undefined) ? req.payload.role : null);
        const domain = process.env.DOMAIN;
        const redirectUrl = (method=='GET' ? req.originalUrl : (req.headers.referer.includes(domain) ? req.headers.referer.split(domain)[1] : undefined));
        // Tests if the response status is 401 (set by the authenticate function) or the user's role is not admin or workshop.
        if (status == 401 || (role != 'admin' && role != 'elite' && role != 'workshop')) {
            // If the response status is 401 or the role user's role is not admin or workshop, the request is blocked and a response returned.
            // Adds a redirectUrl cookie to the response with the current request url, so that the user can be redirected back after logging in.
            res.cookie('redirectUrl', redirectUrl);
            // Tests if the request was made with the 'GET' method.
            if (method == 'GET') {
                // If it was a get request, the user is redirected to the login page.
                res.redirect('/login');
            } else {
                // If the request was not made with a GET request, the user is returned a part-page error message.
                res.render('errors/general-redirect-error', {
                    errorHeading: 'Unauthorized',
                    errorBody: 'Sorry, it appears you are unauthorized to save that data.',
                    includeRedirect: true,
                    redirectTime: 15,
                    redirectAddress: '/login',
                    redirectPageName: 'Login'
                });
            }
        } else if (status == 403) {
            // If the response status is 403 (set by the authenticate function), the request is blocked and a response returned.
            // Adds a redirectUrl cookie to the response with the current request url, so that the user can be redirected back after logging in.
            res.cookie('redirectUrl', redirectUrl);
            // Tests if the request was made with the 'GET' method.
            if (method == 'GET') {
                // If it was a get request, the user is redirected to the login page.
                res.redirect('/login');
            } else {
                // If the request was not made with a GET request, the user is returned a part-page error message.
                res.render('errors/general-redirect-error', {
                    errorHeading: 'Page Timeout',
                    errorBody: 'Sorry, it appears your connection timed out. Please try again.',
                    includeRedirect: true,
                    redirectTime: 15,
                    redirectAddress: '/login',
                    redirectPageName: 'Login'
                });
            }
        } else if ((req.originalUrl.includes('/elite') && req.payload.role != 'elite' && req.payload.role != 'admin') || (req.originalUrl.includes('/admin') && req.payload.role != 'admin')) {
            // If the request is for an admin or elite resource but the assigned role is not adequate, an access denied error is returned.
            if (req.method == 'GET') {
                // If the request was made using the GET method, a full page access denied error is returned.
                res.render('errors/full-page-error', {
                    errorHeading: 'Access Denied',
                    errorBody: 'You are not authorised to access this resource.',
                    includeRedirect: false
                });
            } else {
                // If the request was not made using the GET method, a part page error is returned.
                res.render('errors/general-redirect-error', {
                    errorHeading: 'Access Denied',
                    errorBody: 'You are not authorised to access this resource.',
                    includeRedirect: false
                });
            }
        } else {
            // If the request has gotten to this point, it is deemed to be authenticated.
            // The request success is changed to true and the access is logged.
            logDetails.success = true;
            dao.newAccessLog(logDetails);
            // The JWT is renewed.
            res.cookie("jwt", auth.generateToken(req.payload), { httpOnly: true});
            // The request is allowed to continue to the next file.
            next();
            return;
        }
        // If still in the function, meaning the request has failed, the access is logged.
        dao.newAccessLog(logDetails);
    } else {
        // If the url didn't contain '/workshop', it is allowed to proceed.
        next();
    }
});

// The router is exported.
module.exports = router;