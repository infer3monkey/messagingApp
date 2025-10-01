import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import moment from 'moment'

const router = express.Router()

// Notice how these only get called when in the /auth route so /auth is not needed in this

// Register a new user endpoint POST /auth/register
router.post('/register', async (req, res) => {
    const {username, password, publicKey} = req.body //Gives Access to the JSON

    // Adding constraints for the username and password such as character requirement and such
    if (username.length < 2 || password.length < 4) {
        console.log("Username or Password is too short")
        res.sendStatus(400)
    } else {

    // 1 way encryption password using bcryptjs
    const hashedPassword = bcrypt.hashSync(password, 8)

    // Save the new user and encrypted password to the db
    try {

        // Add the user to the database
        const insertUserText = 'INSERT INTO users (username, password, public_key) VALUES ($1, $2, $3) RETURNING id';
        const insertUserValues = [username, hashedPassword, publicKey];
        const result = await pool.query(insertUserText, insertUserValues);

        const userId = result.rows[0].id;

        /* Add default welcome message
        const messageTimestamp = moment().format('MM/DD/YY, h:mm a');
        const defaultMessage = `Hello, I am ${username}. I will be joining Fireplace!`;
        const insertMessageText = 'INSERT INTO messages (user_id, text, timestamp) VALUES ($1, $2, $3)';
        const insertMessageValues = [userId, defaultMessage, messageTimestamp];
        await pool.query(insertMessageText, insertMessageValues);*/

        // Create JWT token for authentication -> give to client so they can use
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
        res.sendStatus(201);

    } catch (err) {
        console.log(err.message)
        res.sendStatus(503) // Server has broken down somewhere in the process
    }

    }
})

router.post('/login', async (req, res) => {

    const { username, password } = req.body;

    try {
        // Query user by username
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = userResult.rows[0];

        // Check user exists
        if (!user) {
            return res.status(404).send({ message: "User not Found" });
        }

        // Validate password
        const passwordIsValid = await bcrypt.compare(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).send({ message: "Invalid Password" });
        }

        // Create JWT token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ token });

    } catch (err) {
        console.error(err.message);
        res.sendStatus(503);
    }
})

router.post('/publicKey', async (req, res) => {
    const { publicKey, username } = req.body;

    try {
        const addPublicKey = await pool.query('UPDATE users SET public_key = $1 WHERE username = $2', [publicKey, username]);

        res.json({ message: "Added Public Key" })
        
    } catch (err){
        console.error(err.message);
        res.sendStatus(503);
    }
})

export default router