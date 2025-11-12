import { encryptGlobalMessage, decryptGlobalMessage, checkIfValidToken, createSingleMessageElement, scrollToBottom, openFriendChat, openAddFriends, logout } from "./utils.js";
import { changeProfanity } from "./badWordFilter.js";

// Super Secret Key, only so plain text isn't stored in the database
// Global Messages anyways, so should be seen as unsafe

const token = localStorage.getItem('token') || null
const username = localStorage.getItem('username') || ""

// Handling Socket Connection
const socket = io();

socket.on('connect', () => {
    console.log('Connected with ID:', socket.id);
});

function sendMessage(newMessageText) {
    const cleanText = changeProfanity(newMessageText)
    const encryptedMessageText = encryptGlobalMessage(cleanText)
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
        socket.emit('globalChatNew', {id: data.id})
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
        socket.emit('globalChatDelete', { id: data.id })
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
        const cleanText = changeProfanity(messageContent)
        const encryptedMessageContent = encryptGlobalMessage(cleanText)
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
            socket.emit('globalChatEdit', { id: data.id })
        }).catch(error =>{
            console.log('Error Editing Message', error)
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
            newMessageDiv.id = `message-Div${data.messages[i].id}`

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

            messageElement.textContent = decryptGlobalMessage(data.messages[i].text)
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

checkIfValidToken(token)
loadAllMessages(true)

window.sendMessage = sendMessage
window.editMessage = editMessage
window.deleteMessage = deleteMessage

document.getElementById("usernameTopRightElement").textContent = username

// Assign to window to make available in HTML buttons
window.openFriendChat = openFriendChat;
window.openAddFriends = openAddFriends;
window.logout = logout;

// Run When Someone Including Self Sent a New Message
socket.on('globalChatNew', async (data) => {
    // Add an element to the end
    console.log(`${username} Received New Message | Socket Event`)
    const messageContainer = document.getElementById('messages')
    const newMessageDiv = await createSingleMessageElement(1, data.id, token)
    if ( (messageContainer.scrollTop+messageContainer.clientHeight - messageContainer.scrollHeight) <= 1) {
        messageContainer.appendChild(newMessageDiv)
        scrollToBottom(messageContainer) // If Already at the bottom auto scroll for them
    } else {
        messageContainer.appendChild(newMessageDiv)
    }
});

// Run When Someone Including Self Edited a Message
socket.on('globalChatEdit', async (data) => {
    // Edit Existing Element
    console.log(`${username} Received Edit Message | Socket Event`)
    const oldMessageDiv = document.getElementById(`message-Div${data.id}`)
    const editedMessageDiv = await createSingleMessageElement(1, data.id, token)
    oldMessageDiv.replaceWith(editedMessageDiv)
});

// Run When Someone Including Self Deleted a Message
socket.on('globalChatDelete', (data) => {
    // Remove Existing Element
    console.log(`${username} Received Delete Message | Socket Event`)
    const messageDiv = document.getElementById(`message-Div${data.id}`)
    messageDiv.remove()
});