const express = require('express');
const router = express.Router();
const dao = require('../data/dao');

//
router.get('/owner/:id', async (req, res) => {
    // curl http://localhost:3000/api/owner/3/
    try {
        const data = await dao.getOwner(req.params.id);
        res.json(data);
    }
    catch (err) {
        // Do something better than this
        res.status(500).send({error: 'method failed'});
    }
})

router.get('/vehicle/:vin', async (req, res) => {
    // curl http://localhost:3000/api/vehicle/ZFA25000002775146/
    try {
        const data = await dao.getVehicleByVin(req.params.vin);
        res.json(data);
    }
    catch (err) {
        // Do something better than this
        res.status(500).send({error: 'method failed'});
    }
})

router.get('/workshop/:code', async (req, res) => {
    // curl http://localhost:3000/api/workshop/EQ01/
    try {
        const data = await dao.getWorkshopByCode(req.params.code);
        res.json(data);
    }
    catch (err) {
        // Do something better than this
        res.status(500).send({error: 'method failed'});
    }
})

//module.exports = router;