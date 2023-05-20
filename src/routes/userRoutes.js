const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')


//UC-202 - Get all users
router.get('/api/user', userController.validate, userController.getAllUsers);
router.post('/api/user', userController.validateNewUser, userController.addUser);
module.exports = router;