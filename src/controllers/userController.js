const dbconnection = require('../../database/dbconnection');
const assert = require('assert');
const jwt = require('jsonwebtoken');

const reEmail = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
const rePass = /^[a-zA-Z0-9]{4,}$/;
const rePhone = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
const selectWithoutRoles = "id, firstName, lastName, street, city, isActive, emailAdress, password, phoneNumber";

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



function getAllUsers(req, res) {
    // Define the valid filters that can be applied
    const validFilters = ['firstName', 'lastName', 'street', 'city', 'isActive', 'emailAdress'];

    // Extract the 'amount' parameter from the request and store the remaining filters in 'filters' object
    const { amount, ...filters } = req.query;
    const array = [];

    // Check if more than two filters are provided
    if (Object.keys(filters).length > 2) {
        return res.status(400).json({
            statusCode: 400,
            message: 'Only a maximum of two filters are allowed.',
        });
    }

    let queryString = `SELECT ${selectWithoutRoles} FROM user`;
    let conditions = [];

    // Process each filter
    for (const key in filters) {
        if (validFilters.includes(key)) {
            let filterValue = filters[key];

            // Handle special case for 'isActive' filter
            if (key === 'isActive') {
                if (filterValue === 'true') {
                    filterValue = 1;
                } else if (filterValue === 'false') {
                    filterValue = 0;
                } else {
                    return res.status(400).json({
                        statusCode: 400,
                        message: `Invalid value for isActive filter. Only 'true' or 'false' are allowed.`,
                    });
                }
            }

            // Add the filter condition and corresponding value to the arrays
            conditions.push(`${key} LIKE ?`);
            array.push(`%${filterValue}%`);
        } else {
            return res.status(400).json({
                statusCode: 400,
                message: `Invalid filter '${key}'.`,
            });
        }
    }

    // Construct the WHERE clause with the filter conditions
    if (conditions.length > 0) {
        queryString += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add optional 'amount' parameter for pagination
    if (amount && !isNaN(amount)) {
        queryString += ` ORDER BY id LIMIT ${amount}`;
    }

    queryString += ';';

    console.log(queryString);

    // Execute the SQL query
    dbconnection.getConnection((err, connection) => {
        if (err) throw err;

        connection.query(queryString, array, (error, results) => {
            connection.release();

            if (error) throw error;

            console.log('Amount of users = ', results.length);

            res.status(200).json({
                statusCode: 200,
                result: results,
            });
        });
    });
}



function validateNewUser(req, res, next) {
    const user = req.body;
    const { firstName, lastName, street, city, password, emailAdress } = user;

    try {
        assert(typeof firstName === 'string', 'First name must be a string');
        assert(typeof lastName === 'string', 'Last name must be a string');
        assert(typeof street === 'string', 'Street must be a string');
        assert(typeof city === 'string', 'City must be a string');
        assert(typeof password === 'string', 'Password must be a string');
        assert.match(password, rePass, 'Password must be valid');
        assert(typeof emailAdress === 'string', 'Email address must be a string');
        assert.match(emailAdress, reEmail, 'Email address must be valid');

        next();
    } catch (err) {
        next({
            statusCode: 400,
            message: err.message,
        });
    }
}


function addUser(req, res, next) {
    const user = req.body;

    dbconnection.getConnection((err, connection) => {
        if (err) throw err;

        connection.query(
            `INSERT INTO user (firstName, lastName, street, city, password, emailAdress) VALUES (?, ?, ?, ?, ?, ?)`,
            [user.firstName, user.lastName, user.street, user.city, user.password, user.emailAdress],
            (error) => {
                if (error) {
                    if (error.errno === 1062) {
                        return res.status(409).json({
                            statusCode: 409,
                            message: 'Email address is already registered',
                        });
                    } else {
                        throw error;
                    }
                } else {
                    connection.query(
                        `SELECT ${selectWithoutRoles} FROM user WHERE emailAdress = ?`,
                        [user.emailAdress],
                        (error, results) => {
                            connection.release();
                            if (error) throw error;

                            const newUser = results[0];

                            console.log(newUser);

                            res.status(201).json({
                                statusCode: 201,
                                result: newUser,
                            });
                        }
                    );
                }
            }
        );
    });
}

function getPersonalProfile(req, res, next) {
    dbconnection.getConnection((err, connection) => {
        if (err) throw err;

        connection.query(
            `SELECT ${selectWithoutRoles} FROM user WHERE id = ?`,
            [req.userId],
            (error, results) => {
                connection.release();
                if (error) throw error;

                const user = results[0];
                if (!user) {
                    const error = { statusCode: 404, message: `User with ID ${req.userId} not found` };
                    next(error);
                } else {
                    res.status(200).json({ statusCode: 200, result: user });
                }
            }
        );
    });
}
function getUserById(req, res, next) {
    const userId = req.params.userId;
    dbconnection.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query(
            'SELECT id, firstName, lastName, emailAdress, phoneNumber FROM user WHERE id = ' + userId,
            function (error, userResults) {
                if (error) throw error;
                if (userResults.length > 0) {
                    let user = userResults[0];
                    const currentDate = new Date().toISOString().split('T')[0]; // Get the current date in "YYYY-MM-DD" format
                    connection.query(
                        'SELECT * FROM meal WHERE cookId = ' + userId + ' AND DATE(dateTime) >= DATE(\'' + currentDate + '\')',
                        function (error, mealResults) {
                            connection.release();
                            if (error) throw error;
                            user.meals = mealResults;
                            res.status(200).json({
                                statusCode: 200,
                                result: user,
                            });
                        }
                    );
                } else {
                    const error = {
                        statusCode: 404,
                        message: `User with ID ${userId} not found`,
                    };
                    next(error);
                }
            }
        );
    });
}





