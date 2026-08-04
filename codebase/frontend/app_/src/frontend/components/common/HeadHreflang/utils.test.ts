import { TCmsLang } from 'code/cmsLang';

import { getHreflangTagByPageUrl } from './utils';

describe('utils', () => {
    const pageUrls = {
        'fr-CH': '/destinations/mlt',
        'de-CH': '/destinations/mlt',
        'de-DE': '/destinations/mlt',
        en: '/destinations/mlt',
    } as Record<TCmsLang, string>;
    const getSitePathInLang = jest.fn(lang => `https://www.easyjet.com/${lang}/holidays`);

    describe('getHreflangTagByPageUrl', () => {
        it('should create hreflang tags by page url in correct order', () => {
            expect(getHreflangTagByPageUrl(pageUrls, getSitePathInLang)).toEqual([
                {
                    href: 'https://www.easyjet.com/en/holidays/mlt',
                    hrefLang: 'en',
                },
                {
                    href: 'https://www.easyjet.com/ch-fr/holidays/mlt',
                    hrefLang: 'fr-CH',
                },
                {
                    href: 'https://www.easyjet.com/de/holidays/mlt',
                    hrefLang: 'de-DE',
                },
                {
                    href: 'https://www.easyjet.com/ch-de/holidays/mlt',
                    hrefLang: 'de-CH',
                },
            ]);
        });
    });
});
