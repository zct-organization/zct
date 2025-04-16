const postgres = require("postgres")

const connectionString = process.env.DB_URI
const sql = postgres(connectionString, {})

module.exports = sql
