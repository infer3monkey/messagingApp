import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

// Notice how these only get callued when in the /auth route so /auth is not needed in this
// Register a new user endpoint POST /auth/register
router.post('/register', (req, res) => {
    const {username, password} = req.body //Gives Access to the JSON

    // Adding constraints for the username and password such as character requirement and such
    if (username.length < 2 || password.length < 4) {
        console.log("Username or Password is too short")
        res.sendStatus(400)
    } else {

    

    // 1 way encryption password using bcryptjs
    const hashedPassword = bcrypt.hashSync(password, 8)
    //console.log(hashedPassword)

    // Save the new user and encrypted password to the db
    try {
        // Similar to exec except we can inject values, this is SQL obviously
        const insertUser = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)') 
        // Specifices the values that we put as question marks earlier. This runs the SQL command
        const result = insertUser.run(username, hashedPassword)

        // Now that we have a user, I want to add a welcome message from them
        const defaultMessage = `Hello, I am ${username}. I will be joining this chat room!`
        const insertMessage = db.prepare('INSERT INTO messages (user_id, text) VALUES (?, ?)')
        // The most recently entered userID since we just created that would be this
        insertMessage.run(result.lastInsertRowid, defaultMessage)

        // Create A Token, so that the user can only modify there own Todo's. Similar to an api key
        const token = jwt.sign({id: result.lastInsertRowid}, process.env.JWT_SECRET, {expiresIn: '24h'})

        res.json({ token })
        //res.sendStatus(201)

    } catch (err) {
        console.log(err.message)
        res.sendStatus(503) // Server has broken down somewhere in the process
    }

    }
})

router.post('/login', (req, res) => {
    const {username, password} = req.body //Gives Access to the JSON

    try {
        // Check user look into the database with the email, then check if passwords match
        const getUser = db.prepare('SELECT * FROM users WHERE username = ?')
        const user = getUser.get(username)

        // Making sure that the user exists
        if (!user) {
            return res.status(404).send({message: "User not Found"})
        }
        // Checks if the password is the same using the bcrypt thing
        const passwordIsValid = bcrypt.compareSync(password, user.password)
        
        if (!passwordIsValid) {
            return res.status(401).send({message: "Invalid Password"})
        }

        // Successful Authentication

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' })
        res.json({ token })

    } catch (err) {
        console.log(err.message)
        res.sendStatus(503)
    }
    /*console.log(username,password)
    res.sendStatus(200)*/
})

export default router