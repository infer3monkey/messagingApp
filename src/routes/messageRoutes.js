import express from 'express'
import db from '../db.js'

const router = express.Router()

// All of these need to have a valid token I believe

// Get all messages from a specific user /messages/user/
router.get('/user', (req, res) => {
    const getMessages = db.prepare('SELECT * FROM messages WHERE user_id = ?')
    // This is possible through the middleware which intercepts this and gives us the userId
    const messages = getMessages.all(req.userId)

    const getUsername = db.prepare('SELECT * FROM users WHERE id = ?')
    const username = getUsername.run(req.userId)

    res.json(messages)
})

// Get all messages from all users
router.get('/all', (req, res) => {
    //const getMessages = db.prepare('SELECT * FROM messages')
    const getMessages = db.prepare(`
        SELECT messages.*, users.username 
        FROM messages 
        JOIN users ON users.id = messages.user_id
    `)
    
    const messages = getMessages.all()

    res.json({
        requestUserId: req.userId,
        messages: messages
    })
})

// Create a new message
router.post('/', (req, res) => {
    const { text } = req.body
    const insertMessage = db.prepare(`INSERT INTO messages (user_id, text) VALUES (?, ?)`)
    const result = insertMessage.run(req.userId, text)
    res.json({id: result.lastInsertRowid, text})
})

// edit a message, needs the id of the user, has a dynamic id, need to change the completed stuff
router.put('/:id', (req, res) => {
    const { text } = req.body
    const { id } = req.params

    const updatedMessage = db.prepare('UPDATE messages SET text = ? WHERE id = ?')
    updatedMessage.run(text, id)

    res.json({ message: "Message Changed" })
})

// Delete a message, also a dynamic id
router.delete('/:id', (req, res) => {
    const { id } = req.params
    const deleteMessage = db.prepare('DELETE FROM messages WHERE id = ? AND user_id = ?')
    deleteMessage.run(id, req.userId)
    res.json({ message: "Message Deleted" })
})

router.get('/verifyToken', (req, res) => {
    res.json({ message: "Token is Valid"})
})

export default router