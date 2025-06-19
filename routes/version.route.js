const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.json({
        version: process.env.SERVICE_VERSION,
        service: 'auxiliary-service',
        timestamp: new Date().toISOString(),
      });
})


module.exports = router