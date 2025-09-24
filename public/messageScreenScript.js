const token = localStorage.getItem('token') || null

// Handling Socket Connection
const socket = io();

socket.on('connect', () => {
    console.log('Connected with ID:', socket.id);
});

function logout() {
    localStorage.setItem('token', null)
    console.log("logged out")
    window.location.href = '/'
}

function sendMessage(newMessageText) {
    fetch('/messages/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({
            'text': newMessageText
        })
    })
    .then(response => response.json())
    .then(data => {
        socket.emit('loadMessages', 'sentMessage')
        loadAllMessages()
    })
    .catch(error => {
        console.error('Error Sending Message:', error)
    })
}

function deleteMessage(messageId, messageDiv) {
    fetch(`/messages/${messageId}`, {
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
        // Turn the input element into a paragraph
        const newMessageElement = document.createElement('p')
        const messageContent = messageElement.value
        newMessageElement.textContent = messageContent
        newMessageElement.className = "messageElement"
        newMessageElement.id = `message-${messageId}`

        // Send the New Text to the server
        fetch(`/messages/${messageId}`, {
            method: 'PUT',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'text': messageContent
            })
        })
        .then(response => response.json())
        .then(data => {
            socket.emit('loadMessages', 'editedMessage')
            messageElement.replaceWith(newMessageElement)
        })
    }
}

document.getElementById('messageForm').addEventListener('submit', function(e) {
    e.preventDefault() // Prevents Page Reload
    const message = document.getElementById('newMessage').value.trim() //.trim() removes whitespace from beggining and end
    if (message) {
        sendMessage(message)
        document.getElementById('newMessage').value = ""
    }
})

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

function loadAllMessages() {
    let allMessages = ''
    fetch('/messages/all/', {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {
        const messageContainer = document.getElementById('messages')
        messageContainer.innerHTML = ''
        for (i=0; i < data.messages.length; i++){

            const newMessageDiv = document.createElement('div')

            const messageElement = document.createElement('p')
            const usernameElement = document.createElement('p')

            const editButton = document.createElement('button')
            const deleteButton = document.createElement('button')

            const messageId = data.messages[i].id

            usernameElement.textContent = data.messages[i].username + ":"
            usernameElement.className = "usernameElement"

            messageElement.textContent = data.messages[i].text
            messageElement.className = "messageElement"
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

            newMessageDiv.appendChild(usernameElement)
            if (data.requestUserId == data.messages[i].user_id) {
                newMessageDiv.appendChild(editButton)
                newMessageDiv.appendChild(deleteButton)
            }
            newMessageDiv.appendChild(messageElement)

            messageContainer.appendChild(newMessageDiv)
        }
    })
    .catch(error => {
        console.error('Error Fetching All Messages:', error)
    })
    
}

checkIfValidToken()
loadAllMessages()

// This will be run when a different client updated the chat with a new message/edit/delete
socket.on('loadMessages', (msg) => {
    loadAllMessages();
});
