import {
    getCookie,
    getCookieFromContext,
    getSplittedCookieValue,
    listenCookieChange,
    setCookie,
} from './cookies.utils';

jest.useFakeTimers();

describe('cookies.utils', () => {
    describe('getCookie()', () => {
        it('should return empty string if no document cookies', () => {
            jest.spyOn(document, 'cookie', 'get').mockReturnValueOnce('');
            const res = getCookie('test');

            expect(res).toBe('');
        });

        it('should return empty string if no such cookie', () => {
            jest.spyOn(document, 'cookie', 'get').mockReturnValueOnce('cookieA=A; test=123; cookieB=B');
            const res = getCookie('userId');

            expect(res).toBe('');
        });

        it('should return cookie value', () => {
            jest.spyOn(document, 'cookie', 'get').mockReturnValueOnce('cookieA=A; test=123; cookieB=B');
            const res = getCookie('test');

            expect(res).toBe('123');
        });
    });

    describe('setCookie()', () => {
        it('should set cookies without expiration date', () => {
            const mockSetCookie = jest.spyOn(document, 'cookie', 'set');
            setCookie('cookieName', 'cookieValue');

            expect(mockSetCookie).toHaveBeenCalledWith('cookieName=cookieValue; path=/;');
        });

        it('should set cookies with expire date', () => {
            const mockSetCookie = jest.spyOn(document, 'cookie', 'set');
            setCookie('cookieName', 'cookieValue', new Date('2023-01-01T00:00:00Z'));

            expect(mockSetCookie).toHaveBeenCalledWith(
                'cookieName=cookieValue; path=/; expires=Sun, 01 Jan 2023 00:00:00 GMT',
            );
        });
    });

    describe('listenCookieChange()', () => {
        it('should call callback if cookie changed value', () => {
            const mockCallback = jest.fn();
            jest.spyOn(document, 'cookie', 'get').mockReturnValueOnce('test=initial');

            listenCookieChange('test', mockCallback);

            expect(mockCallback).not.toHaveBeenCalled();

            jest.spyOn(document, 'cookie', 'get').mockReturnValueOnce('test=new');
            jest.runOnlyPendingTimers();

            expect(mockCallback).toHaveBeenCalledWith({ oldValue: 'initial', newValue: 'new' });
        });
    });

    describe('getSplittedCookieValue()', () => {
        it('should return empty object for empty string', () => {
            const res = getSplittedCookieValue('');

            expect(res).toEqual({});
        });

        it('should parse single cookie', () => {
            const res = getSplittedCookieValue('cookieName=cookieValue');

            expect(res).toEqual({ cookieName: 'cookieValue' });
        });

        it('should parse multiple cookies', () => {
            const res = getSplittedCookieValue('cookieA=A; test=123; cookieB=B');

            expect(res).toEqual({ cookieA: 'A', test: '123', cookieB: 'B' });
        });

        it('should handle cookies with empty values', () => {
            const res = getSplittedCookieValue('cookieName=; other=value');

            expect(res).toEqual({ cookieName: '', other: 'value' });
        });

        it('should handle cookies with whitespace', () => {
            const res = getSplittedCookieValue('  cookieA  =  valueA  ;  cookieB=valueB  ');

            expect(res).toEqual({ cookieA: 'valueA', cookieB: 'valueB' });
        });

        it('should handle cookies with equals sign in value', () => {
            const res = getSplittedCookieValue('token=eyJhbGc=; other=value');

            expect(res).toEqual({ token: 'eyJhbGc=', other: 'value' });
        });

        it('should handle cookies with multiple equals signs in value', () => {
            const res = getSplittedCookieValue('data=a=b=c; name=test');

            expect(res).toEqual({ data: 'a=b=c', name: 'test' });
        });
    });

    describe('getCookieFromContext()', () => {
        it('should return empty string if no cookie string provided', () => {
            const res = getCookieFromContext('test');

            expect(res).toBe('');
        });

        it('should return empty string if cookie not found in provided header', () => {
            const res = getCookieFromContext('userId', 'cookieA=A; test=123; cookieB=B');

            expect(res).toBe('');
        });

        it('should return cookie value from provided header', () => {
            const res = getCookieFromContext('test', 'cookieA=A; test=123; cookieB=B');

            expect(res).toBe('123');
        });

        it('should fall back to document.cookie if no header provided', () => {
            jest.spyOn(document, 'cookie', 'get').mockReturnValueOnce('cookieA=A; test=456; cookieB=B');
            const res = getCookieFromContext('test');

            expect(res).toBe('456');
        });

        it('should use provided header over document.cookie', () => {
            const res = getCookieFromContext('test', 'test=fromHeader');

            expect(res).toBe('fromHeader');
        });

        it('should return empty string if both header and document.cookie are empty', () => {
            jest.spyOn(document, 'cookie', 'get').mockReturnValueOnce('');
            const res = getCookieFromContext('test', '');

            expect(res).toBe('');
        });

        it('should handle cookies with equals sign in value from header', () => {
            const res = getCookieFromContext('token', 'token=eyJhbGc=; other=value');

            expect(res).toBe('eyJhbGc=');
        });

        it('should return empty string in SSR environment when no header provided', () => {
            const originalDescriptor = Object.getOwnPropertyDescriptor(global, 'document')!;

            Object.defineProperty(global, 'document', { value: undefined, configurable: true, writable: true });

            const res = getCookieFromContext('test');

            Object.defineProperty(global, 'document', originalDescriptor);

            expect(res).toBe('');
        });

        it('should return cookie value from header in SSR environment', () => {
            const originalDescriptor = Object.getOwnPropertyDescriptor(global, 'document')!;

            Object.defineProperty(global, 'document', { value: undefined, configurable: true, writable: true });

            const res = getCookieFromContext('test', 'cookieA=A; test=123; cookieB=B');

            Object.defineProperty(global, 'document', originalDescriptor);

            expect(res).toBe('123');
        });
    });
});
