const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require("../../index")
const dbconnection = require('../../database/dbconnection')
chai.should()
chai.use(chaiHttp)

const CLEAR_DB =
    'DELETE IGNORE FROM `meal`; DELETE IGNORE FROM `meal_participants_user`; DELETE IGNORE FROM `user`;'

const INSERT_USER =
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +
    '(1, "Quinn", "Verschoor", "test@gmail.com", "secret", "Teststraat 23", "Rotterdam");'
describe('Inloggen', () => {
    describe('UC-101 Login user /api/login', () => {
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

        it('When a required field is missing a valid error should be returned.', (done) => {
            chai.request(server).post("/api/login").send({
                //Email mist
                password: "secret",
            })
                .end((err, res) => {
                    res.should.be.an('object')
                    let {statusCode, message, result} = res.body;
                    statusCode.should.equals(400)
                    message.should.be.a('string').that.equals("Email address must be a string")
                    //result should be undefined
                    chai.expect(result).to.be.undefined
                    done()
                })

        })
        it('When a password is invalid a valid error should be returned.', (done) => {
            chai.request(server).post("/api/login").send({
                emailAddress: "test@gmail.com",
                //password is shorter than 4 characters so it is invalid
                password: "my",

            })
                .end((err, res) => {
                    res.should.be.an('object')
                    let {statusCode, message, result} = res.body;
                    statusCode.should.equals(400)
                    message.should.be.a('string').that.equals("Password must be valid")
                    chai.expect(result).to.be.undefined

                    done()
                })
        })
        it('When a user is not found a valid error should be returned.', (done) => {
            chai.request(server).post("/api/login").send({
                emailAddress: "wrong@gmail.com",
                password: "secret",

            }).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(404)
                message.should.be.a('string').that.equals("Email not found")
                done()
            })
        })
        it('User should be able to login with valid credentials.', (done) => {
            chai.request(server).post("/api/login").send({
                emailAddress: "test@gmail.com",
                password: "secret"
            }).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(200)
                message.should.be.a('string').that.equals("Login successful")
                result.should.be.an('object')
                result.should.have.property('token')
                result.should.have.property('firstName')
                result.should.have.property('lastName')
                result.should.have.property('emailAdress')
                done()
            })
        })

    })
})