const mysql = require('mysql2')
const pool = mysql.createPool({
    multipleStatements: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD  || '',
    database: process.env.DB_DATABASE ||  'shareameal',
})

module.exports = pool

pool.on('acquire', function (connection) {
    console.log('Connection %d acquired', connection.threadId)
})

pool.on('release', function (connection) {
    console.log('Connection %d released', connection.threadId)
})