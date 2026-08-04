import { MediaSize } from 'models/data/MediaSizeParams';

import { getDynamicImageSizes, getDynamicMediaSize } from './JSSImageNext.utils';

describe('JSSImageNext.utils', () => {
    describe('getDynamicMediaSize', () => {
        const mockMediaSizeParam = { tablet: MediaSize.Big, mobile: MediaSize.Small, desktop: MediaSize.Large };

        it('Should return provided MediaSize', () => {
            const result = getDynamicMediaSize(MediaSize.Large, true, false);

            expect(result).toBe(MediaSize.Large);
        });

        it('Should return small media size on mobile screen when mediaSize param has not been provided ', () => {
            const result = getDynamicMediaSize(undefined, true, false);

            expect(result).toBe(MediaSize.Small);
        });

        it('Should return medium media size on tablet screen when mediaSize param has not been provided ', () => {
            const result = getDynamicMediaSize(undefined, false, true);

            expect(result).toBe(MediaSize.Medium);
        });

        it('Should return MediaSize.Big mediaSize for tablet viewport', () => {
            const result = getDynamicMediaSize(mockMediaSizeParam, false, true);

            expect(result).toBe(MediaSize.Big);
        });

        it('Should return MediaSize.Small mediaSize for mobile viewport', () => {
            const result = getDynamicMediaSize(mockMediaSizeParam, true, false);

            expect(result).toBe(MediaSize.Small);
        });

        it('Should return MediaSize.Large mediaSize for desktop viewport', () => {
            const result = getDynamicMediaSize(mockMediaSizeParam, false, false);

            expect(result).toBe(MediaSize.Large);
        });

        it('Should return undefined for desktop viewport when no "desktop" params has benn provided', () => {
            const result = getDynamicMediaSize(undefined, false, false);

            expect(result).toBe(undefined);
        });

        describe('minimumMediaSize', () => {
            it('Should use minimumMediaSize as mobile fallback when no mediaSize provided', () => {
                const result = getDynamicMediaSize(undefined, true, false, MediaSize.Medium);

                expect(result).toBe(MediaSize.Medium);
            });

            it('Should use minimumMediaSize as tablet fallback when no mediaSize provided', () => {
                const result = getDynamicMediaSize(undefined, false, true, MediaSize.Big);

                expect(result).toBe(MediaSize.Big);
            });

            it('Should use minimumMediaSize as desktop fallback when no mediaSize provided', () => {
                const result = getDynamicMediaSize(undefined, false, false, MediaSize.Large);

                expect(result).toBe(MediaSize.Large);
            });

            it('Should prefer explicit mediaSize.mobile over minimumMediaSize on mobile', () => {
                const result = getDynamicMediaSize({ mobile: MediaSize.Small }, true, false, MediaSize.Large);

                expect(result).toBe(MediaSize.Small);
            });

            it('Should prefer explicit mediaSize.tablet over minimumMediaSize on tablet', () => {
                const result = getDynamicMediaSize({ tablet: MediaSize.Medium }, false, true, MediaSize.Large);

                expect(result).toBe(MediaSize.Medium);
            });

            it('Should prefer explicit mediaSize.desktop over minimumMediaSize on desktop', () => {
                const result = getDynamicMediaSize({ desktop: MediaSize.Big }, false, false, MediaSize.Large);

                expect(result).toBe(MediaSize.Big);
            });

            it('Should prefer flat mediaSize string over minimumMediaSize', () => {
                const result = getDynamicMediaSize(MediaSize.Small, true, false, MediaSize.Large);

                expect(result).toBe(MediaSize.Small);
            });
        });
    });

    describe('getDynamicImageSizes', () => {
        let mockParams;

        beforeEach(() => {
            mockParams = {
                mobile: 30,
                tablet: 31,
                desktop: 32,
            };
        });

        it('Should return mobile size for mobile', () => {
            const result = getDynamicImageSizes(mockParams, true, false);

            expect(result).toBe(mockParams.mobile);
        });

        it('Should return tablet size for mobile when mobile param has not been provided', () => {
            delete mockParams.mobile;
            const result = getDynamicImageSizes(mockParams, true, false);

            expect(result).toBe(mockParams.tablet);
        });

        it('Should return desktop size for mobile when nor mobile, either table params have not been provided', () => {
            delete mockParams.mobile;
            delete mockParams.tablet;
            const result = getDynamicImageSizes(mockParams, true, false);

            expect(result).toBe(mockParams.desktop);
        });

        it('Should return tablet size for tablet', () => {
            const result = getDynamicImageSizes(mockParams, false, true);

            expect(result).toBe(mockParams.tablet);
        });

        it('Should return desktop size for tablet when tablet param has not been provided', () => {
            delete mockParams.tablet;
            const result = getDynamicImageSizes(mockParams, false, true);

            expect(result).toBe(mockParams.desktop);
        });

        it('Should return desktop size for desktop', () => {
            const result = getDynamicImageSizes(mockParams, false, false);

            expect(result).toBe(mockParams.desktop);
        });
    });
});
