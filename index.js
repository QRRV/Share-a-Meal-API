const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const userRouter = require('./src/routes/userRoutes')
const authRouter = require('./src/routes/authRoutes')
const mealRouter = require('./src/routes/mealRoutes')

let database = [];
let id = 0;

app.all('*', (req, res, next) => {
    const method = req.method;
    console.log(`Methode ${method} aangeroepen`);
    next();
})

app.use(userRouter)
app.use(authRouter)
app.use(mealRouter)

app.get('/', (req, res) => {
    res.status(200).json({
        status: 200,
        result:'Hello World!',
    });
})


app.all("*", (req, res) => {
    res.status(404).json({
        status: 404,
        result: "End-point not found"
    })
})
app.use((err, req, res, next) => {
    res.status(err.statusCode).json (err);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

module.exports = app;