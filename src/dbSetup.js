import pool from './db.js'; // Importing the pool we created in db.js

async function setupTables() {
  try {
    // Create the users table which is used for all the users on the chat app
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
      );
    `);

    // Create the messages table which stores all messages from global chat
    // will likely change format as message channels get added
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        text TEXT
      );
    `);

    console.log('Tables created!');
  } catch (err) {
    console.error('Error creating tables:', err);
  } 
}

export default setupTables; // Letting server.js access this db creation function