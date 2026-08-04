import { buildBackLinkUrl } from './BackToReferrer.utils';

describe('BackToReferrer.utils', () => {
    describe('buildBackLinkUrl', () => {
        it('should return null if referrer is null', () => {
            const result = buildBackLinkUrl(null, '/flights');
            expect(result).toBeNull();
        });

        it('should return null if returnPath is null', () => {
            const result = buildBackLinkUrl('https://example.com', null as any);
            expect(result).toBeNull();
        });

        it('should return null if both referrer and returnPath are null', () => {
            const result = buildBackLinkUrl(null, null as any);
            expect(result).toBeNull();
        });

        it('should return null if either referrer or returnPath is an empty string', () => {
            const result1 = buildBackLinkUrl('', '/flights');
            const result2 = buildBackLinkUrl('https://example.com', '');

            expect(result1).toBeNull();
            expect(result2).toBeNull();
        });

        it('should correctly build URL when given valid referrer and returnPath', () => {
            const referrer = 'https://example.com';
            const returnPath = '/flights';
            const expected = 'https://example.com/flights';

            const result = buildBackLinkUrl(referrer, returnPath);
            expect(result).toBe(expected);
        });

        it('should correctly handle returnPath with leading slash', () => {
            const referrer = 'https://example.com';
            const returnPath = '/flights/search';
            const expected = 'https://example.com/flights/search';

            const result = buildBackLinkUrl(referrer, returnPath);
            expect(result).toBe(expected);
        });

        it('should correctly handle returnPath without leading slash', () => {
            const referrer = 'https://example.com';
            const returnPath = 'flights/search';
            const expected = 'https://example.com/flights/search';

            const result = buildBackLinkUrl(referrer, returnPath);
            expect(result).toBe(expected);
        });

        it('should preserve query parameters in returnPath', () => {
            const referrer = 'https://example.com';
            const returnPath = '/flights?from=NYC&to=LAX';
            const expected = 'https://example.com/flights?from=NYC&to=LAX';

            const result = buildBackLinkUrl(referrer, returnPath);
            expect(result).toBe(expected);
        });

        it('should handle referrer with trailing slash correctly', () => {
            const referrer = 'https://example.com/';
            const returnPath = 'flights';
            const expected = 'https://example.com/flights';

            const result = buildBackLinkUrl(referrer, returnPath);
            expect(result).toBe(expected);
        });

        it('should handle invalid URLs by returning null', () => {
            const referrer = 'invalid-url';
            const returnPath = '/flights';

            const result = buildBackLinkUrl(referrer, returnPath);
            expect(result).toBeNull();
        });

        it('should handle relative paths in referrer by returning null', () => {
            const referrer = '/some/path';
            const returnPath = '/flights';

            const result = buildBackLinkUrl(referrer, returnPath);
            expect(result).toBeNull();
        });
    });
});
