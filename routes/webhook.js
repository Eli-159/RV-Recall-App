const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const exec = require('child_process').execFile;

router.get('/resetDB', (req, res) => {
    exec('./data/import/refreshdb.sh');
    res.status(200).send('Database refresh initiated');
});

router.post('/', (req, res) => {
    const blob = JSON.stringify(req.body);  
    const hmac = crypto.createHmac('sha256', process.env.GITHUB_SECRET);

    const ourSignature = `sha256=${hmac.update(blob).digest('hex')}`;
    const theirSignature = req.get('X-Hub-Signature-256');
    
    const bufferA = Buffer.from(ourSignature, 'utf8');
    const bufferB = Buffer.from(theirSignature, 'utf8');
    
    const safe = crypto.timingSafeEqual(bufferA, bufferB);
    
    if (safe) {
            exec('./webhook.sh');
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
});


module.exports = router;