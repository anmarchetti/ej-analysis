import { checkIfAbsoluteUrl } from './checkIfAbsoluteUrl';

describe('checkIfAbsoluteUrl', () => {
    test('should return true if url is absolute 1', () => {
        const url = 'https://test-url.com';
        const isAbsoluteUrl = checkIfAbsoluteUrl(url);
        expect(isAbsoluteUrl).toBeTruthy();
    });

    test('should return true if url is absolute 2', () => {
        const url = 'www.test-url.com';
        const isAbsoluteUrl = checkIfAbsoluteUrl(url);
        expect(isAbsoluteUrl).toBeTruthy();
    });

    test('should return true if url is absolute 3', () => {
        const url = 'http://test-url.com';
        const isAbsoluteUrl = checkIfAbsoluteUrl(url);
        expect(isAbsoluteUrl).toBeTruthy();
    });

    test('should return false if url invalid', () => {
        const url = 'https:/test-url.com';
        const isAbsoluteUrl = checkIfAbsoluteUrl(url);
        expect(isAbsoluteUrl).toBeFalsy();
    });

    test('should return false if url is relative', () => {
        const url = '/test-url';
        const isAbsoluteUrl = checkIfAbsoluteUrl(url);
        expect(isAbsoluteUrl).toBeFalsy();
    });
});
