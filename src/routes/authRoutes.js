const express = require('express')
const authController = require('../controllers/authController')
const router = express.Router()

//UC-101 - Login
router.post('/api/login', authController.validateInput, authController.login)

module.exports = router;