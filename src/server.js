import express from 'express'

// Utility Functions From Node
import path, {dirname} from 'path'
import { fileURLToPath } from 'url'

// Socket.io imports
import { createServer } from "http";
import { Server } from "socket.io";

// Routes/Middleware
import authRoutes from './routes/authRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import authMiddleware from './middleware/authMiddleware.js'

// Setting up the port and express application
const app = express()
const port = process.env.PORT || 5004

// Setting up the postGres Database
import setupTables from './dbSetup.js';
await setupTables();

// Socket.io setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", //Allows all origins, can make it only allow certain
    },
});

// Get File Path, Use that to get the Directory Path
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Middleware
app.use(express.json()) // App now expects json, allows it to interpret json
app.use(express.urlencoded({ extended: true}))
app.use(express.static(path.join(__dirname, "../public"))) //All Files from the public directory aka the html/css files will be static

// When the user goes to the basic website link serves up index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "../public/loginScreen.html"))
})

app.get('/messageScreen/', (req, res) => {
    res.sendFile(path.join(__dirname, "../public/messageScreen.html"))
})

// Redirects the traffic over to these endpoints respectively. For messages goes through middleware then messageRoutes
app.use('/auth', authRoutes)
app.use('/messages', authMiddleware, messageRoutes)

// Sets up socket.io connection and events
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Listen for a custom event from the client
    socket.on('loadMessages', (msg) => {
        console.log('Received message:', msg);
        // Optionally broadcast to other clients
        socket.broadcast.emit('loadMessages', msg);
    });

    // Handle client disconnect event
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Sets the server up to start listening as setup is complete
httpServer.listen(port, ()=>{
    console.log(`Server has started on port: ${port}`)
})