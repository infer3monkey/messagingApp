// List of Bad Words not Allowed on this Messaging App
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

// Function that checks for profanity using the premade list. Replaces any profanity found with ***
export function changeProfanity(text) {
    //const regex = new RegExp('\\b(' + badWords.join('|') + ')\\b', 'gi'); Old Filter, Did not catch non spaced profanity
    const regex = new RegExp('(' + badWords.join('|') + ')', 'gi');
    return text.replace(regex, '***');
}

// Function that checks if profanity exists in a string. Used for username checking primarily
export function containsProfanity(text) {
    //const regex = new RegExp('\\b(' + badWords.join('|') + ')\\b', 'gi'); Old Filter, Did not catch non spaced profanity
    const regex = new RegExp('(' + badWords.join('|') + ')', 'gi');
    return regex.test(text);
}