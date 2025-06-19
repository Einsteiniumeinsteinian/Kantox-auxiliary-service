const express = require('express')
const { listParameters, getParameterValue } = require('../controllers/parameter.controller')
const router = express.Router()

router.get('/list', listParameters)
router.get('/', getParameterValue)

module.exports = router