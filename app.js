// Inports the required libraries and other files.
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const cookieParser = require("cookie-parser");
const fileUpload = require('express-fileupload');
const app = express();
require('dotenv').config();

// Inports the other required routes files.
const loginRoutes = require('./routes/login.js');
const workshopRoutes = require('./routes/workshop.js');
const ownerDetailsRoutes = require('./routes/owner-details.js');
const emailRoutes = require('./routes/email.js');
const webhookRoutes = require('./routes/webhook.js');

// Sets the view engine to pug.
app.set('view engine', 'pug');
app.set('views', 'pug');

// Passes incoming requests to more readable formats.
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "Public")));
app.use(cookieParser());
app.use(fileUpload());

// Catches all requests with no further route specified.
app.get('/', (req, res, next) => {
    // Redirects the request to the home page.
    res.redirect('/home');
});

// Catches all requests for the home page.
app.get('/home', (req, res, next) => {
    // Renders the home page.
    res.render('home', {
        path: '/home',
        pageTitle: 'MyRV Vehicle and Owner Website'
    });
});

// Catches all requests going through the owner registration route and points them to the owner registration routes file.
app.use(['/owner-registration', '/recall-registration'], ownerDetailsRoutes);

// Catches all requests and passes them through the login routes file.
app.use('/', loginRoutes);

// Catches all requests for static files under admin and loads them, after they have been authenticated by the login routes.
app.use('/workshop/admin/reports', express.static(path.join(__dirname, 'data', 'reports')));

// Catches all requests going through the workshop route and points them to the workshop routes file.
app.use('/workshop', workshopRoutes);

// Catches all requests going through the tracking route and points them to the tracking routes file.
app.use('/email', emailRoutes);

//app.use('/api', apiRoutes);

app.use('/webhook', webhookRoutes);

// Catches all requests that have not yet had a response sent.
app.use('/', (req, res, next) => {
    // Sets the status to 404.
    res.status(404);
    // Renders the 404 error page.
    res.render((req.originalUrl.includes('workshop') ? 'errors/workshop-404' : 'errors/404'), {
        pageTitle: '404 - Page Not Found',
        role: (req.payload ? req.payload.role : null)
    });
});

// Begins listening for incoming requests.
app.listen(process.env.PORT);