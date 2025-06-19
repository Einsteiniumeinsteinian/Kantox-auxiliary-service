const express = require('express')
const { listBucket } = require('../controllers/bucket.controller')
const router = express.Router()

router.get('/', listBucket)

module.exports = router