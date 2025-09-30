import express from 'express'
import pool from '../db.js'
import moment from 'moment'

const router = express.Router()

// All of these endpoints require a valid token due to middleware
// All addresses here are /friends/...

// Create a new Friend Request
router.post('/createRequest', async (req, res) => {

    const { friendName } = req.body;

    try {
        // Find Friend_ID from friendName, if empty then friend does not exist, return and let client know
        const friendId = await pool.query(
            `SELECT id FROM users WHERE username = $1`,
            [friendName]
        );

        if (friendId.rows.length === 0) {
            // Friend not found
            res.sendStatus(404);
            return;
        }

        if (friendId.rows[0].id == req.userId) {
            // Trying to Add Themselves as a Friend
            res.sendStatus(404);
            return;
        }

        // Check if this request or connection already exists
        const checkFriendConnection = await pool.query(
            `SELECT user_id, friend_user_id FROM friends 
             WHERE (user_id = $1 AND friend_user_id = $2)
             OR (user_id = $2 AND friend_user_id = $1)`,
            [req.userId, friendId.rows[0].id]
        );

        if (checkFriendConnection.rows.length != 0) {
            // Friend Request already exists
            res.sendStatus(409);
            return;
        }

        // Create a new channel corresponding to this friendship
        const createFriendChannel = await pool.query(
            `INSERT INTO channels VALUES (DEFAULT) RETURNING id`
        );

        // Create the new friendship with pending value
        const createFriendship = await pool.query(
            `INSERT INTO friends (user_id, friend_user_id, channel_id) VALUES ($1, $2, $3)`,
            [req.userId, friendId.rows[0].id, createFriendChannel.rows[0].id]
        );

        res.json({ message: "friendship request sent" })

    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

// Get all pending friend requests
router.get('/getPending', async (req, res) => {
    try {
        const incomingFriendReqs = await pool.query(`
            SELECT friends.*, users.username 
            FROM friends
            JOIN users ON friends.user_id = users.id
            WHERE friend_user_id = $1 AND accepted = FALSE
        `, [req.userId]);

        res.json(incomingFriendReqs.rows);

    } catch(err) {
        console.log(err);
        res.sendStatus(500);
    }
})

// Accept a Pending Friend Request, Edit the Accepted value to true
router.put('/acceptFriend', async (req, res) => {

    const { friendName } = req.body;

    try {
        const friendId = await pool.query(
            `SELECT id FROM users WHERE username = $1`,
            [friendName]
        );

        if (friendId.rows.length === 0) {
            // Friend not found
            res.sendStatus(404);
            return;
        }

        await pool.query(
            'UPDATE friends SET accepted = TRUE WHERE user_id = $1 AND friend_user_id = $2',
            [friendId.rows[0].id, req.userId]
        );

        res.json({ message: "Friend Request Accepted"})

    } catch(err) {
        console.log(err);
        res.sendStatus(500);
    } 

})

// Remove friend connection from the friends database, can be for a decline request or a removal of a friend
router.delete('/deleteFriend', async (req, res) => {
    const { friendName } = req.body;

    try {
        const friendId = await pool.query(
            `SELECT id FROM users WHERE username = $1`,
            [friendName]
        );

        if (friendId.rows.length === 0) {
            // Friend not found
            res.sendStatus(404);
            return;
        }

        await pool.query(
            'DELETE FROM friends WHERE (user_id = $1 AND friend_user_id = $2) OR (user_id = $2 AND friend_user_id = $1)',
            [friendId.rows[0].id, req.userId]
        );

        res.json({ message: "Friend Removed"})

    } catch(err) {
        console.log(err);
        res.sendStatus(500);
    } 
})

// Get all active friends, similar to getting pending requests, bidirectional, accepted = true
router.get('/getFriends', async (req, res) => {
    try {
        const allFriends = await pool.query(`
            SELECT friends.*, users.username
            FROM friends
            JOIN users ON 
            (friends.user_id = users.id AND friends.friend_user_id = $1)
            OR 
            (friends.friend_user_id = users.id AND friends.user_id = $1)
            WHERE accepted = TRUE;
        `, [req.userId]);

        res.json(allFriends.rows);

    } catch(err) {
        console.log(err);
        res.sendStatus(500);
    }
})

router.get('/obtainPublicKey/:friendName', async (req, res) => {
    const { friendName } = req.params;
    try {
        const publicKey = await pool.query (`SELECT public_key FROM users WHERE username = $1`, [friendName]);
        if (publicKey.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ publicKey: publicKey.rows[0].public_key});
    } catch(err) {
        console.log(err);
        res.sendStatus(500);
    }
})

export default router