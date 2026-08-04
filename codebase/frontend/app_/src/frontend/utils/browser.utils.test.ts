import { isIE, isIOS, isMobile } from './browser.utils';
import isBackend from './isBackend';

jest.mock('./isBackend');

describe('browser.utils', () => {
    const mockIsBackend = isBackend as jest.MockedFunction<typeof isBackend>;

    beforeEach(() => {
        mockIsBackend.mockReturnValue(false);
    });

    describe('isIE', () => {
        it('should return true for MSIE user agent', () => {
            Object.defineProperty(window.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; MSIE 11.0; rv:11.0) like Gecko',
                configurable: true,
            });

            expect(isIE()).toBe(true);
        });

        it('should return true for Trident user agent', () => {
            Object.defineProperty(window.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko',
                configurable: true,
            });

            expect(isIE()).toBe(true);
        });

        it('should return false for non-IE user agent', () => {
            Object.defineProperty(window.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
                configurable: true,
            });

            expect(isIE()).toBe(false);
        });
    });

    describe('isIOS', () => {
        it('should return false when on backend', () => {
            mockIsBackend.mockReturnValue(true);

            expect(isIOS()).toBe(false);
        });

        it('should return true for iPhone platform', () => {
            Object.defineProperty(navigator, 'platform', {
                value: 'iPhone',
                configurable: true,
            });

            expect(isIOS()).toBe(true);
        });

        it('should return true for iPad platform', () => {
            Object.defineProperty(navigator, 'platform', {
                value: 'iPad',
                configurable: true,
            });

            expect(isIOS()).toBe(true);
        });

        it('should return true for iPad on iOS 13+', () => {
            Object.defineProperty(navigator, 'platform', {
                value: 'MacIntel',
                configurable: true,
            });
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15',
                configurable: true,
            });
            Object.defineProperty(document, 'ontouchend', {
                value: null,
                configurable: true,
            });

            expect(isIOS()).toBe(true);
        });

        it('should return false for non-iOS platform', () => {
            Object.defineProperty(navigator, 'platform', {
                value: 'Win32',
                configurable: true,
            });
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                configurable: true,
            });

            expect(isIOS()).toBe(false);
        });
    });

    describe('isMobile', () => {
        it('should return false when on backend', () => {
            mockIsBackend.mockReturnValue(true);

            expect(isMobile()).toBe(false);
        });

        it('should return true for iOS devices', () => {
            Object.defineProperty(navigator, 'platform', {
                value: 'iPhone',
                configurable: true,
            });

            expect(isMobile()).toBe(true);
        });

        it('should return true for Android user agent', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
                configurable: true,
            });

            expect(isMobile()).toBe(true);
        });

        it('should return true for BlackBerry user agent', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)',
                configurable: true,
            });

            expect(isMobile()).toBe(true);
        });

        it('should return false for desktop user agent', () => {
            Object.defineProperty(navigator, 'platform', {
                value: 'Win32',
                configurable: true,
            });
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
                configurable: true,
            });

            expect(isMobile()).toBe(false);
        });
    });
});
