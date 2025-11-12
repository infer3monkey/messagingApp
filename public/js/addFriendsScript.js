import { checkIfValidToken, openGlobalChat, openFriendChat, logout } from "./utils.js"

const token = localStorage.getItem('token') || null
const username = localStorage.getItem('username') || ""

function loadPendingFriendRequests() {
    fetch('/friends/pending/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {
        const pendingFriendsListContainer = document.getElementById('pendingFriendsList')
        const header = document.createElement('h2')
        header.textContent = "Pending Friends List"
        pendingFriendsListContainer.innerHTML = ''
        pendingFriendsListContainer.appendChild(header)
        for (let i=0;i<data.length;i++){
            const newPendingFriendDiv = document.createElement('div')
            newPendingFriendDiv.className = "pendingFriendDiv"
            const friendNameElement = document.createElement('p')
            const acceptButton = document.createElement('button')
            const declineButton = document.createElement('button')

            friendNameElement.textContent = data[i].username
            acceptButton.textContent = 'Accept'
            declineButton.textContent = "Decline"

            acceptButton.onclick = function() {
                acceptFriendRequest(data[i].username)
            }

            declineButton.onclick = function() {
                deleteFriendRequest(data[i].username)
            }

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

function loadActiveFriends() {
    fetch('/friends/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {
        const friendsListContainer = document.getElementById('friendsList')
        const header = document.createElement('h2')
        header.textContent = "Friends List"
        friendsListContainer.innerHTML = ''
        friendsListContainer.appendChild(header)
        for (let i=0;i<data.length;i++){
            const newFriendDiv = document.createElement('div')
            newFriendDiv.className = "pendingFriendDiv"
            const friendNameElement = document.createElement('p')
            const removeButton = document.createElement('button')

            friendNameElement.textContent = data[i].username
            removeButton.textContent = 'Remove'

            removeButton.onclick = function() {
                deleteFriendRequest(data[i].username)
            }

            newFriendDiv.appendChild(friendNameElement)
            newFriendDiv.appendChild(removeButton)

            friendsListContainer.appendChild(newFriendDiv)
        }
    })
    .catch(error => {
        console.error('Error Fetching Pending Friend Requests', error)
    })
}

function acceptFriendRequest(friendName) {
    fetch('/friends/', {
        method: 'PUT',
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
        //alert(`Accepted ${friendName}'s Friend Request`)
        loadActiveFriends()
        loadPendingFriendRequests()
    })
    .catch(error => {
        console.error('Error Accepting Friend Request', error)
    })
}

function deleteFriendRequest(friendName) {
    fetch('/friends/', {
        method: 'DELETE',
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
        //alert(`Deleted Friend ${friendName}`)
        loadActiveFriends()
        loadPendingFriendRequests()
    })
    .catch(error => {
        console.error('Error Deleting Friend', error)
    })
}

function sendFriendRequest(friendName) {
    fetch('/friends/', {
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

checkIfValidToken(token)
document.getElementById("usernameTopRightElement").textContent = username
loadPendingFriendRequests()
loadActiveFriends()

// Assign to window to make available in HTML buttons
window.loadPendingFriendRequests = loadPendingFriendRequests
window.loadActiveFriends = loadActiveFriends

window.openFriendChat = openFriendChat
window.openGlobalChat = openGlobalChat
window.logout = logout