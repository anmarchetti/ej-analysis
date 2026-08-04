import { getCMSLang, getLangByCMSLang, isLanguageAvailableInCMS } from 'code/cmsLang';

describe('cmsLang', () => {
    describe('getCMSLang', () => {
        it('should return CMS lang', () => {
            const lang = getCMSLang('ch-fr');

            expect(lang).toBe('fr-CH');
        });

        it('should return en if no lang', () => {
            const lang = getCMSLang('test');

            expect(lang).toBe('en');
        });
    });

    describe('getLangByCMSLang', () => {
        it('should return lang', () => {
            const lang = getLangByCMSLang('fr-CH');

            expect(lang).toBe('ch-fr');
        });

        it('should return undefined if no lang', () => {
            const lang = getLangByCMSLang('test');

            expect(lang).toBeUndefined();
        });
    });

    describe('isLanguageAvailableInCMS', () => {
        it('should be truthy', () => {
            const res = isLanguageAvailableInCMS('en');

            expect(res).toBeTruthy();
        });

        it('should be falsy', () => {
            const res = isLanguageAvailableInCMS('test');

            expect(res).toBeFalsy();
        });
    });
});
