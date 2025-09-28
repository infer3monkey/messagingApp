const token = localStorage.getItem('token') || null
const username = localStorage.getItem('username') || ""
let activeChat = null

// Handling Socket Connection
const socket = io();

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

function switchActiveChat(channelId, friendName) {
    activeChat = channelId
    let friendUsernameElement = document.getElementById("friendUsernameText")
    friendUsernameElement.textContent = `Chat With ${friendName}`
    // Logic


    loadAllMessages(true) // Loading Messages After Switching Active Chat
}

function loadActiveFriends() {
    fetch('/friends/getFriends/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {
        const friendsListContainer = document.getElementById('friendChatsSelectorDiv')
        friendsListContainer.innerHTML = ''
        for (let i=0;i<data.length;i++){
            const tempFriendButton = document.createElement('button')
            tempFriendButton.className = "friendChatSelectorButton"
            tempFriendButton.textContent = data[i].username

            tempFriendButton.onclick = function() {
                switchActiveChat(data[i].channel_id, data[i].username)
            }

            friendsListContainer.appendChild(tempFriendButton)

            if (!activeChat) {
                // When First Loading, Switch Active Chat to This
                switchActiveChat(data[i].channel_id, data[i].username)
            }
        }
    })
    .catch(error => {
        console.error('Error Fetching Pending Friend Requests', error)
    })
}

function sendMessage(newMessageText) {
    fetch('/messages/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({
            'text': newMessageText,
            'channel_id': activeChat
        })
    })
    .then(response => response.json())
    .then(data => {
        socket.emit('loadMessages', 'sentMessage')
        loadAllMessages(true)
    })
    .catch(error => {
        console.error('Error Sending Message:', error)
    })
}

document.getElementById('messageForm').addEventListener('submit', function(e) {
    e.preventDefault() // Prevents Page Reload
    const message = document.getElementById('newMessage').value.trim() //.trim() removes whitespace from beggining and end
    if (message) {
        sendMessage(message)
        document.getElementById('newMessage').value = ""
    }
})

function loadAllMessages(scrollBottom) {
    if (!activeChat) {
        return;
    }

    fetch(`/messages/all/${activeChat}`, {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {
        const messageContainer = document.getElementById('messages')
        messageContainer.innerHTML = ''
        for (let i=0; i < data.messages.length; i++){

            const newMessageDiv = document.createElement('div')
            newMessageDiv.className = "messageDivBorder"

            const profilePictureElement = document.createElement('img')

            const messageElement = document.createElement('p')
            const usernameElement = document.createElement('p')

            const editButton = document.createElement('button')
            const deleteButton = document.createElement('button')

            const editedElement = document.createElement('p')
            const timeStampElement = document.createElement('p')

            const messageId = data.messages[i].id

            profilePictureElement.src = "/images/basicUserImage.png"
            profilePictureElement.id = "profilePicture"

            usernameElement.textContent = data.messages[i].username + ":"
            usernameElement.className = "usernameElement"

            messageElement.textContent = data.messages[i].text
            messageElement.className = "messageElement"

            timeStampElement.textContent = moment.utc(data.messages[i].timestamp).local().format('MM/DD/YY, h:mm a')
            timeStampElement.className = "editedElement"
            
            // Each Message Element has a unique message id which I will use with the document.getElementById
            messageElement.id = `message-${messageId}`

            editButton.onclick = function() {
                editMessage(messageId, newMessageDiv)
            }

            deleteButton.onclick = function() {
                deleteMessage(messageId, newMessageDiv)
            }

            editButton.className = "buttonElement"
            editButton.textContent = "Edit"
            deleteButton.className = "buttonElement"
            deleteButton.textContent = "Delete"

            newMessageDiv.appendChild(profilePictureElement)
            newMessageDiv.appendChild(usernameElement)

            newMessageDiv.appendChild(timeStampElement)

            if (data.messages[i].edited) {
                editedElement.textContent = "(Edited)"
                editedElement.className = "editedElement"
                newMessageDiv.appendChild(editedElement)
            }

            if (data.requestUserId == data.messages[i].user_id) {
                newMessageDiv.appendChild(editButton)
                newMessageDiv.appendChild(deleteButton)
            }

            newMessageDiv.appendChild(messageElement)

            messageContainer.appendChild(newMessageDiv)

            if (scrollBottom) {
                // Automatically scroll to bottom on first load
                scrollToBottom(messageContainer)
            }
        }
    })
    .catch(error => {
        console.error('Error Fetching All Messages:', error)
    })
}

function deleteMessage(messageId, messageDiv) {
    fetch(`/messages/${messageId}/${activeChat}`, {
        method: 'DELETE',
        headers: {
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {
        // Maybe check if it was successful?
        socket.emit('loadMessages', 'deletedMessage')
        messageDiv.remove()
    })
}

function editMessage(messageId, messageDiv) {
    // Check if the Message is currently being edited or if the edit is being submitted
    let messageElement = document.getElementById(`message-${messageId}`)
    if(messageElement.tagName === "P") {
        // Turn the Element into an input
        const newMessageElement = document.createElement('input')
        const messageContent = messageElement.textContent
        newMessageElement.value = messageContent
        newMessageElement.className = "messageElement"
        newMessageElement.id = `message-${messageId}`
        messageElement.replaceWith(newMessageElement)
    } else if (messageElement.tagName === "INPUT") {
        // Edit the Message and reload messages for all users
        const messageContent = messageElement.value

        // Send the New Text to the server
        fetch(`/messages/${messageId}`, {
            method: 'PUT',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'text': messageContent,
                'channel_id': activeChat
            })
        })
        .then(response => response.json())
        .then(data => {
            socket.emit('loadMessages', 'editedMessage') // Tell other clients to reload
            loadAllMessages(false) // Reload for yourself
        }).catch(error =>{
            console.log('Error Editing Message', error)
            loadAllMessages(false)
        })
        
    }
}

function scrollToBottom(messageContainer){
    messageContainer.scrollTop = messageContainer.scrollHeight
}

// This will be run when a different client updated the chat with a new message/edit/delete
socket.on('loadMessages', (msg) => {
    const messageContainer = document.getElementById('messages')
    if ( (messageContainer.scrollTop+messageContainer.clientHeight - messageContainer.scrollHeight) <= 1) {
        loadAllMessages(true); // If Already at the bottom auto scroll for them
    } else {
        loadAllMessages(false); // If browsing other messages don't auto scroll
    }
});

checkIfValidToken()
document.getElementById("usernameTopRightElement").textContent = username
loadActiveFriends()