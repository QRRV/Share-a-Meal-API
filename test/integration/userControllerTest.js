const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require("../../index");
const dbconnection = require('../../database/dbconnection');
chai.should();
chai.use(chaiHttp);
const token = process.env.TEST_TOKEN
const CLEAR_DB =
    'DELETE IGNORE FROM `meal`; DELETE IGNORE FROM `meal_participants_user`; DELETE IGNORE FROM `user`;'
const INSERT_USER_MEAL =
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +
    '(1, "Klaas", "Klaassen", "existing@gmail.com", "secret", "Teststraat 23", "Rotterdam");' +
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +
    '(2, "Jan", "Pieter", "existing2@gmail.com", "secret", "Teststraat 23", "Rotterdam");' +
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city`, `isActive` ) VALUES' +
    '(3, "Hans", "Hansen", "existing3@gmail.com", "secret", "Teststraat 23", "Rotterdam", false);' +
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city`, `isActive` ) VALUES' +
    '(4, "Bert", "Bertus", "existing4@gmail.com", "secret", "Teststraat 23", "Rotterdam", false);' +
    'INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES' +
    "(1, 'Kaas', 'Oude Kaas', 'www.kaas.com', NOW(), 2, 3.10, 1);"

const INSERT_USER =
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +
    '(1, "Klaas", "Klaassen", "existing@gmail.com", "secret", "Teststraat 23", "Rotterdam");' +
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +
    '(2, "Jan", "Pieter", "existing2@gmail.com", "secret", "Teststraat 23", "Rotterdam");' +
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city`, `isActive` ) VALUES' +
    '(3, "Hans", "Hansen", "existing3@gmail.com", "secret", "Teststraat 23", "Rotterdam", false);' +
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city`, `isActive` ) VALUES' +
    '(4, "Bert", "Bertus", "existing4@gmail.com", "secret", "Teststraat 23", "Rotterdam", false);'

