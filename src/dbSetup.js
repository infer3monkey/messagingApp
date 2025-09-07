import pool from './db.js';

async function setupTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
      );
    `);

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
  } finally {
    // Optionally, end the pool if you only want to run setup once
    // await pool.end();
  }
}

export default setupTables;