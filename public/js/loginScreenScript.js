const token = localStorage.getItem('token') || null
let username = localStorage.getItem('username') || ""
// Create the keys when loading the site to save time
const crypt = new JSEncrypt();
const publicKey = crypt.getPublicKey()
const privateKey = crypt.getPrivateKey()

// Check if the user already has a valid token, if they do then log them in and give them the message screen
function checkIfValidTokenLoginScreen(token) {
    fetch('/messages/verifyToken/', {
        method: 'GET',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status >= 200 && response.status < 300) {
            console.log("Token is Valid")
            window.location.href = '/globalChat/'
        } else {
            console.log("Token Invalid")
        }
    })
    .catch(error => {
        console.error('Error Validating Token:', error)
    })
}

function loginUser() {
    fetch('/auth/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'username': document.getElementById('username').value,
            'password': document.getElementById('password').value
        })
    })
    .then(response => response.json())
    .then(async data => {
        localStorage.setItem('token', data.token)
        localStorage.setItem('username', document.getElementById('username').value)
        window.location.href = '/globalChat/'
    })
    .catch(error => {
        console.error('Error Logging in User:', error)
    })
}

function registerUser() {
    // Check if username contains profanity before sending to server
    const badUsername = containsProfanity(document.getElementById('username').value)
    if (badUsername) {
        alert('Username Contains Profanity, Choose a New Username')
        return
    }

    // Setting Up Asymmetric Keys if Needed for User
    fetch('/auth/register/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'  
        },
        body: JSON.stringify({
            'username': document.getElementById('username').value,
            'password': document.getElementById('password').value,
            'publicKey': publicKey
        })
    })
    .then(response => response.json())
    .then(data => {
        localStorage.setItem('token', data.token)
        // data is the token so save it into local storage, and log into the proper website
        username = document.getElementById('username').value
        localStorage.setItem(`${username}publicKey`, publicKey)
        localStorage.setItem(`${username}privateKey`, privateKey)
        localStorage.setItem('username', username)
        window.location.href = '/globalChat/' //This sends a new get request at that endpoint, no fetch needed
    })
    .catch(error => {
        console.error('Error Registering User:', error)
    })
}

checkIfValidTokenLoginScreen(token)
// Assign to window to make available in HTML buttons
window.registerUser = registerUser
window.loginUser = loginUser;