import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    host: 'db',
    port: 5432,
    user: 'user123',
    password: 'password123',
    database: 'db123'
})

export default pool

/* Database in SQLite
import { DatabaseSync } from 'node:sqlite'
const db = new DatabaseSync(':memory:') // In memory Database, not production quality

// Execute SQL statements from strings, primary key makes it so it can be referenced by other tables
db.exec(`
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
`)

// Relational database, you can see user_id is relating to the other one
db.exec(`
    CREATE TABLE messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        text TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
`)

// Allows you to use db in other files
export default db */