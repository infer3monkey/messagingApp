import express from 'express'
import pool from '../db.js'
import moment from 'moment'

const router = express.Router()

// All of these endpoints require a valid token due to middleware

// Create a new Friend Request
router.post('/createRequest', async (req, res) => {

    const { friendName } = req.body;

    try {
        // Find Friend_ID from friendName, if empty then friend does not exist, return and let client know

        // Check if this request or connection already exists

        // Create a new channel corresponding to this friendship

        // Create the new friendship with pending value



        /* Example Code
        const result = await pool.query(
            'INSERT INTO messages (user_id, text, timestamp) VALUES ($1, $2, $3) RETURNING id, text',
            [req.userId, text, messageTimestamp]
        );

        const insertedMessage = result.rows[0]; // This will have the id and text of the new row

        res.json({ id: insertedMessage.id, text: insertedMessage.text });*/
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

// Get all pending friend requests

export default router