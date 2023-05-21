const dbconnection = require('../../database/dbconnection');
const assert = require('assert');
require('dotenv').config();
const jwt = require('jsonwebtoken');

function login(req, res, next) {
    const { emailAddress, password } = req.body;

    const queryString = 'SELECT id, firstName, lastName, emailAdress, password FROM user WHERE emailAdress = ?';

    dbconnection.getConnection((err, connection) => {
        if (err) throw err;

        connection.query(queryString, [emailAddress], (error, results) => {
            connection.release();
            if (error) throw error;

            if (results && results.length === 1) {
                const user = results[0];
                if (user.password === password) {
                    jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
                        if (err) console.log(err);
                        if (token) {
                            user.token = token;
                            delete user.password;
                            res.status(200).json({
                                statusCode: 200,
                                message: 'Login successful',
                                result: user,
                            });
                        }
                    });
                } else {
                    res.status(401).json({
                        statusCode: 401,
                        message: 'Incorrect password!',
                    });
                }
            } else {
                console.log('User not found');
                res.status(404).json({
                    statusCode: 404,
                    message: 'Email not found',
                });
            }
        });
    });
}

function validateLogin(req, res, next) {
    const { emailAddress, password } = req.body;
    const reEmail = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    const rePass = /^[a-zA-Z0-9]{4,}$/;

    try {
        assert(typeof emailAddress === 'string', 'Email address must be a string');
        assert.match(emailAddress, reEmail, 'Email address must be valid');
        assert(typeof password === 'string', 'Password must be a string');
        assert.match(password, rePass, 'Password must be valid');
        next();
    } catch (err) {
        const error = {
            statusCode: 400,
            message: err.message,
        };
        next(error);
    }
}



module.exports = {
    login,
    validateInput: validateLogin,
};
