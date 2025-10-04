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