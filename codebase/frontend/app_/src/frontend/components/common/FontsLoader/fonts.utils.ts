import { IFontTypeConfig, IFontTypeUrls } from 'code/fonts.config';

export const getFontSrc = (urls: IFontTypeUrls) => {
    const src =
        `${urls.woff2 ? `url("${urls.woff2}") format('woff2'),` : ''}` +
        `${urls.woff ? `url("${urls.woff}") format('woff')` : ''}`;

    return src;
};

export const getFontFaceAtRule = (family: string, urls: IFontTypeUrls, descriptors?: FontFaceDescriptors) =>
    `@font-face{` +
    `font-family:${family};` +
    `src:${getFontSrc(urls)};` +
    (descriptors?.display ? `font-display:${descriptors.display};` : 'font-display:swap;') +
    (descriptors?.weight ? `font-weight:${descriptors.weight};` : '') +
    (descriptors?.style ? `font-style:${descriptors.style};` : '') +
    '}';

function loadFontPolyfill(font: IFontTypeConfig) {
    if ('head' in document) {
        const style = document.createElement('style');
        style.innerHTML = getFontFaceAtRule(font.family, font.urls, font.descriptors);
        document.head.appendChild(style);
    }
}

/** Load Font using CSS Font Loading API. If it's not supported in browser, use the polyfill */
export const loadFont = async (font: IFontTypeConfig) => {
    if ('fonts' in document) {
        try {
            const fontFace = new FontFace(font.family, getFontSrc(font.urls), font.descriptors);
            await fontFace.load();
            document.fonts.add(fontFace);
        } catch (e) {
            loadFontPolyfill(font);
        }
    } else {
        loadFontPolyfill(font);
    }
};
