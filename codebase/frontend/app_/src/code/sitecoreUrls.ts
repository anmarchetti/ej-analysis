import { getCMSLang } from './cmsLang';
import { getEnvAll } from './env';

/**
 * THESE URLS LEAD DIRECTLY TO SITECORE.
 * YOU MUST NOT USE IT IN YOUR REACT COMPONENTS AND STORES.
 *
 * INSTEAD YOU SHOULD USE cmsUrls in config.ts
 */
export const sitecoreUrls = {
    layoutPath: (path: string, lang: string): string =>
        `/sitecore/api/layout/render/jss?item=${path}&sc_lang=${getCMSLang(lang)}&sc_apikey=${
            getEnvAll().SITECORE_API_KEY
        }&sc_mode=normal`,
    layout: (path: string, lang: string): string =>
        `${getEnvAll().SITECORE_URL}/sitecore/api/layout/render/jss?item=${path}&sc_lang=${getCMSLang(
            lang,
        )}&sc_apikey=${getEnvAll().SITECORE_API_KEY}&sc_mode=normal`,
    layoutPlaceholder: (path: string, lang: string, placeholder: string): string =>
        `${
            getEnvAll().SITECORE_URL
        }/sitecore/api/layout/placeholder/jss?placeholderName=${placeholder}&item=${path}&sc_lang=${getCMSLang(
            lang,
        )}&sc_apikey=${getEnvAll().SITECORE_API_KEY}&sc_mode=normal`,
    dictionary: (lang: string): string =>
        `${getEnvAll().SITECORE_URL}/sitecore/api/jss/dictionary/holidays/${getCMSLang(lang)}?sc_apikey=${
            getEnvAll().SITECORE_API_KEY
        }`,
    mediaLink: (url: string): string => `${getEnvAll().SITECORE_URL}/${url}`,
    settings: (lang: string, isLocale: boolean = false): string =>
        `${getEnvAll().SITECORE_URL}/api/sitesettings?sc_site=${getEnvAll().APP_NAME}&sc_lang=${
            isLocale ? lang : getCMSLang(lang)
        }`,
    priceTooltipSettings: (lang: string, isLocale: boolean = false): string =>
        `${
            getEnvAll().SITECORE_URL
        }/api/Content/ByPath?path=/sitecore/content/EasyJet/Holidays/Settings/Price Tooltip Settings&withChildren=true&sc_lang=${
            isLocale ? lang : getCMSLang(lang)
        }`,
    airports: (lang: string): string => `${getEnvAll().SITECORE_URL}/api/airports/get?sc_lang=${getCMSLang(lang)}`,
    sitemap: (lang: string, sitemapType?: string): string =>
        `${getEnvAll().SITECORE_URL}/api/sitemap/generatesitemap?sc_lang=${getCMSLang(lang)}` +
        `${sitemapType ? `&sitemapType=${sitemapType}` : ''}`,
    sitemapIndex: (): string => `${getEnvAll().SITECORE_URL}/api/sitemap/generateIndexSitemap`,
    marketSettings: (): string =>
        `${getEnvAll().SITECORE_URL}/api/SiteSettings/GetAllMarketSettings?sc_site=${getEnvAll().APP_NAME}`,
    destinationMenu: (lang: string): string =>
        `${getEnvAll().SITECORE_URL}/api/DestinationsSearch/GetCustomMenu?sc_lang=${lang}`,
};
