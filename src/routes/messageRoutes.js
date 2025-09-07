import express from 'express'
import pool from '../db.js'
//import db from '../db.js'

const router = express.Router()

// All of these need to have a valid token I believe

// Get all messages from all users
router.get('/all', async (req, res) => {

    try {
        const result = await pool.query(`
            SELECT messages.*, users.username 
            FROM messages 
            JOIN users ON users.id = messages.user_id
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

    /*//const getMessages = db.prepare('SELECT * FROM messages')
    const getMessages = db.prepare(`
        SELECT messages.*, users.username 
        FROM messages 
        JOIN users ON users.id = messages.user_id
    `)
    
    const messages = getMessages.all()

    res.json({
        requestUserId: req.userId,
        messages: messages
    })*/
})

// Create a new message
router.post('/', async (req, res) => {

    const { text } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO messages (user_id, text) VALUES ($1, $2) RETURNING id, text',
            [req.userId, text]
        );

        const insertedMessage = result.rows[0]; // This will have the id and text of the new row

        res.json({ id: insertedMessage.id, text: insertedMessage.text });
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }

    /*const { text } = req.body
    const insertMessage = db.prepare(`INSERT INTO messages (user_id, text) VALUES (?, ?)`)
    const result = insertMessage.run(req.userId, text)
    res.json({id: result.lastInsertRowid, text})*/
})

// edit a message, needs the id of the user, has a dynamic id, need to change the completed stuff
router.put('/:id', async (req, res) => {
    const { text } = req.body;
    const { id } = req.params;

    try {
        await pool.query(
            'UPDATE messages SET text = $1 WHERE id = $2',
            [text, id]
        );

        res.json({ message: "Message Changed" });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }

   /* const { text } = req.body
    const { id } = req.params

    const updatedMessage = db.prepare('UPDATE messages SET text = ? WHERE id = ?')
    updatedMessage.run(text, id)

    res.json({ message: "Message Changed" })*/
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

    /*const { id } = req.params
    const deleteMessage = db.prepare('DELETE FROM messages WHERE id = ? AND user_id = ?')
    deleteMessage.run(id, req.userId)
    res.json({ message: "Message Deleted" })*/
})

router.get('/verifyToken', (req, res) => {
    res.json({ message: "Token is Valid"})
})

/* Get all messages from a specific user /messages/user/
router.get('/user', async (req, res) => {

    try {
        await pool.query ('SELECT * FROM messages WHERE ')

    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }

    const getMessages = db.prepare('SELECT * FROM messages WHERE user_id = ?')
    // This is possible through the middleware which intercepts this and gives us the userId
    const messages = getMessages.all(req.userId)

    const getUsername = db.prepare('SELECT * FROM users WHERE id = ?')
    const username = getUsername.run(req.userId)

    res.json(messages)
})*/

export default router