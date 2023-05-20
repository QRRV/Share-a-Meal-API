


//UC-202 - Get all users
router.get('/api/user', authController.validate, userController.getAllUsers);