const token = localStorage.getItem('token') || null
const username = localStorage.getItem('username') || ""

function logout() {
    localStorage.setItem('token', null)
    console.log("logged out")
    window.location.href = '/'
}

function openGlobalChat(){
    window.location.href = '/globalChat/'
}

function openAddFriends(){
    window.location.href = '/addFriends'
}

function checkIfValidToken() {
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
            
        } else {
            console.log("Token Invalid")
            window.location.href = '/'
        }
    })
    .catch(error => {
        console.error('Error Validating Token:', error)
        window.location.href = '/'
    })
}

function sendFriendRequest(friendName) {
    fetch('/friends/createRequest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({
            'friendName': friendName
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success')
    })
    .catch(error => {
        console.error('Error Sending Message:', error)
    })
}

document.getElementById('addFriendForm').addEventListener('submit', function(e) {
    e.preventDefault() // Prevents Page Reload
    const friendName = document.getElementById('newAddFriend').value.trim() //.trim() removes whitespace from beggining and end
    if (friendName) {
        sendFriendRequest(friendName)
        document.getElementById('newAddFriend').value = ""
    }
})

checkIfValidToken()
document.getElementById("usernameTopRightElement").textContent = username