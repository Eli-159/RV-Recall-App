const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');

const express = require('express');
const app = express();

const recallRoutes = require('./routes/recall.js');
const ownerDetailsRoutes = require('./routes/owner-details.js');
const complaintsRoutes = require('./routes/complaints.js');

const dao = require('./data/dao');

app.set('view engine', 'pug');
app.set('views', 'Views');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "Public")));

app.get('/', (req, res, next) => {
    res.redirect('/pages/RV-Form.html');
});

app.use('/recall', recallRoutes);

app.use('/owner-registration', ownerDetailsRoutes);

app.use('/complaints', complaintsRoutes);

app.use('/email-logo', (req, res, next) => {
    console.log(req.url.split('/')[1]);
    res.sendFile(path.join(__dirname, 'Public', 'images', 'logo.png'));
});

app.get('/dao/:id', async (req, res) => {
    const data = await dao.getOwner(req.params.id);
    res.json(data);
})
app.listen(3000);