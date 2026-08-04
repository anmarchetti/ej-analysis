import parseHtmlToReact from 'html-react-parser';
import sanitizeHtml from 'sanitize-html';

import { AVAILABLE_LANGS, getCMSLang, getLangByCMSLang, TCmsLang } from 'code/cmsLang';
import { purifyUrl } from 'frontend/utils/url.utils';

interface IHreflangTag {
    href: string;
    hrefLang: string;
}

export const getHreflangTagByPageUrl = (
    pageUrls: Record<TCmsLang, string>,
    getSitePathInLang: (string) => string,
): IHreflangTag[] => {
    const pageUrlLangs = Object.keys(pageUrls).map(cmsLang => getLangByCMSLang(cmsLang));
    const sortedLangs = [...AVAILABLE_LANGS].filter(lang => pageUrlLangs.includes(lang));

    return sortedLangs.map(siteLang => {
        const cmsLang = getCMSLang(siteLang);
        const basePath = getSitePathInLang(siteLang);
        const href = basePath + purifyUrl(pageUrls[cmsLang]);

        return { href, hrefLang: cmsLang };
    });
};

export const parseManualHreflangTag = (manualHreflangTag: string): JSX.Element | JSX.Element[] | null => {
    // Sanitize html and leave only link tags
    const html = sanitizeHtml(manualHreflangTag, {
        allowedTags: ['link'],
        allowedAttributes: {
            link: ['rel', 'href', 'hreflang'],
        },
    });

    // Sanitize lib doesn't remove text inside non allowed tags, so need extra check if html is link
    if (html?.startsWith('<link')) {
        // Parse final html to react elements.
        // We can't use dangerouslySetInnerHTML, as the html should be inserted directly to the <head/>.
        return parseHtmlToReact(html) as JSX.Element[] | JSX.Element;
    }

    return null;
};
