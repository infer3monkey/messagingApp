// Importing Functions for Testing
import {checkIfValidToken} from '../public/js/utils.js'
// Allowing Jest to Simulate Proper Fetches Through Node
import { jest, test, expect } from '@jest/globals';
//import fetch from 'node-fetch'
global.fetch = jest.fn();

// Tests for checkIfValidToken
describe('checkIfValidToken', () => {

    test('Validity of Valid Token', async () => {
        fetch.mockResolvedValueOnce({ status: 200 }); // Simulating Invalid Response From Server
        // Allowing function to change window location without errors
        Object.defineProperty(global, 'window', {
            value: {
            location: {
                href: '',
            },
            },
            writable: true,
        });
        // Passing in a valid Token to the function, will fail if database is reset
        const result = await checkIfValidToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYwNTUyMjc2LCJleHAiOjE3NjA2Mzg2NzZ9.JP8lZWokjJEqMwXCnM8DNCyQxpbRePxfJjNcQHiGs30');
        expect(result).toBe('Valid Token');
    })

    test('Validity of Invalid Token', async () => {
        fetch.mockResolvedValueOnce({ status: 401 }); // Simulating Invalid Response From Server
        // Allowing function to change window location without errors
        Object.defineProperty(global, 'window', {
            value: {
            location: {
                href: '',
            },
            },
            writable: true,
        });
        const result = await checkIfValidToken('token123'); // Passing in an invalid Token to the function
        expect(result).toBe('Invalid Token');
    })


})