function updateUser (req, res, next) {
    const userId = req.params.userId;
    let user = req.body;
    let isActive = 0;
    if (user.isActive) {
        isActive = 1;
    }

    dbconnection.getConnection(function (err, connection) {
        if (err) throw err
        connection.query(
            'SELECT ' + selectWithoutRoles + ' FROM user WHERE id = ' + userId,
            function (error, results) {
                connection.release()
                if (error) throw error
                if (results.length > 0) {
                    if(req.userId != userId){
                        const error = {
                            statusCode: 403,
                            message: 'You are not authorized to update this user.',
                        };
                        next(error);
                        return;
                    }
                    connection.query("UPDATE user SET id = " + user.id + ", firstName = '" + user.firstName +
                        "', lastName = '" + user.lastName + "', street = '" + user.street + "', city = '" + user.city +
                        "', isActive = '" + isActive + "', emailAdress = '" + user.emailAdress + "', password = '" +
                        user.password + "', phoneNumber = '" + user.phoneNumber + "' WHERE id = " + userId,
                        function(error) {
                            if (error) {
                                if(error.errno==1062){
                                    res.status(422).json({
                                        statusCode: 422,
                                        message: 'Email address is already registered, or id already exists',
                                    });
                                } else {
                                    throw error;
                                }
                            } else {
                                connection.query(
                                    'SELECT ' + selectWithoutRoles + ' FROM user WHERE id = ' + user.id,
                                    function (error, results) {
                                        connection.release()
                                        if (error) throw error
                                        if (results.length > 0) {
                                            userEdited = results[0]
                                            res.status(200).json({
                                                statusCode: 200,
                                                result: userEdited,
                                            })
                                        }
                                    })

                            }
                        })
                } else {
                    const error = {
                        statusCode: 400,
                        message: `User with ID ${userId} not found`,
                    }
                    next(error);
                }
            }
        )
    })
}


function validateUpdatedUser(req, res, next) {
    const user = req.body;
    const { id, firstName, lastName, street, city, isActive, password, emailAdress, phoneNumber } = user;

    try {
        assert(typeof id === 'number', 'ID must be a number');
        assert(typeof firstName === 'string', 'First name must be a string');
        assert(typeof lastName === 'string', 'Last name must be a string');
        assert(typeof street === 'string', 'Street must be a string');
        assert(typeof city === 'string', 'City must be a string');
        assert(typeof isActive === 'boolean', 'isActive must be a boolean');
        assert(typeof password === 'string', 'Password must be a string');
        assert.match(password, rePass, 'Password must be valid');
        assert(typeof emailAdress === 'string', 'Email adress must be a string');
        assert.match(emailAdress, reEmail, 'Email adress must be valid');
        assert(typeof phoneNumber === 'string', 'Phone number must be a string');
        assert.match(phoneNumber, rePhone, 'Phone number must be valid');
        next();
    } catch (err) {
        const error = {
            statusCode: 400,
            message: err.message,
        };
        next(error);
    }
}

function deleteUser (req, res, next)  {
    const userId = req.params.userId;
    dbconnection.getConnection(function (err, connection) {
        if (err) throw err
        connection.query(
            'SELECT ' + selectWithoutRoles + ' FROM user WHERE id = ' + userId,
            function (error, results) {
                connection.release()
                if (error) throw error
                if (results.length > 0) {
                    if(req.userId != userId){
                        const error = {
                            statusCode: 403,
                            message: 'You are not authorized to delete this user.',
                        };
                        next(error);
                        return;
                    }

                        connection.query('DELETE FROM user WHERE id = ' + userId)
                        res.status(200).json({
                            statusCode: 200,
                            message: `User with ID ${userId} successfully deleted`,
                        })
                } else {
                    const error = {
                        statusCode: 400,
                        message: `User with ID ${userId} not found`,
                    }
                    next(error);
                }
            }
        )
    })
}


module.exports = {
    validate,
    getAllUsers,
    validateNewUser,
    addUser,
    getPersonalProfile,
    getUserById,
    updateUser,
    validateUpdatedUser,
    deleteUser
};