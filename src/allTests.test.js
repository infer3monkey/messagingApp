// Importing Functions for Testing
import {checkIfValidToken} from '../public/js/utils.js'
// Allowing Jest to Simulate Proper Fetches Through Node
import { jest, test, expect } from '@jest/globals';
//import fetch from 'node-fetch'
global.fetch = jest.fn();

// Actual Tests
test('Validity of invalid token', async () => {
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