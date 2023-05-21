const jwt = require("jsonwebtoken");
const dbconnection = require('../../database/dbconnection')
const assert = require('assert')
const reDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
function validate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ statusCode: 401, message: 'Authorization header missing' });
    }

    const token = authHeader.substring(7);

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(401).json({ statusCode: 401, message: 'Not authorized' });
        }

        req.userId = payload.userId;
        next();
    });
}

function validateMeal(req, res, next) {
    const meal = req.body;
    const {
        name,
        description,
        isActive,
        isVega,
        isVegan,
        isToTakeHome,
        dateTime,
        imageUrl,
        allergenes,
        maxAmountOfParticipants,
        price,
    } = meal;

    try {
        assert(typeof name === 'string', 'Name must be a string');
        assert(typeof description === 'string', 'Description must be a string');
        assert(typeof isActive === 'boolean', 'isActive must be a boolean');
        assert(typeof isVega === 'boolean', 'isVega must be a boolean');
        assert(typeof isVegan === 'boolean', 'isVegan must be a boolean');
        assert(typeof isToTakeHome === 'boolean', 'isToTakeHome must be a boolean');
        assert(typeof dateTime === 'string', 'dateTime must be a string');
        assert(typeof imageUrl === 'string', 'imageUrl must be a string');
        assert(typeof allergenes === 'string', 'allergenes must be a string');
        assert(typeof maxAmountOfParticipants === 'number', 'maxAmountOfParticipants must be a number');
        assert(typeof price === 'number', 'Price must be a number');
        next();
    } catch (err) {
        const error = {
            statusCode: 400,
            message: err.message,
        };
        next(error);
    }
}

function addMeal(req, res, next) {
    let meal = req.body;
    meal.isActive = meal.isActive ? 1 : 0;
    meal.isVega = meal.isVega ? 1 : 0;
    meal.isVegan = meal.isVegan ? 1 : 0;
    meal.isToTakeHome = meal.isToTakeHome ? 1 : 0;

    dbconnection.getConnection((err, connection) => {
        if (err) throw err;

        connection.query(
            "INSERT INTO meal (name, description, isActive, isVega, isVegan, isToTakeHome, dateTime, imageUrl, allergenes, maxAmountOfParticipants, price, cookId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                meal.name,
                meal.description,
                meal.isActive,
                meal.isVega,
                meal.isVegan,
                meal.isToTakeHome,
                meal.dateTime,
                meal.imageUrl,
                meal.allergenes.toString(),
                meal.maxAmountOfParticipants,
                meal.price,
                req.userId,
            ],
            (error) => {
                if (error) throw error;

                connection.query("SELECT * FROM meal WHERE name = ? ORDER BY id DESC LIMIT 1", [meal.name], (error, results) => {
                    let fullMeal = results[0];
                    fullMeal.allergenes = meal.allergenes;

                    connection.query("SELECT * FROM user WHERE id = ?", [req.userId], (error, results) => {
                        let user = results[0];
                        fullMeal.cook = user;
                        connection.release();
                        if (error) throw error;

                        console.log(fullMeal);

                        res.status(201).json({
                            statusCode: 201,
                            message: "Meal added",
                            result: fullMeal,
                        });
                    });
                });
            }
        );
    });
}


function getAllMeals(req, res) {
    dbconnection.getConnection((err, connection) => {
        if (err) throw err;

        connection.query("SELECT * FROM meal", (error, results) => {
            connection.release();

            if (error) throw error;

            console.log('Amount of meals = ', results.length);

            res.status(200).json({
                statusCode: 200,
                message: "Meals found",
                result: results,
            });
        });
    });
}

function getMealById(req, res, next) {
    const mealId = req.params.mealId;
    dbconnection.getConnection((err, connection) => {
        if (err) throw err;

        connection.query("SELECT * FROM meal WHERE id = ?", [mealId], (error, results) => {
            connection.release();

            if (error) throw error;

            if (results.length > 0) {
                const meal = results[0];
                res.status(200).json({
                    statusCode: 200,
                    message: "Meal found",
                    result: meal,
                });
            } else {
                const error = {
                    statusCode: 404,
                    message: `Meal with ID ${mealId} not found`,
                };
                next(error);
            }
        });
    });
}

function deleteMeal(req, res, next) {
    const mealId = req.params.mealId;
    dbconnection.getConnection((err, connection) => {
        if (err) throw err;

        connection.query("SELECT * FROM meal WHERE id = ?", [mealId], (error, results) => {
            connection.release();

            if (error) throw error;

            if (results.length > 0) {
                const meal = results[0];

                if (req.userId != meal.cookId) {
                    const error = {
                        statusCode: 403,
                        message: 'You are not authorized to delete this meal.',
                    };
                    next(error);
                    return;
                }

                connection.query("DELETE FROM meal WHERE id = ?", [mealId], (error) => {
                    if (error) throw error;

                    res.status(200).json({
                        statusCode: 200,
                        message: `Meal with ID ${mealId} successfully deleted`,
                    });
                });
            } else {
                const error = {
                    statusCode: 404,
                    message: `Meal with ID ${mealId} not found`,
                };
                next(error);
            }
        });
    });
}


module.exports = {
    validate,
    validateMeal,
    addMeal,
    getAllMeals,
    getMealById,
    deleteMeal
}