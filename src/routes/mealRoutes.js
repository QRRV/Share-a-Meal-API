const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController')

//UC-301 - Create new meal
router.post('/api/meal', mealController.validate, mealController.validateMeal, mealController.addMeal);
router.get('/api/meal', mealController.getAllMeals);
router.get('/api/meal/:mealId', mealController.getMealById);
router.delete('/api/meal/:mealId', mealController.validate, mealController.deleteMeal);
module.exports = router;