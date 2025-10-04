const token = localStorage.getItem('token') || null
const username = localStorage.getItem('username') || ""
// Super Secret Key, only so plain text isn't stored in the database
// Global Messages anyways, so should be seen as unsafe
const secretKey = `FireplaceSimpleEncryptionKey`

// Handling Socket Connection
const socket = io();

socket.on('connect', () => {
    console.log('Connected with ID:', socket.id);
});

function sendMessage(newMessageText) {
    const cleanText = checkProfanity(newMessageText)
    const encryptedMessageText = CryptoJS.AES.encrypt(cleanText, secretKey).toString()
    fetch('/messages/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({
            'text': encryptedMessageText,
            'channel_id': 1
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

function deleteMessage(messageId, messageDiv) {
    fetch(`/messages/${messageId}/1`, {
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
        const cleanText = checkProfanity(messageContent)
        const encryptedMessageContent = CryptoJS.AES.encrypt(cleanText, secretKey).toString()
        // Send the New Text to the server
        fetch(`/messages/${messageId}`, {
            method: 'PUT',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'text': encryptedMessageContent,
                'channel_id': 1
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

document.getElementById('messageForm').addEventListener('submit', function(e) {
    e.preventDefault() // Prevents Page Reload
    const message = document.getElementById('newMessage').value.trim() //.trim() removes whitespace from beggining and end
    if (message) {
        sendMessage(message)
        document.getElementById('newMessage').value = ""
    }
})

function loadAllMessages(scrollBottom) {
    fetch('/messages/all/1', {
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

            messageElement.textContent = CryptoJS.AES.decrypt(data.messages[i].text, secretKey).toString(CryptoJS.enc.Utf8) // Decrypting
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

checkIfValidToken()
loadAllMessages(true)

document.getElementById("usernameTopRightElement").textContent = username

// This will be run when a different client updated the chat with a new message/edit/delete
socket.on('loadMessages', (msg) => {
    const messageContainer = document.getElementById('messages')
    if ( (messageContainer.scrollTop+messageContainer.clientHeight - messageContainer.scrollHeight) <= 1) {
        loadAllMessages(true); // If Already at the bottom auto scroll for them
    } else {
        loadAllMessages(false); // If browsing other messages don't auto scroll
    }
});