// Importing Functions for Testing, Using Jest for Testing
import {checkIfValidToken} from '../public/js/utils.js'
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