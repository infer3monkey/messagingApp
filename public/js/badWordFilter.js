const badWords = [
    "asshole",
    "bastard",
    "bitch",
    "bollocks",
    "cock",
    "coonass",
    "cunt",
    "dick",
    "dyke",
    "faggot",
    "fuck",
    "motherfucker",
    "nigger",
    "nigga",
    "piss",
    "prick",
    "pussy",
    "shit",
    "slut",
    "twat",
    "wanker",
    "whore"
  ]

function checkProfanity(text) {
    const regex = new RegExp('\\b(' + badWords.join('|') + ')\\b', 'gi');
    return text.replace(regex, '***');
}
  
  