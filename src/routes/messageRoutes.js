import express from 'express'
import pool from '../db.js'
import moment from 'moment'

const router = express.Router()

// All of these endpoints require a valid token due to middleware

// Get all messages from all users
router.get('/all', async (req, res) => {

    try {
        const result = await pool.query(`
            SELECT messages.*, users.username 
            FROM messages 
            JOIN users ON users.id = messages.user_id
            ORDER BY messages.id ASC
        `);
        
        const messages = result.rows; // this is an array of all joined message rows

        res.json({
            requestUserId: req.userId,
            messages: messages
        });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
})

// Create a new message
router.post('/', async (req, res) => {

    const { text } = req.body;
    const messageTimestamp = moment().format('MM/DD/YY, h:mm a');

    try {
        const result = await pool.query(
            'INSERT INTO messages (user_id, text, timestamp) VALUES ($1, $2, $3) RETURNING id, text',
            [req.userId, text, messageTimestamp]
        );

        const insertedMessage = result.rows[0]; // This will have the id and text of the new row

        res.json({ id: insertedMessage.id, text: insertedMessage.text });
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

// Edit a message, needs the id of the user, has a dynamic id, need to change the completed stuff
router.put('/:id', async (req, res) => {
    const { text } = req.body;
    const { id } = req.params;

    try {
        await pool.query(
            'UPDATE messages SET text = $1, edited = true WHERE id = $2',
            [text, id]
        );

        res.json({ message: "Message Changed" });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
})

// Delete a message, also a dynamic id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            'DELETE FROM messages WHERE id = $1 AND user_id = $2',
            [id, req.userId]
        );
        res.json({ message: "Message Deleted" });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
})

router.get('/verifyToken', (req, res) => {
    res.json({ message: "Token is Valid"})
})

export default router