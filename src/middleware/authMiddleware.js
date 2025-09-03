// All the javascript for the middleware, intercepts the todo requests and makes sure the token is valid for those todo's
import jwt from 'jsonwebtoken'

function authMiddleware (req, res, next) {
    const token = req.headers['authorization']

    if (!token) {
        //return res.stats(401).json({message: "No Token Provided"})
        return res.status(401).json({message: "No Token Provided"})
    }

    console.log(token)

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            //return res.stats(401).json({message: "Invalid/Expired Token"})
            return res.status(401).json({message: "Invalid/Expired Token"})
        }
        // This is the id we found from the user. When encoding the token we put in the userId inside of the id so that's why decoded.id gives us the userID
        req.userId = decoded.id
        // We're good to head to the actual endpoint in the message Routes
        next()
    })
}

export default authMiddleware