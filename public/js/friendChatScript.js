import { checkIfValidToken, createNewSymmetricKey, scrollToBottom, openGlobalChat, openAddFriends, logout } from "./utils.js";
import { changeProfanity } from "./badWordFilter.js";
// Assign to window to make available in HTML buttons
window.openAddFriends = openAddFriends
window.openGlobalChat = openGlobalChat
window.logout = logout
const token = localStorage.getItem('token') || null
const username = localStorage.getItem('username') || ""
const privateKey = localStorage.getItem(`${username}privateKey`) || null
let symmetricKey = null
const symmetricKeyLength = 12
const encryptor = new JSEncrypt()
const decryptor = new JSEncrypt()
decryptor.setPrivateKey(privateKey)
let publicKey
let activeChat = null

// Handling Socket Connection
const socket = io();

function switchActiveChat(channelId, friendName) {
    publicKey = localStorage.getItem(`${friendName}${channelId}publicKeyFriendChat`) || null
    if (!publicKey) {
        fetch(`/friends/publicKey/${friendName}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        })
        .then(response => response.json())
        .then(data => {
            localStorage.setItem(`${friendName}${channelId}publicKeyFriendChat`, data.publicKey)
            publicKey = data.publicKey
            activeChat = channelId
            let friendUsernameElement = document.getElementById("friendUsernameText")
            friendUsernameElement.textContent = `Chat With ${friendName}`
            encryptor.setPublicKey(publicKey)
            symmetricKey = createNewSymmetricKey(symmetricKeyLength)
            localStorage.setItem(`${channelId}${username}symmetricKey`, symmetricKey)
            loadAllMessages(true) // Loading Messages After Switching Active Chat
        })
        .catch(error => {
            console.error('Error Fetching Friends Public Key', error)
        })
    } else {
        activeChat = channelId
        let friendUsernameElement = document.getElementById("friendUsernameText")
        friendUsernameElement.textContent = `Chat With ${friendName}`
        encryptor.setPublicKey(publicKey)
        symmetricKey = localStorage.getItem(`${channelId}${username}symmetricKey`) || null
        loadAllMessages(true) // Loading Messages After Switching Active Chat
    }
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
    const cleanText = changeProfanity(newMessageText)
    const encryptedMessageText = CryptoJS.AES.encrypt(cleanText, symmetricKey).toString()
    const encryptedSymmetricKey = encryptor.encrypt(symmetricKey);
    //console.log("Encrypted Message: ", encryptedMessageText, "\nEncrypted Key: ", encryptedSymmetricKey)
    fetch('/messages/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({
            'text': encryptedMessageText,
            'channel_id': activeChat,
            'encryptedKey': encryptedSymmetricKey
        })
    })
    .then(response => response.json())
    .then(data => {
        socket.emit('friendChatNew', {id: data.id, channel_id: activeChat})
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

            // Handle Decryption
            if (data.requestUserId == data.messages[i].user_id) {
                // Our Own Message
                messageElement.textContent = CryptoJS.AES.decrypt(data.messages[i].text, symmetricKey).toString(CryptoJS.enc.Utf8)
            } else {
                // Their Message
                const decryptedSymmetricKey = decryptor.decrypt(data.messages[i].encrypted_symmetric_key);
                messageElement.textContent = CryptoJS.AES.decrypt(data.messages[i].text, decryptedSymmetricKey).toString(CryptoJS.enc.Utf8)
            }

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

// Used when a new message is sent or edited to create the div as needed
async function createSingleMessageElementFriend(channel_id, message_id) {
    return fetch(`/messages/${message_id}/${channel_id}`, {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {

        const newMessageDiv = document.createElement('div')
        newMessageDiv.className = "messageDivBorder"
        newMessageDiv.id = `message-Div${message_id}`

        const messageId = data.messages.id

        const profilePictureElement = document.createElement('img')

        const messageElement = document.createElement('p')
        const usernameElement = document.createElement('p')

        const editButton = document.createElement('button')
        const deleteButton = document.createElement('button')

        const editedElement = document.createElement('p')
        const timeStampElement = document.createElement('p')

        profilePictureElement.src = "/images/basicUserImage.png"
        profilePictureElement.id = "profilePicture"

        usernameElement.textContent = data.messages.username + ":"
        usernameElement.className = "usernameElement"

        // Handle Decryption
        if (data.requestUserId == data.messages.user_id) {
            // Our Own Message
            messageElement.textContent = CryptoJS.AES.decrypt(data.messages.text, symmetricKey).toString(CryptoJS.enc.Utf8)
        } else {
            // Their Message
            const decryptedSymmetricKey = decryptor.decrypt(data.messages.encrypted_symmetric_key);
            messageElement.textContent = CryptoJS.AES.decrypt(data.messages.text, decryptedSymmetricKey).toString(CryptoJS.enc.Utf8)
        }

        messageElement.className = "messageElement"

        timeStampElement.textContent = moment.utc(data.messages.timestamp).local().format('MM/DD/YY, h:mm a')
        timeStampElement.className = "editedElement"
            
        // Each Message Element has a unique message id which I will use with the document.getElementById
        messageElement.id = `message-${message_id}`

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

        if (data.messages.edited) {
            editedElement.textContent = "(Edited)"
            editedElement.className = "editedElement"
            newMessageDiv.appendChild(editedElement)
        }

        if (data.requestUserId == data.messages.user_id) {
            newMessageDiv.appendChild(editButton)
            newMessageDiv.appendChild(deleteButton)
        }

        newMessageDiv.appendChild(messageElement)

        return newMessageDiv
    })
    .catch(error => {
        console.error('Error Fetching All Messages:', error)
        return null
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
        socket.emit('friendChatDelete', {id: data.id, channel_id: activeChat})
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
        const encryptedMessageContent = CryptoJS.AES.encrypt(cleanText, symmetricKey).toString()
        // Send the New Text to the server
        fetch(`/messages/${messageId}`, {
            method: 'PUT',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'text': encryptedMessageContent,
                'channel_id': activeChat,
            })
        })
        .then(response => response.json())
        .then(data => {
            socket.emit('friendChatEdit', {id: data.id, channel_id: activeChat})
        }).catch(error =>{
            console.log('Error Editing Message', error)
        })
        
    }
}

socket.on(`friendChatNew`, async (data) => {
    // Add an element to the end
    if (activeChat != data.channel_id) {
        return
    }
    console.log(`${username} Received New Message | Socket Event`)
    const messageContainer = document.getElementById('messages')
    const newMessageDiv = await createSingleMessageElementFriend(activeChat, data.id)
    if ( (messageContainer.scrollTop+messageContainer.clientHeight - messageContainer.scrollHeight) <= 1) {
        messageContainer.appendChild(newMessageDiv)
        scrollToBottom(messageContainer) // If Already at the bottom auto scroll for them
    } else {
        messageContainer.appendChild(newMessageDiv)
    }
});

// Run When Someone Including Self Edited a Message
socket.on(`friendChatEdit`, async (data) => {
    // Edit Existing Element
    if (activeChat != data.channel_id) {
        return
    }
    console.log(`${username} Received Edit Message | Socket Event`)
    const oldMessageDiv = document.getElementById(`message-Div${data.id}`)
    const editedMessageDiv = await createSingleMessageElementFriend(activeChat, data.id)
    oldMessageDiv.replaceWith(editedMessageDiv)
});

// Run When Someone Including Self Deleted a Message
socket.on(`friendChatDelete`, (data) => {
    // Remove Existing Element
    if (activeChat != data.channel_id) {
        return
    }
    console.log(`${username} Received Delete Message | Socket Event`)
    const messageDiv = document.getElementById(`message-Div${data.id}`)
    messageDiv.remove()
});

checkIfValidToken(token)
document.getElementById("usernameTopRightElement").textContent = username
loadActiveFriends()

window.sendMessage = sendMessage
window.editMessage = editMessage
window.deleteMessage = deleteMessage