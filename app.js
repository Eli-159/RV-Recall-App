const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');

const express = require('express');
const app = express();

app.set('view engine', 'pug');
app.set('views', 'Views');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "Public")));

app.use('/form-submit', (req, res, next) => {
    const body = req.body;
    console.log(body);
    res.redirect('/pages/success.html');
});

app.listen(3000);