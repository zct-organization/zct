const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DB_URI)
module.exports = sql
