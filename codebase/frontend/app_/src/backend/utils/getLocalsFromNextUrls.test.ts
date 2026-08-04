import { getLocalsFromNextUrl } from './getLocalsFromNextUrl';

describe('getLocalsFromNextUrl', () => {
    it('should return locals', () => {
        const url = '_next/data/holidays-lcrnko7i/en/holidays/spain.json?path=en&path=holidays&path=spain';

        expect(getLocalsFromNextUrl(url, ['/en/holidays'])).toMatchObject({
            basePath: '/en/holidays',
            path: '/spain',
            lang: 'en',
        });
    });

    it('should convert path to lowes case', () => {
        const url = '_next/data/holidays-lcrnko7i/en/holidays/spain.json?path=en&path=Holidays&path=spain';

        expect(getLocalsFromNextUrl(url, ['/en/holidays'])).toMatchObject({
            basePath: '/en/holidays',
            path: '/spain',
            lang: 'en',
        });
    });

    it('should return empty object when url is empty', () => {
        const url = '_next/data/holidays-lcrnko7i/en/holidays/spain.json?';

        expect(getLocalsFromNextUrl(url, ['/en/holidays'])).toMatchObject({});
    });
});
