// Importing Functions for Testing, Using Jest for Testing
import { containsProfanity, changeProfanity } from '../public/js/badWordFilter.js';
import {checkIfValidToken, createNewSymmetricKey} from '../public/js/utils.js'
import { jest, test, expect } from '@jest/globals';

global.fetch = jest.fn();

// Tests for checkIfValidToken
describe('checkIfValidToken', () => {

    test('Validity of Valid Token', async () => {
        fetch.mockResolvedValueOnce({ status: 200 }); // Simulating Invalid Response From Server
        // Allowing function to change window location without errors
        Object.defineProperty(global, 'window', {
            value: { location: { href: '' } },
            writable: true,
        });
        // Passing in a valid Token to the function, will fail if database is reset
        const result = await checkIfValidToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYwNTYxODE4LCJleHAiOjE3NjA2NDgyMTh9.TyglCpVwytPrmNGHvI9oOQoVdqMOLDPwi9JN4GugY2A');
        expect(result).toBe('Valid Token');
    })

    test('Validity of Invalid Token', async () => {
        fetch.mockResolvedValueOnce({ status: 401 }); // Simulating Invalid Response From Server
        // Allowing function to change window location without errors
        Object.defineProperty(global, 'window', {
            value: { location: { href: '' } },
            writable: true,
        });
        const result = await checkIfValidToken('token123'); // Passing in an invalid Token to the function
        expect(result).toBe('Invalid Token');
    })

    test('Server Error Returning Error Validating Token', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error')); // Simulating Server Failure, notice rejected instead of resolved
        // Allowing function to change window location without errors
        Object.defineProperty(global, 'window', {
            value: { location: { href: '' } },
            writable: true,
        });
        const result = await checkIfValidToken(''); // Token Passed In Does not Matter
        expect(result).toBe('Error Validating Token');
    })
})

// Tests for Custom Profanity Filter
describe('changeProfanity', () =>{
    // Testing changeProfanity Function which replaces any profanity found with *** 
    test('Changing Bad String 1', () => {
        const result = changeProfanity('assholeCheckbitch')
        expect(result).toBe('***Check***')
    })
    test('Changing Bad String 2', () => {
        const result = changeProfanity('cock_Burger')
        expect(result).toBe('***_Burger')
    })
    test('Changing Bad String 3', () => {
        const result = changeProfanity('fuckshit')
        expect(result).toBe('******')
    })
    test('Changing Bad String 4', () => {
        const result = changeProfanity('there are no shit words here')
        expect(result).toBe('there are no *** words here')
    })
    test('Changing Bad String 5', () => {
        const result = changeProfanity('I need to take a piss')
        expect(result).toBe('I need to take a ***')
    })
    test('Changing Bad String 6', () => {
        const result = changeProfanity('bastard')
        expect(result).toBe('***')
    })

    test('Unchanged Good Message 1', () => {
        const result = changeProfanity('perfectlyFineMessage')
        expect(result).toBe('perfectlyFineMessage')
    })
    test('Unchanged Good Message 2', () => {
        const result = changeProfanity('PerFecTly_FiNe_MesSaGe')
        expect(result).toBe('PerFecTly_FiNe_MesSaGe')
    })
    test('Unchanged Good Message 3', () => {
        const result = changeProfanity('I am not saying any atrocities')
        expect(result).toBe('I am not saying any atrocities')
    })

    test('Empty String', () => {
        const result = changeProfanity('')
        expect(result).toBe('')
    })
}) 

describe('containsProfanity', () => {
     // Testing containsProfanity Function which if it finds any profanity it returns true, otherwise false
     test('Bad String 1', () => {
        const result = containsProfanity('assholeCheckbitch')
        expect(result).toBe(true)
    })
    test('Bad String 2', () => {
        const result = containsProfanity('cock_Burger')
        expect(result).toBe(true)
    })
    test('Bad String 3', () => {
        const result = containsProfanity('fuckshit')
        expect(result).toBe(true)
    })
    test('Bad String 4', () => {
        const result = containsProfanity('there are no shit words here')
        expect(result).toBe(true)
    })
    test('Bad String 5', () => {
        const result = containsProfanity('I need to take a piss')
        expect(result).toBe(true)
    })
    test('Bad String 6', () => {
        const result = containsProfanity('bastard')
        expect(result).toBe(true)
    })

    test('Good Message 1', () => {
        const result = containsProfanity('perfectlyFineMessage')
        expect(result).toBe(false)
    })
    test('Good Message 2', () => {
        const result = containsProfanity('PerFecTly_FiNe_MesSaGe')
        expect(result).toBe(false)
    })
    test('Good Message 3', () => {
        const result = containsProfanity('I am not saying any atrocities')
        expect(result).toBe(false)
    })

    test('Empty String', () => {
        const result = containsProfanity('')
        expect(result).toBe(false)
    })
})

describe('symmetricKeyCreation', () => {
    // Create a Hashmap, Start Creating Symmetric Keys of the same size (has to be big enough to beat probability of two keys being the same)
    // Make sure key doesn't exist already, keep adding keys to the hashmap and checking until confident algorithm works
    test('createNewSymmetricKey Hashmap Test', () => {
        hashmap = {}
        keyLength = 12 // Probability is (1/26)^keyLength, 12 should be more than enough to make it highly unlikely for identical keys
        sampleSize = 250 // Creating 250 keys for the test
        for(let i = 0; i < sampleSize; i++) {
            let tempKey = createNewSymmetricKey(keyLength)
            if(tempKey in hashmap) {
                // Identical Keys, Could be a coincidence but likely means algorithm is not as random as it should be
                throw new Error('Duplicate Key Found')
            }
            hashmap[tempKey] = ""
        }
    })
})

// Tests for Creating a Random Symmetric Key

// Tests for Global Chat Encryption/Decryption