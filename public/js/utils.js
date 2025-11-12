//import { decryptGlobalMessage } from "./globalChatScript.js";

const secretKey = `FireplaceSimpleEncryptionKey`

export function logout() {
    localStorage.setItem('token', null)
    console.log("logged out")
    window.location.href = '/'
}

export function openGlobalChat(){
    window.location.href = '/globalChat/'
}

export function openFriendChat(){
    window.location.href = '/friendChat/'
}

export function openAddFriends(){
    window.location.href = '/addFriends'
}

export function encryptGlobalMessage(message) {
    return CryptoJS.AES.encrypt(message, secretKey).toString()
}

export function decryptGlobalMessage(message) {
    return CryptoJS.AES.decrypt(message, secretKey).toString(CryptoJS.enc.Utf8)
}

export async function checkIfValidToken(token) {
    return fetch('/messages/token/', {
        method: 'GET',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status >= 200 && response.status < 300) {
            //console.log("Token is Valid")
            return ("Valid Token")
            
        } else {
            //console.log("Token Invalid")
            window.location.href = '/'
            return ("Invalid Token")
            
        }
    })
    .catch(error => {
        console.error('Error Validating Token:', error)
        window.location.href = '/'
        return ("Error Validating Token")
    })
}

function getRandomChar() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomIndex = Math.floor(Math.random() * chars.length);
    return chars.charAt(randomIndex);
}

export function createNewSymmetricKey(keyLength) {
    let key = ""
    for(let i = 0; i < keyLength; i++) {
        key += getRandomChar()
    }
    return key
}

export function scrollToBottom(messageContainer){
    messageContainer.scrollTop = messageContainer.scrollHeight
}

// Only for Global because of simpler decryption
export async function createSingleMessageElement(channel_id, message_id, token) {
    return fetch(`/messages/${message_id}/${channel_id}`, {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {

        //console.log("Successfully Retrieved Singular Message")

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

        messageElement.textContent = decryptGlobalMessage(data.messages.text)
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

        //messageContainer.appendChild(newMessageDiv)
    })
    .catch(error => {
        console.error('Error Fetching All Messages:', error)
        return null
    })
}