describe('Manage user', () => {
    describe('UC-201 Register as new user /api/user', () => {
        beforeEach((done) => {
            dbconnection.getConnection(function (err, connection) {
                if (err) throw err
                connection.query(
                    CLEAR_DB + INSERT_USER_MEAL,
                    function (error, results, fields) {
                        connection.release()
                        if (error) throw error
                        done()
                    }
                )
            })
        })
        it('When a required field is missing a valid error should be returned.', (done) => {
            chai.request(server).post("/api/user").send({
                //FirstName is missing
                lastName: "Verschoor",
                emailAdress: "tessdasdt@gmail.com",
                password: "secret",
                street: "straat",
                city: "stad"

            }).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(400)
                message.should.be.a('string').that.equals("First name must be a string")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When emailAddress is invalid a valid error should be returned.', (done) => {
            chai.request(server).post("/api/user").send({
                firstName: "Quinn",
                lastName: "Verschoor",
                //emailAdress is invalid
                emailAdress: "test@gmailcom",
                password: "secret",
                street: "straat",
                city: "stad"

            }).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(400)
                message.should.be.a('string').that.equals("Email address must be valid")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When password is invalid a valid error should be returned.', (done) => {
            chai.request(server).post("/api/user").send({
                firstName: "Quinn",
                lastName: "Verschoor",
                emailAdress: "tessdasdt@gmail.com",
                //password is shorter than 4 character, so it is invalid
                password: "se",
                street: "straat",
                city: "stad"

            }).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(400)
                message.should.be.a('string').that.equals("Password must be valid")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When the user email already exists a valid error should be returned.', (done) => {
            chai.request(server).post("/api/user").send({
                firstName: "Quinn",
                lastName: "Verschoor",
                emailAdress: "existing@gmail.com",
                password: "secret",
                street: "straat",
                city: "stad"
            }).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(409)
                message.should.be.a('string').that.equals("Email address already exists")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When the user is successfully created a valid result should be returned.', (done) => {
            chai.request(server).post("/api/user").send({
                firstName: "Quinn",
                lastName: "Verschoor",
                emailAdress: "test@gmail.com",
                password: "secret",
                street: "straat",
                city: "stad"
            }).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(201)
                message.should.be.a('string').that.equals("User successfully created")
                result.should.be.an('object')
                result.should.have.property('id')
                result.should.have.property('firstName').that.equals("Quinn")
                result.should.have.property('lastName').that.equals("Verschoor")
                result.should.have.property('emailAdress').that.equals("test@gmail.com")
                result.should.have.property('street').that.equals("straat")
                result.should.have.property('city').that.equals("stad")
                done()
            })
        })

    })

    describe('UC-202 Requesting overview of users /api/user', () => {
        beforeEach((done) => {
            dbconnection.getConnection(function (err, connection) {
                if (err) throw err
                connection.query(
                    CLEAR_DB + INSERT_USER_MEAL,
                    function (error, results, fields) {
                        connection.release()
                        if (error) throw error
                        done()
                    }
                )
            })
        })
        it('When all users are requested a valid result will be returned', (done) => {
            chai.request(server).get("/api/user").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(200)
                message.should.be.a('string').that.equals("Successfully retrieved users")
                result.should.be.an('array')
                result.should.have.lengthOf(4)
                result[0].should.have.property('id')
                result[0].should.have.property('firstName').that.equals("Klaas")
                result[0].should.have.property('lastName').that.equals("Klaassen")
                result[0].should.have.property('emailAdress').that.equals("existing@gmail.com")
                result[0].should.have.property('street').that.equals("Teststraat 23")
                result[0].should.have.property('city').that.equals("Rotterdam")
                result[0].should.have.property('password').that.equals("secret")
                result[0].should.have.property('isActive').that.equals(1)
                result[1].should.have.property('id')
                result[1].should.have.property('firstName').that.equals("Jan")
                result[1].should.have.property('lastName').that.equals("Pieter")
                result[1].should.have.property('emailAdress').that.equals("existing2@gmail.com")
                result[1].should.have.property('street').that.equals("Teststraat 23")
                result[1].should.have.property('city').that.equals("Rotterdam")
                result[1].should.have.property('password').that.equals("secret")
                result[1].should.have.property('isActive').that.equals(1)
                result[2].should.have.property('id')
                result[2].should.have.property('firstName').that.equals("Hans")
                result[2].should.have.property('lastName').that.equals("Hansen")
                result[2].should.have.property('emailAdress').that.equals("existing3@gmail.com")
                result[2].should.have.property('street').that.equals("Teststraat 23")
                result[2].should.have.property('city').that.equals("Rotterdam")
                result[2].should.have.property('password').that.equals("secret")
                result[2].should.have.property('isActive').that.equals(0)
                result[3].should.have.property('id')
                result[3].should.have.property('firstName').that.equals("Bert")
                result[3].should.have.property('lastName').that.equals("Bertus")
                result[3].should.have.property('emailAdress').that.equals("existing4@gmail.com")
                result[3].should.have.property('street').that.equals("Teststraat 23")
                result[3].should.have.property('city').that.equals("Rotterdam")
                result[3].should.have.property('password').that.equals("secret")
                result[3].should.have.property('isActive').that.equals(0)
                done()
            })
        })
        it('When filtered users are requested with a invalid filter a valid error will be returned', (done) => {
            chai.request(server).get("/api/user?filter=invalid").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(400)
                message.should.be.a('string').that.equals("Invalid filter 'filter'.")
                //result should be empty
                result.should.be.an('array').that.is.empty
                done()
            })

        })
        it('When user are filtered on isActive=false a valid result will be returned', (done) => {
            chai.request(server).get("/api/user?isActive=false").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(200)
                message.should.be.a('string').that.equals("Successfully retrieved users")
                result.should.be.an('array')
                result.should.have.lengthOf(2)
                result[0].should.have.property('id')
                result[0].should.have.property('firstName').that.equals("Hans")
                result[0].should.have.property('lastName').that.equals("Hansen")
                result[0].should.have.property('emailAdress').that.equals("existing3@gmail.com")
                result[0].should.have.property('street').that.equals("Teststraat 23")
                result[0].should.have.property('city').that.equals("Rotterdam")
                result[0].should.have.property('password').that.equals("secret")
                result[0].should.have.property('isActive').that.equals(0)
                result[1].should.have.property('id')
                result[1].should.have.property('firstName').that.equals("Bert")
                result[1].should.have.property('lastName').that.equals("Bertus")
                result[1].should.have.property('emailAdress').that.equals("existing4@gmail.com")
                result[1].should.have.property('street').that.equals("Teststraat 23")
                result[1].should.have.property('city').that.equals("Rotterdam")
                result[1].should.have.property('password').that.equals("secret")
                result[1].should.have.property('isActive').that.equals(0)
                done()
        })
        })
        it('When user are filtered on isActive=true a valid result will be returned', (done) => {
            chai.request(server).get("/api/user?isActive=true").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(200)
                message.should.be.a('string').that.equals("Successfully retrieved users")
                result.should.be.an('array')
                result.should.have.lengthOf(2)
                result[0].should.have.property('id')
                result[0].should.have.property('firstName').that.equals("Klaas")
                result[0].should.have.property('lastName').that.equals("Klaassen")
                result[0].should.have.property('emailAdress').that.equals("existing@gmail.com")
                result[0].should.have.property('street').that.equals("Teststraat 23")
                result[0].should.have.property('city').that.equals("Rotterdam")
                result[0].should.have.property('password').that.equals("secret")
                result[0].should.have.property('isActive').that.equals(1)
                result[1].should.have.property('id')
                result[1].should.have.property('firstName').that.equals("Jan")
                result[1].should.have.property('lastName').that.equals("Pieter")
                result[1].should.have.property('emailAdress').that.equals("existing2@gmail.com")
                result[1].should.have.property('street').that.equals("Teststraat 23")
                result[1].should.have.property('city').that.equals("Rotterdam")
                result[1].should.have.property('password').that.equals("secret")
                result[1].should.have.property('isActive').that.equals(1)
                done()
            })
        })
        it('When user are filtered on isActive=true and firstName=Klaas a valid result will be returned', (done) => {
            chai.request(server).get("/api/user?isActive=true&firstName=Klaas").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(200)
                message.should.be.a('string').that.equals("Successfully retrieved users")
                result.should.be.an('array')
                result.should.have.lengthOf(1)
                result[0].should.have.property('id')
                result[0].should.have.property('firstName').that.equals("Klaas")
                result[0].should.have.property('lastName').that.equals("Klaassen")
                result[0].should.have.property('emailAdress').that.equals("existing@gmail.com")
                result[0].should.have.property('street').that.equals("Teststraat 23")
                result[0].should.have.property('city').that.equals("Rotterdam")
                result[0].should.have.property('password').that.equals("secret")
                result[0].should.have.property('isActive').that.equals(1)
                done()
            })
        })
        it('When maximum of 2 filters are exeded a valid error will be returned', (done) => {
            chai.request(server).get("/api/user?isActive=true&firstName=Klaas&lastName=Klaassen").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(400)
                message.should.be.a('string').that.equals("Only a maximum of two filters are allowed.")
                //result should be empty
                result.should.be.an('array').that.is.empty
                done()
            })
        })

    })

    describe('UC-203 Requesting of user profile /api/user', () => {
        beforeEach((done) => {
            dbconnection.getConnection(function (err, connection) {
                if (err) throw err
                connection.query(
                    CLEAR_DB + INSERT_USER_MEAL,
                    function (error, results, fields) {
                        connection.release()
                        if (error) throw error
                        done()
                    }
                )
            })
        })
        it('When an invalid token is provided a valid error will be returned', (done) => {
            chai.request(server).get("/api/user").set('Authorization', `Bearer invalidtoken`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(401)
                message.should.be.a('string').that.equals("Not authorized")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When a valid token is provided a valid result will be returned', (done) => {
            chai.request(server).get("/api/user/profile").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(200)
                message.should.be.a('string').that.equals("Successfully retrieved profile")
                result.should.be.an('object')
                result.should.have.property('id').that.equals(1);
                result.should.have.property('firstName').that.equals("Klaas")
                result.should.have.property('lastName').that.equals("Klaassen")
                result.should.have.property('emailAdress').that.equals("existing@gmail.com")
                result.should.have.property('street').that.equals("Teststraat 23")
                result.should.have.property('city').that.equals("Rotterdam")
                result.should.have.property('password').that.equals("secret")
                result.should.have.property('isActive').that.equals(1)
                done()
            })
        })

    })
    describe('UC-204 Requesting of user per id /api/user', () => {
        beforeEach((done) => {
            dbconnection.getConnection(function (err, connection) {
                if (err) throw err
                connection.query(
                    CLEAR_DB + INSERT_USER_MEAL,
                    function (error, results, fields) {
                        connection.release()
                        if (error) throw error
                        done()
                    }
                )
            })
        })
        it('When an invalid token is provided a valid error will be returned', (done) => {
            chai.request(server).get("/api/user/1").set('Authorization', `Bearer invalidtoken`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(401)
                message.should.be.a('string').that.equals("Not authorized")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When a not existing id is provided a valid error will be returned', (done) => {
            chai.request(server).get("/api/user/-120").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(404)
                message.should.be.a('string').that.equals("User with ID -120 not found")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When a valid id is provided a valid result will be returned', (done) => {
            chai.request(server).get("/api/user/1").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(200)
                message.should.be.a('string').that.equals("Successfully retrieved user")
                result.should.be.an('object')
                result.should.have.property('id').that.equals(1);
                result.should.have.property('firstName').that.equals("Klaas")
                result.should.have.property('lastName').that.equals("Klaassen")
                result.should.have.property('emailAdress').that.equals("existing@gmail.com");
                result.should.have.property('phoneNumber').that.equals("-")
                result.meals.should.be.an('array')
                result.meals.should.have.lengthOf(1)
                result.meals[0].should.have.property('id').that.equals(1)
                result.meals[0].should.have.property('name').that.equals("Kaas")
                result.meals[0].should.have.property('description').that.equals("Oude Kaas")
                result.meals[0].should.have.property('price').that.equals("3.10")
                result.meals[0].should.have.property('allergenes').that.equals("")
                result.meals[0].should.have.property('isActive').that.equals(0)
                result.meals[0].should.have.property('isVega').that.equals(0)
                result.meals[0].should.have.property('isVega').that.equals(0)
                result.meals[0].should.have.property('isToTakeHome').that.equals(1)
                result.meals[0].should.have.property('dateTime')
                result.meals[0].should.have.property('imageUrl').that.equals("www.kaas.com")
                result.meals[0].should.have.property('cookId').that.equals(1)
                result.meals[0].should.have.property('createDate')
                result.meals[0].should.have.property('updateDate')
                done()
            })
        })
    })
    describe('UC-205 updating user info id /api/user', () => {
        beforeEach((done) => {
            dbconnection.getConnection(function (err, connection) {
                if (err) throw err
                connection.query(
                    CLEAR_DB + INSERT_USER_MEAL,
                    function (error, results, fields) {
                        connection.release()
                        if (error) throw error
                        done()
                    }
                )
            })
        })
        it('When required field email address is missing a valid error will be returned', (done) => {
            chai.request(server).put("/api/user/1").set('Authorization', `Bearer ${token}`).send({
                id:1,
                firstName: "Klaas",
                lastName: "Klaassen",
                street: "Teststraat 23",
                city: "Rotterdam",
                password: "secret",
                isActive: true,
                //email is missing
                phoneNumber: "0612345678"
            }).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(400)
                message.should.be.a('string').that.equals("Email adress must be a string")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When the user is not the owner of the profile a valid error will be returned', (done) => {
            chai.request(server).put("/api/user/2").set('Authorization', `Bearer ${token}`).send({
                id: 1,
                firstName: "Klaas",
                lastName: "Klaassen",
                street: "Teststraat 23",
                city: "Rotterdam",
                password: "secret",
                isActive: true,
                emailAdress: "aangepast@gmail.com",
                phoneNumber: "0612345678"
            }).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(403)
                message.should.be.a('string').that.equals("You are not authorized to update this user.")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When an invalid phone number is provided a valid error will be returned', (done) => {
            chai.request(server).put("/api/user/1").set('Authorization', `Bearer ${token}`).send({
                id: 1,
                firstName: "Klaas",
                lastName: "Klaassen",
                street: "Teststraat 23",
                city: "Rotterdam",
                password: "secret",
                isActive: true,
                emailAdress: "existing@gmail.com",
                //invalid phone number
                phoneNumber: "0612345678123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890"
            }).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(400)
                message.should.be.a('string').that.equals("Phone number must be valid")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When an not exising user id is provided a valid error will be returned', (done) => {
            chai.request(server).put("/api/user/-120").set('Authorization', `Bearer ${token}`).send({
                id: 1,
                firstName: "Klaas",
                lastName: "Klaassen",
                street: "Teststraat 23",
                city: "Rotterdam",
                password: "secret",
                isActive: true,
                emailAdress: "existing@gmail.com",
                phoneNumber: "0612345678"
            }).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(404)
                message.should.be.a('string').that.equals("User with ID -120 not found")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When user is not logged in a valid error will be returned', (done) => {
            chai.request(server).put("/api/user/1").send({
                id: 1,
                firstName: "Klaas",
                lastName: "Klaassen",
                street: "Teststraat 23",
                city: "Rotterdam",
                password: "secret",
                isActive: true,
                emailAdress: "existing@gmail.com",
                phoneNumber: "0612345678"
            }).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(401)
                message.should.be.a('string').that.equals("Authorization header missing")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When valid data is provided the user will be updated', (done) => {
            chai.request(server).put("/api/user/1").set('Authorization', `Bearer ${token}`).send({
                id: 1,
                firstName: "Klaas",
                lastName: "Klaassen",
                street: "Teststraat 23",
                city: "Rotterdam",
                password: "secret",
                isActive: true,
                emailAdress: "existing@gmail.com",
                phoneNumber: "0687654321"
            }).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(200)
                message.should.be.a('string').that.equals("User successfully updated")
                //Result should be the updated user
                result.should.be.an('object')
                result.should.have.property('id').that.equals(1)
                result.should.have.property('firstName').that.equals("Klaas")
                result.should.have.property('lastName').that.equals("Klaassen")
                result.should.have.property('street').that.equals("Teststraat 23")
                result.should.have.property('city').that.equals("Rotterdam")
                result.should.have.property('password').that.equals("secret")
                result.should.have.property('isActive').that.equals(1)
                result.should.have.property('emailAdress').that.equals("existing@gmail.com")
                result.should.have.property('phoneNumber').that.equals("0687654321")
                done()
            })
        })

    })
    describe('UC-206 Deleting a user /api/user', () => {
        beforeEach((done) => {
            dbconnection.getConnection(function (err, connection) {
                if (err) throw err
                connection.query(
                    CLEAR_DB + INSERT_USER,
                    function (error, results, fields) {
                        connection.release()
                        if (error) throw error
                        done()
                    }
                )
            })
        })
        it('When a user does not exist a valid error will be returned', (done) => {
            chai.request(server).delete("/api/user/-1").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(404)
                message.should.be.a('string').that.equals("User with ID -1 not found")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When a user is not logged in a valid error will be returned', (done) => {
            chai.request(server).delete("/api/user/1").end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(401)
                message.should.be.a('string').that.equals("Authorization header missing")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When the user is not the owner of the account a valid error will be returned', (done) => {
            chai.request(server).delete("/api/user/2").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(403)
                message.should.be.a('string').that.equals("You are not authorized to delete this user.")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When a valid user id is provided the user will be deleted', (done) => {
            chai.request(server).delete("/api/user/1").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(200)
                message.should.be.a('string').that.equals("User with ID 1 successfully deleted")
                //result should be undefined
                chai.expect(result).to.be.undefined
                done()
            })
        })
    })
})