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

function openFriendChat(){
    window.location.href = '/friendChat/'
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

function loadPendingFriendRequests() {
    fetch('/friends/getPending/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {
        const pendingFriendsListContainer = document.getElementById('pendingFriendsList')
        for (i=0;i<data.length;i++){
            const newPendingFriendDiv = document.createElement('div')
            newPendingFriendDiv.className = "pendingFriendDiv"
            const friendNameElement = document.createElement('p')
            const acceptButton = document.createElement('button')
            const declineButton = document.createElement('button')

            friendNameElement.textContent = data[i].username
            acceptButton.textContent = 'Accept'
            declineButton.textContent = "Decline"

            newPendingFriendDiv.appendChild(friendNameElement)
            newPendingFriendDiv.appendChild(acceptButton)
            newPendingFriendDiv.appendChild(declineButton)

            pendingFriendsListContainer.appendChild(newPendingFriendDiv)

        }
    })
    .catch(error => {
        console.error('Error Fetching Pending Friend Requests', error)
    })
}

function sendFriendRequest(friendName) {
    fetch('/friends/createRequest/', {
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
        alert(`Sent a Friend Request to ${friendName}`)
    })
    .catch(error => {
        alert('Error Sending Friend Request')
        console.error('Error Sending Friend Request', error)
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
loadPendingFriendRequests()