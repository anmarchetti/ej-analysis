import { getEnvAll } from 'code/env';
import { sitecoreUrls } from 'code/sitecoreUrls';

const { SITECORE_URL, APP_NAME } = getEnvAll();

describe('sitecore Urls', () => {
    it('return layoutPath', () => {
        const layoutPath = sitecoreUrls.layoutPath('', 'en');
        expect(layoutPath).toBe(`/sitecore/api/layout/render/jss?item=&sc_lang=en&sc_apikey=undefined&sc_mode=normal`);
    });

    it('return layout', () => {
        const layout = sitecoreUrls.layout('', 'en');
        expect(layout).toBe(
            `${SITECORE_URL}/sitecore/api/layout/render/jss?item=&sc_lang=en&sc_apikey=undefined&sc_mode=normal`,
        );
    });

    it('return layoutPlaceholder', () => {
        const layoutPlaceholder = sitecoreUrls.layoutPlaceholder('', 'en', 'placeholder');
        expect(layoutPlaceholder).toBe(
            `${SITECORE_URL}/sitecore/api/layout/placeholder/jss?placeholderName=placeholder&item=&sc_lang=en&sc_apikey=undefined&sc_mode=normal`,
        );
    });

    it('return dictionary', () => {
        const dictionary = sitecoreUrls.dictionary('en');
        expect(dictionary).toBe(`${SITECORE_URL}/sitecore/api/jss/dictionary/holidays/en?sc_apikey=undefined`);
    });

    it('return mediaLink', () => {
        const mediaLink = sitecoreUrls.mediaLink('');
        expect(mediaLink).toBe(`${SITECORE_URL}/`);
    });

    it('return settings', () => {
        const settings = sitecoreUrls.settings('en');
        expect(settings).toBe(`${SITECORE_URL}/api/sitesettings?sc_site=${APP_NAME}&sc_lang=en`);
    });

    it('return priceTooltipSettings', () => {
        const priceTooltipSettings = sitecoreUrls.priceTooltipSettings('en');
        expect(priceTooltipSettings).toBe(
            `${SITECORE_URL}/api/Content/ByPath?path=/sitecore/content/EasyJet/Holidays/Settings/Price Tooltip Settings&withChildren=true&sc_lang=en`,
        );
    });

    it('return airports', () => {
        const airports = sitecoreUrls.airports('en');
        expect(airports).toBe(`${SITECORE_URL}/api/airports/get?sc_lang=en`);
    });

    it('return sitemap', () => {
        const sitemap = sitecoreUrls.sitemap('en');
        expect(sitemap).toBe(`${SITECORE_URL}/api/sitemap/generatesitemap?sc_lang=en`);
    });

    it('return marketSettings', () => {
        const marketSettings = sitecoreUrls.marketSettings();
        expect(marketSettings).toBe(`${SITECORE_URL}/api/SiteSettings/GetAllMarketSettings?sc_site=${APP_NAME}`);
    });
});
