const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require("../../index");
const dbconnection = require('../../database/dbconnection');
const token = process.env.TEST_TOKEN
chai.should();
chai.use(chaiHttp);

const CLEAR_DB =
    'DELETE IGNORE FROM `meal`; DELETE IGNORE FROM `meal_participants_user`; DELETE IGNORE FROM `user`;'

const INSERT_USER =
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +
    '(1, "Klaas", "Klaassen", "existing@gmail.com", "secret", "Teststraat 23", "Rotterdam");' +
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +
    '(2, "Jan", "Pieter", "existing2@gmail.com", "secret", "Teststraat 23", "Rotterdam");' +
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city`, `isActive` ) VALUES' +
    '(3, "Hans", "Hansen", "existing3@gmail.com", "secret", "Teststraat 23", "Rotterdam", false);' +
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city`, `isActive` ) VALUES' +
    '(4, "Bert", "Bertus", "existing4@gmail.com", "secret", "Teststraat 23", "Rotterdam", false);'


describe('Manage meal', () => {
    describe('UC-301 Adding a meal /api/meal', () => {
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
            chai.request(server).post("/api/meal").set('Authorization', `Bearer ${token}`).send({
                //Name is missing
                description: "Lekkere oude kaas",
                isActive: true,
                isVega: true,
                isVegan: false,
                isToTakeHome: true,
                dateTime: "2023-05-30T16:35:00.000Z",
                imageUrl: "https://cdn.vox-cdn.com/thumbor/Si2spWe-6jYnWh8roDPVRV7izC4=/0x0:1192x795/1400x788/filters:focal(596x398:597x399)/cdn.vox-cdn.com/uploads/chorus_asset/file/22312759/rickroll_4k.jpg",
                maxAmountOfParticipants: 2,
                price: 10,
                allergenes : "None"
            })
                .end((err, res) => {
                    res.should.be.an('object')
                    let { statusCode, message, result } = res.body;
                    statusCode.should.equals(400)
                    message.should.be.a('string').that.equals("Name must be a string")
                    //result should be undefined
                    chai.expect(result).to.be.undefined
                    done()
                })
        })
        it('When the user is not logged in a valid error should be returned.', (done) => {
            chai.request(server).post("/api/meal").send({
                name: "Kaas",
                description: "Lekkere oude kaas",
                isActive: true,
                isVega: true,
                isVegan: false,
                isToTakeHome: true,
                dateTime: "2023-05-30T16:35:00.000Z",
                imageUrl: "https://cdn.vox-cdn.com/thumbor/Si2spWe-6jYnWh8roDPVRV7izC4=/0x0:1192x795/1400x788/filters:focal(596x398:597x399)/cdn.vox-cdn.com/uploads/chorus_asset/file/22312759/rickroll_4k.jpg",
                maxAmountOfParticipants: 2,
                price: 10,
                allergenes : "None"
            })
                .end((err, res) => {
                    res.should.be.an('object')
                    let { statusCode, message, result } = res.body;
                    statusCode.should.equals(401)
                    message.should.be.a('string').that.equals("Authorization header missing")
                    //result should be undefined
                    chai.expect(result).to.be.undefined
                    done()
                })
        })
        it('When valid data is send a valid result should be returned.', (done) => {
            chai.request(server).post("/api/meal").set('Authorization', `Bearer ${token}`).send({
                name: "Kaas",
                description: "Lekkere oude kaas",
                isActive: true,
                isVega: true,
                isVegan: false,
                isToTakeHome: true,
                dateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
                imageUrl: "https://cdn.vox-cdn.com/thumbor/Si2spWe-6jYnWh8roDPVRV7izC4=/0x0:1192x795/1400x788/filters:focal(596x398:597x399)/cdn.vox-cdn.com/uploads/chorus_asset/file/22312759/rickroll_4k.jpg",
                maxAmountOfParticipants: 2,
                price: 10,
                allergenes : "None"
            })
                .end((err, res) => {
                    res.should.be.an('object')
                    let { statusCode, message, result } = res.body;
                    statusCode.should.equals(201)
                    message.should.be.a('string').that.equals("Meal added")
                    result.should.be.an('object')
                    result.should.have.property('id')
                    result.should.have.property('name').that.equals("Kaas")
                    result.should.have.property('description').that.equals("Lekkere oude kaas")
                    result.should.have.property('isActive').that.equals(1)
                    result.should.have.property('isVega').that.equals(1)
                    result.should.have.property('isVegan').that.equals(0)
                    result.should.have.property('isToTakeHome').that.equals(1)
                    result.should.have.property('dateTime')
                    result.should.have.property('imageUrl').that.equals("https://cdn.vox-cdn.com/thumbor/Si2spWe-6jYnWh8roDPVRV7izC4=/0x0:1192x795/1400x788/filters:focal(596x398:597x399)/cdn.vox-cdn.com/uploads/chorus_asset/file/22312759/rickroll_4k.jpg")
                    result.should.have.property('maxAmountOfParticipants').that.equals(2)
                    result.should.have.property('price').that.equals("10.00")
                    result.should.have.property('allergenes').that.equals("None")

                    done()
                })
        })


    })
    describe('UC-303 Requesting overview of meals /api/meal', () => {
        beforeEach((done) => {
            dbconnection.getConnection(function (err, connection) {
                if (err) throw err
                connection.query(
                    CLEAR_DB + INSERT_USER +
                        'INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES' +
                    "(1, 'Kaas', 'Oude Kaas', 'www.kaas.com', NOW(), 2, 3.10, 1);",
                    function (error, results, fields) {
                        connection.release()
                        if (error) throw error
                        done()
                    }
                )
            })
        })
        it('When valid data is send a valid result should be returned.', (done) => {
            chai.request(server).get("/api/meal").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let { statusCode, message, result } = res.body;
                statusCode.should.equals(200)
                message.should.be.a('string').that.equals("Meals found")
                result.should.be.an('array')
                result.should.have.lengthOf(1)
                result[0].should.have.property('id')
                result[0].should.have.property('name').that.equals("Kaas")
                result[0].should.have.property('description').that.equals("Oude Kaas")
                result[0].should.have.property('isActive').that.equals(0)
                result[0].should.have.property('isVega').that.equals(0)
                result[0].should.have.property('isVegan').that.equals(0)
                result[0].should.have.property('isToTakeHome').that.equals(1)
                result[0].should.have.property('dateTime')
                result[0].should.have.property('imageUrl').that.equals("www.kaas.com")
                result[0].should.have.property('maxAmountOfParticipants').that.equals(2)
                result[0].should.have.property('price').that.equals("3.10")
                result[0].should.have.property('allergenes').that.equals("")
                result[0].should.have.property('cookId').that.equals(1)
                done()
            })
        })

    })
    describe('UC-304 Requesting meal by ID /api/meal/:mealId', () => {
        beforeEach((done) => {
            dbconnection.getConnection(function (err, connection) {
                if (err) throw err
                connection.query(
                    CLEAR_DB + INSERT_USER +
                    'INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES' +
                    "(1, 'Kaas', 'Oude Kaas', 'www.kaas.com', NOW(), 2, 3.10, 1);",
                    function (error, results, fields) {
                        connection.release()
                        if (error) throw error
                        done()
                    }
                )
            })
        })
        it('When a meal that does not exist is requested a valid result should be returned.', (done) => {
            chai.request(server).get("/api/meal/-120").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(404)
                message.should.be.a('string').that.equals("Meal with ID -120 not found")
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When a valid meal is requested a valid result should be returned.', (done) => {
            chai.request(server).get("/api/meal/1").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(200)
                message.should.be.a('string').that.equals("Meal found")
                result.should.be.an('object')
                result.should.have.property('id')
                result.should.have.property('name').that.equals("Kaas")
                result.should.have.property('description').that.equals("Oude Kaas")
                result.should.have.property('isActive').that.equals(0)
                result.should.have.property('isVega').that.equals(0)
                result.should.have.property('isVegan').that.equals(0)
                result.should.have.property('isToTakeHome').that.equals(1)
                result.should.have.property('dateTime')
                result.should.have.property('imageUrl').that.equals("www.kaas.com")
                result.should.have.property('maxAmountOfParticipants').that.equals(2)
                result.should.have.property('price').that.equals("3.10")
                result.should.have.property('allergenes').that.equals("")
                result.should.have.property('cookId').that.equals(1)
                done()
            })
        })
    })
    describe('UC-305 Deleting a meal /api/meal/:mealId', () => {
        beforeEach((done) => {
            dbconnection.getConnection(function (err, connection) {
                if (err) throw err
                connection.query(
                    CLEAR_DB + INSERT_USER +
                    'INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES' +
                    "(1, 'Kaas', 'Oude Kaas', 'www.kaas.com', NOW(), 2, 3.10, 2);"
                    +
                    'INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES' +
                    "(2, 'Kaas', 'Oude Kaas', 'www.kaas.com', NOW(), 2, 3.10, 1);",
                    function (error, results, fields) {
                        connection.release()
                        if (error) throw error
                        done()
                    }
                )
            })
        })
        it('When user is not logged in a valid result should be returned.', (done) => {
            chai.request(server).delete("/api/meal/1").end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(401)
                message.should.be.a('string').that.equals("Authorization header missing")
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When the user is not the owner of the meal a valid result should be returned.', (done) => {
            chai.request(server).delete("/api/meal/1").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(403)
                message.should.be.a('string').that.equals("You are not authorized to delete this meal.")
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When a meal that does not exist is deleted a valid result should be returned.', (done) => {
            chai.request(server).delete("/api/meal/-120").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(404)
                message.should.be.a('string').that.equals("Meal with ID -120 not found")
                chai.expect(result).to.be.undefined
                done()
            })
        })
        it('When a valid meal is deleted a valid result should be returned.', (done) => {
            chai.request(server).delete("/api/meal/2").set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.be.an('object')
                let {statusCode, message, result} = res.body;
                statusCode.should.equals(200)
                message.should.be.a('string').that.equals("Meal with ID 2 successfully deleted")
                chai.expect(result).to.be.undefined
                done()
            })
        })
    })
})