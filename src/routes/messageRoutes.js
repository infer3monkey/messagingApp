import express from 'express'
import pool from '../db.js'
import moment from 'moment'

const router = express.Router()

// All of these endpoints require a valid token due to middleware, need to add channel checks soon as well

async function checkChannelPermission(channel_id, userId){
    const validFriendshipCheck = await pool.query(`
        SELECT channel_id FROM friends 
        WHERE (channel_id = $1 AND user_id = $2 AND accepted = TRUE) 
        OR (channel_id = $1 AND friend_user_id = $2 AND accepted = TRUE)`,
        [channel_id, userId]
    );

    if (validFriendshipCheck.rows.length === 0) {
        // Invalid Channel For this User
        return false;
    }
    return true;
}

// Get all messages for global chat
router.get('/all/:id', async (req, res) => {

    const { id } = req.params;

    try {
        if (id != 1) {
            const allowed = await checkChannelPermission(id, req.userId);
            if (!allowed) {
                res.sendStatus(404);
                return;
            }
        } 

        const result = await pool.query(`
            SELECT messages.*, users.username 
            FROM messages 
            JOIN users ON users.id = messages.user_id
            WHERE messages.channel_id = $1
            ORDER BY messages.id ASC`,
            [id]
        );
            
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

    const { text, channel_id } = req.body;
    const messageTimestamp = moment().format('MM/DD/YY, h:mm a');

    try {
        if (channel_id != 1) {
            const allowed = await checkChannelPermission(channel_id, req.userId);
            if (!allowed) {
                res.sendStatus(404);
                return;
            }
        } 

        const result = await pool.query(
            'INSERT INTO messages (user_id, text, timestamp, channel_id) VALUES ($1, $2, $3, $4) RETURNING id, text',
            [req.userId, text, messageTimestamp, channel_id]
        );

        const insertedMessage = result.rows[0]; // This will have the id and text of the new row

        res.json({ id: insertedMessage.id, text: insertedMessage.text });
        
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

// Edit a message, needs the dyanmic id of the message
router.put('/:id', async (req, res) => {
    const { text, channel_id } = req.body;
    const { id } = req.params;

    try {
        if (channel_id != 1) {
            const allowed = await checkChannelPermission(channel_id, req.userId);
            if (!allowed) {
                res.sendStatus(404);
                return;
            }
        }

        await pool.query(
            'UPDATE messages SET text = $1, edited = true WHERE id = $2 AND user_id = $3 AND channel_id = $4',
            [text, id, req.userId, channel_id]
        );

        res.json({ message: "Message Changed" });
        
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
})

// Delete a message, also a dynamic id
router.delete('/:id/:channel_id', async (req, res) => {
    const { id, channel_id } = req.params;

    try {
        if (channel_id != 1) {
            const allowed = await checkChannelPermission(channel_id, req.userId);
            if (!allowed) {
                res.sendStatus(404);
                return;
            }
        } 

        await pool.query(
            'DELETE FROM messages WHERE id = $1 AND user_id = $2 AND channel_id = $3',
            [id, req.userId, channel_id]
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