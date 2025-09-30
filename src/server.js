import express from 'express' // express.js
import path, {dirname} from 'path' // Utility function
import { fileURLToPath } from 'url' // Utility function
import { createServer } from "http"; // http servers for socket.io
import { Server } from "socket.io"; // socket.io
import authRoutes from './routes/authRoutes.js' // Routes
import messageRoutes from './routes/messageRoutes.js' // Routes
import friendRoutes from './routes/friendRoutes.js' // Routes
import authMiddleware from './middleware/authMiddleware.js' // Middleware
import setupTables from './dbSetup.js'; // Setting function for postGres Database

// Setting up the http server to listen for express and socket.io
const app = express()
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", //Allows all origins, can make it only allow certain
    },
});

await setupTables(); // Setup the postGres Database

const __filename = fileURLToPath(import.meta.url) // Grab file path
const __dirname = dirname(__filename) // Grab directory path

app.use(express.json()) // App now expects json, allows it to interpret json
app.use(express.urlencoded({ extended: true})) // Allows us to access the values from the request (think req.body)
app.use(express.static(path.join(__dirname, "../public"))) // All Files from public aka the html/css files will be static and served automatically

// When the user goes to the basic website link serves up index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "../public/html/loginScreen.html"))
})

// When the user sends get req to globalChat site serve up the messageScreen.html
app.get('/globalChat/', (req, res) => {
    res.sendFile(path.join(__dirname, "../public/html/globalChat.html"))
})

app.get('/friendChat/', (req, res) => {
    res.sendFile(path.join(__dirname, "../public/html/friendChat.html"))
})

app.get('/addFriends/', (req, res) => {
    res.sendFile(path.join(__dirname, "../public/html/addFriends.html"))
})

app.use('/auth', authRoutes) // When /auth is accessed use the authRoutes.js functions
app.use('/messages', authMiddleware, messageRoutes) // When /messages is accessed go through authMiddleware.js then messageRoutes
app.use('/friends', authMiddleware, friendRoutes) // when /friends is accessed go through authMiddleware.js then friendRoutes

// Sets up socket.io connection and events
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    socket.on('loadMessages', (msg) => { // socket.io event for telling users that a chat update has happened and to update chat
        //console.log('Received message:', msg);
        socket.broadcast.emit('loadMessages', msg); // Broadcast to all other online users to reload chat
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Sets the server up to start listening as setup is complete
httpServer.listen(process.env.PORT, ()=>{
    console.log(`Server has started on port: ${process.env.PORT}`)
})