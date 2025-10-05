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

function getRandomChar() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomIndex = Math.floor(Math.random() * chars.length);
    return chars.charAt(randomIndex);
}

function createNewSymmetricKey(keyLength) {
    let key = ""
    for(let i = 0; i < keyLength; i++) {
        key += getRandomChar()
    }
    return key
}

function scrollToBottom(messageContainer){
    messageContainer.scrollTop = messageContainer.scrollHeight
}

// Only for Global because of simpler decryption
async function createSingleMessageElement(channel_id, message_id) {
    return fetch(`/messages/${message_id}/${channel_id}`, {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {

        console.log("Successfully Retrieved Singular Message")

        const newMessageDiv = document.createElement('div')
        newMessageDiv.className = "messageDivBorder"
        newMessageDiv.id = `messageDiv-${message_id}`

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

        messageElement.textContent = CryptoJS.AES.decrypt(data.messages.text, secretKey).toString(CryptoJS.enc.Utf8) // Decrypting
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