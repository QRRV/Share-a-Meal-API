const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')


//UC-202 - Get all users
router.get('/api/user', userController.validate, userController.getAllUsers);
router.post('/api/user', userController.validateNewUser, userController.addUser);
router.get('/api/user/profile', userController.validate, userController.getPersonalProfile);
router.get('/api/user/:userId', userController.validate, userController.getUserById);
router.put('/api/user/:userId', userController.validate, userController.validateUpdatedUser, userController.updateUser);
router.delete('/api/user/:userId', userController.validate, userController.deleteUser);
module.exports = router;