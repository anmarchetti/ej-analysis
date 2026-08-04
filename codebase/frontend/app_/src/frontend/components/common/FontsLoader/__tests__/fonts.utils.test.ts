import React from 'react';

import { getFontFaceAtRule, getFontSrc, loadFont } from 'frontend/components/common/FontsLoader/fonts.utils';
import * as fontsUtils from 'frontend/components/common/FontsLoader/fonts.utils';

jest.mock('next/head', () => ({
    __esModule: true,
    default: ({ children }: { children: Array<React.ReactElement> }) => ({ children }),
}));

describe('fonts.utils', () => {
    describe('getFontSrc', () => {
        it('should return empty string if no woff or woff2 in urls', () => {
            const urls = {};
            const fontSrc = getFontSrc(urls);
            expect(fontSrc).toBe('');
        });

        it('should return only woff2 if no woff in urls', () => {
            const urls = { woff2: 'woff2' };
            const fontSrc = getFontSrc(urls);
            expect(fontSrc).toBe(`url("woff2") format('woff2'),`);
        });

        it('should return only woff if no woff2 in urls', () => {
            const urls = { woff: 'woff' };
            const fontSrc = getFontSrc(urls);
            expect(fontSrc).toBe(`url("woff") format('woff')`);
        });

        it('should return both woff2 and woff', () => {
            const urls = { woff2: 'woff2', woff: 'woff' };
            const fontSrc = getFontSrc(urls);
            expect(fontSrc).toBe(`url("woff2") format('woff2'),url("woff") format('woff')`);
        });
    });

    describe('getFontFaceAtRule', () => {
        it('should return font-face with font-display:swap when no descriptors', () => {
            const fontSrc = getFontFaceAtRule('family', {});
            expect(fontSrc).toBe('@font-face{font-family:family;src:;font-display:swap;}');
        });

        it('should return font-face with descriptors', () => {
            const fontSrc = getFontFaceAtRule('family', {}, { display: 'display', weight: '500', style: 'style' });
            expect(fontSrc).toBe(
                '@font-face{font-family:family;src:;font-display:display;font-weight:500;font-style:style;}',
            );
        });
    });

    describe('loadFont', () => {
        beforeAll(() => {
            jest.spyOn(fontsUtils, 'getFontFaceAtRule').mockReturnValue('');
        });

        it('should NOT call getFontFaceAtRule when no fonts and head in document', () => {
            const fonts = {
                family: 'family',
                urls: { woff2: 'woff2' },
                criticalSubset: {
                    urls: { woff2: 'woff2' },
                },
                descriptors: {},
            };
            loadFont(fonts);
            expect(getFontFaceAtRule).toBeCalledTimes(0);
        });
    });
});
