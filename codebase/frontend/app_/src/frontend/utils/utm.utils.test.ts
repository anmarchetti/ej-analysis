import { getUtmParams, removeUTMParamsFromUrl } from './utm.utils';

describe('utm.utils', () => {
    describe('getUtmParams', () => {
        it('should return only params starts with utm', () => {
            const value = { utm: '1', utm_2: '2', not_utm: '3' };

            expect(getUtmParams(value)).toEqual({ utm: '1', utm_2: '2' });
        });

        it('should return empty object if not utm params', () => {
            const value = { test: '1' };

            expect(getUtmParams(value)).toEqual({});
        });
    });

    describe('removeUTMParamsFromUrl', () => {
        it('should remove UTM parameters correctly', () => {
            const urlWithUTMParams = 'https://example.com?utm_source=test_source&utm_medium=test_medium&test=test';
            const expectedUrl = 'https://example.com?test=test&';

            const actualUrl = removeUTMParamsFromUrl(urlWithUTMParams);

            expect(actualUrl).toEqual(expectedUrl);
        });

        it('should return URL if there is no queries', () => {
            const actualUrl = removeUTMParamsFromUrl('https://example.com');

            expect(actualUrl).toEqual('https://example.com?');
        });
    });
});
