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

    // Create the channels table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id SERIAL PRIMARY KEY
      );
    `);

    // Create the messages table which stores all messages from global chat
    // will likely change format as message channels get added
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        channel_id INTEGER REFERENCES channels(id) DEFAULT 1,
        user_id INTEGER REFERENCES users(id),
        text TEXT,
        edited BOOLEAN DEFAULT FALSE,
        timestamp TEXT
      );
    `);

    // Create the friends table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS friends (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        friend_user_id INTEGER REFERENCES users(id),
        channel_id INTEGER REFERENCES channels(id),
        accepted BOOLEAN DEFAULT FALSE
      );
    `);

    // Creating indexes on foreign keys for efficiency
    await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_friends_friend_user_id ON friends(friend_user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_friends_channel_id ON friends(channel_id)');

    // Inserting Global Chat on Creation, if it doesn't exist at id 1
    await pool.query(`
      INSERT INTO channels (id)
      SELECT 1
      WHERE NOT EXISTS (SELECT 1 FROM channels WHERE id = 1);
    `);

    console.log('Tables created!');
  } catch (err) {
    console.error('Error creating tables:', err);
  } 
}

export default setupTables; // Letting server.js access this db creation function