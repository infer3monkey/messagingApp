import pkg from 'pg'; // postgreSQL

// Creating a connection to the postgreSQL database
const { Pool } = pkg;

const pool = new Pool({
    host: 'db',
    port: 5432,
    user: 'user123',
    password: 'password123',
    database: 'db123'
})

export default pool // Letting dbSetup.js access this pool connection