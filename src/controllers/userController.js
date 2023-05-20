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

module.exports = {
    validate,
};


function getAllUsers(req, res) {
    const { firstName, isActive, amount } = req.query;
    const array = [];

    console.log(`firstName = ${firstName} isActive = ${isActive} amount = ${amount}`);

    let queryString = `SELECT ${selectWithoutRoles} FROM user`;

    if (firstName || isActive) {
        queryString += ` WHERE ${firstName ? 'firstName LIKE ?' : ''}${firstName && isActive ? ' AND ' : ''}${isActive ? 'isActive = ?' : ''}`;

        if (firstName) {
            array.push(`%${firstName}%`);
        }

        if (isActive) {
            array.push(isActive);
        }
    }

    if (amount && !isNaN(amount)) {
        queryString += ` ORDER BY id LIMIT ${amount}`;
    }

    queryString += ';';

    console.log(queryString);

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


module.exports = {
    validate,
    getAllUsers,
    validateNewUser,
    addUser,
};