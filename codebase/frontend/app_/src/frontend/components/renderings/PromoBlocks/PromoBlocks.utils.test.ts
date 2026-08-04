import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { PromoBlockTitleColorOption, TitleFontSizeMobileAndDesktopPromoBlocks } from 'models/enum/PromoBlocksParams';
import { PromoBlocksMaxItems, PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';

import {
    generateImageSizes,
    getIconTextCarouselResponsive,
    getItemsCountByDevice,
    getMaxItemsCount,
    getPromoBlockItemTitleColorClassName,
    getPromoBlockItemTitleFontSizeClassName,
    getPromoBlocksMaxItemByTheme,
    getPromoBlocksResponsiveByTheme,
    isPromoBlockEmpty,
    PROMO_BLOCK_DEFAULT_RESPONSIVE,
    PROMO_BLOCK_GROUP_THEMES,
    PROMO_BLOCK_MOSAIC_RESPONSIVE,
    PROMO_BLOCK_SMALL_RESPONSIVE,
    shouldHidePromoBlock,
    shouldRenderPromoBlock,
} from './PromoBlocks.utils';

describe('PromoBlocks.utils', () => {
    describe('getPromoBlocksMaxItemByTheme', () => {
        it('should return max items for PromoBlocksThemes.Small', () => {
            const result = getPromoBlocksMaxItemByTheme(PromoBlocksThemes.Small);

            expect(result).toStrictEqual(PromoBlocksMaxItems.Small);
        });

        it('should return max items for PromoBlocksThemes.Big', () => {
            const result = getPromoBlocksMaxItemByTheme(PromoBlocksThemes.Big);

            expect(result).toStrictEqual(PromoBlocksMaxItems.Big);
        });

        it('should return max items for others types', () => {
            const result = getPromoBlocksMaxItemByTheme(PromoBlocksThemes.TextAlt);

            expect(result).toStrictEqual(PromoBlocksMaxItems.TitleUnderImage);
        });
    });

    describe('constants', () => {
        it('should export responsive constants', () => {
            expect(PROMO_BLOCK_MOSAIC_RESPONSIVE).toEqual({
                desktop: { breakpoint: { max: 9999, min: 1024 }, items: 1 },
                tablet: { breakpoint: { max: 1024, min: 768 }, items: 1 },
                mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
            });

            expect(PROMO_BLOCK_DEFAULT_RESPONSIVE.mobile.items).toBe(1);
            expect(PROMO_BLOCK_DEFAULT_RESPONSIVE.tablet.items).toBe(2);
            expect(PROMO_BLOCK_DEFAULT_RESPONSIVE.desktop.items).toBe(3);

            expect(PROMO_BLOCK_SMALL_RESPONSIVE.mobile.items).toBe(1);
            expect(PROMO_BLOCK_SMALL_RESPONSIVE.tablet.items).toBe(3);
            expect(PROMO_BLOCK_SMALL_RESPONSIVE.desktop.items).toBe(4);
        });

        it('should include expected group themes', () => {
            expect(PROMO_BLOCK_GROUP_THEMES).toEqual([
                PromoBlocksThemes.Mosaic,
                PromoBlocksThemes.FeaturedDestinationsVariant,
                PromoBlocksThemes.IconTextAlt,
                PromoBlocksThemes.TextAlt,
                PromoBlocksThemes.VerticalStripe,
                PromoBlocksThemes.LinkTileWithBorder,
                PromoBlocksThemes.IconTextCarousel,
            ]);
        });
    });

    describe('getIconTextCarouselResponsive', () => {
        it('should return null when itemsAmount is 0', () => {
            const result = getIconTextCarouselResponsive(0);
            expect(result).toBe(null);
        });

        it('should return null when itemsAmount is undefined', () => {
            const result = getIconTextCarouselResponsive(undefined);
            expect(result).toBe(null);
        });

        it('should return custom responsive config with items less than desktop limit', () => {
            const result = getIconTextCarouselResponsive(2);

            expect(result!.desktop.items).toBe(2);
            expect(result!.tablet.items).toBe(2);
            expect(result!.mobile.items).toBe(1);
            expect(result!.desktop.breakpoint).toEqual({ max: 9999, min: 1024 });
            expect(result!.tablet.breakpoint).toEqual({ max: 1024, min: 768 });
            expect(result!.mobile.breakpoint).toEqual({ max: 768, min: 0 });
        });

        it('should return custom responsive config with items equal to desktop limit', () => {
            const result = getIconTextCarouselResponsive(4);

            expect(result!.desktop.items).toBe(4);
            expect(result!.tablet.items).toBe(3);
            expect(result!.mobile.items).toBe(1);
        });

        it('should cap desktop items at 4 when items exceed desktop limit', () => {
            const result = getIconTextCarouselResponsive(10);

            expect(result!.desktop.items).toBe(4);
            expect(result!.tablet.items).toBe(3);
            expect(result!.mobile.items).toBe(1);
        });

        it('should set tablet items to 3 when items exceed tablet limit', () => {
            const result = getIconTextCarouselResponsive(5);

            expect(result!.tablet.items).toBe(3);
        });

        it('should include partialVisibilityGutter for tablet and mobile', () => {
            const result = getIconTextCarouselResponsive(1);

            expect(result!.tablet.partialVisibilityGutter).toBe(30);
            expect(result!.mobile.partialVisibilityGutter).toBe(30);
            expect(result!.desktop.partialVisibilityGutter).toBeUndefined();
        });

        it('should handle single item', () => {
            const result = getIconTextCarouselResponsive(1);

            expect(result!.desktop.items).toBe(1);
            expect(result!.tablet.items).toBe(1);
            expect(result!.mobile.items).toBe(1);
        });
    });

    describe('getPromoBlocksResponsiveByTheme', () => {
        it('should return PROMO_BLOCK_SMALL_RESPONSIVE for Small theme', () => {
            expect(getPromoBlocksResponsiveByTheme(PromoBlocksThemes.Small)).toBe(PROMO_BLOCK_SMALL_RESPONSIVE);
        });

        it('should return result from getIconTextCarouselResponsive for IconTextCarousel theme without items', () => {
            const result = getPromoBlocksResponsiveByTheme(PromoBlocksThemes.IconTextCarousel);
            expect(result).toBe(PROMO_BLOCK_DEFAULT_RESPONSIVE);
        });

        it('should return custom responsive config for IconTextCarousel theme with items', () => {
            const result = getPromoBlocksResponsiveByTheme(PromoBlocksThemes.IconTextCarousel, 5);

            expect(result.desktop.items).toBe(4);
            expect(result.tablet.items).toBe(3);
            expect(result.mobile.items).toBe(1);
            expect(result.tablet.partialVisibilityGutter).toBe(30);
            expect(result.mobile.partialVisibilityGutter).toBe(30);
        });

        it('should return PROMO_BLOCK_MOSAIC_RESPONSIVE for Mosaic theme', () => {
            const result = getPromoBlocksResponsiveByTheme(PromoBlocksThemes.Mosaic);
            expect(result).toBe(PROMO_BLOCK_MOSAIC_RESPONSIVE);
        });

        it('should return PROMO_BLOCK_RESPONSIVE for non-Small themes', () => {
            expect(getPromoBlocksResponsiveByTheme(PromoBlocksThemes.Big)).toBe(PROMO_BLOCK_DEFAULT_RESPONSIVE);
            expect(getPromoBlocksResponsiveByTheme(PromoBlocksThemes.TitleUnderImage)).toBe(
                PROMO_BLOCK_DEFAULT_RESPONSIVE,
            );
        });
    });

    describe('getItemsCountByDevice', () => {
        const responsive = {
            desktop: { breakpoint: { max: 9999, min: 1024 }, items: 3 },
            tablet: { breakpoint: { max: 1024, min: 768 }, items: 2 },
            mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
        };

        it('should return mobile items count when isMobile is true', () => {
            const result = getItemsCountByDevice(responsive, true, false);
            expect(result).toBe(1);
        });

        it('should return tablet items count when isTablet is true and isMobile is false', () => {
            const result = getItemsCountByDevice(responsive, false, true);
            expect(result).toBe(2);
        });

        it('should return desktop items count when both isMobile and isTablet are false', () => {
            const result = getItemsCountByDevice(responsive, false, false);
            expect(result).toBe(3);
        });

        it('should prioritize mobile over tablet when both are true', () => {
            const result = getItemsCountByDevice(responsive, true, true);
            expect(result).toBe(1);
        });
    });

    describe('getMaxItemsCount', () => {
        const resp = {
            desktop: { breakpoint: { max: 9999, min: 1024 }, items: 10 },
            tablet: { breakpoint: { max: 1024, min: 768 }, items: 2 },
            mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
        };

        it('should be rerendered & xs -> should return min(mobile.items, max)', () => {
            expect(
                getMaxItemsCount({
                    responsive: resp,
                    max: 7,
                    isScreenExtraSmall: true,
                    isScreenLarge: true,
                }),
            ).toBe(1);
        });

        it('should be rerendered & not large (tablet) -> should return min(tablet.items, max)', () => {
            expect(
                getMaxItemsCount({
                    responsive: resp,
                    max: 1,
                    isScreenExtraSmall: false,
                    isScreenLarge: false,
                }),
            ).toBe(1);

            expect(
                getMaxItemsCount({
                    responsive: resp,
                    max: 7,
                    isScreenExtraSmall: false,
                    isScreenLarge: false,
                }),
            ).toBe(2);
        });

        it('when rerendered & large -> should return max', () => {
            expect(
                getMaxItemsCount({
                    responsive: resp,
                    max: 7,
                    isScreenExtraSmall: false,
                    isScreenLarge: true,
                }),
            ).toBe(7);
        });
    });

    describe('getPromoBlockItemTitleFontSizeClassName', () => {
        describe.each([
            [undefined, null],
            [TitleFontSizeMobileAndDesktopPromoBlocks.Mobile16Desktop20, 'textTiny'],
            [TitleFontSizeMobileAndDesktopPromoBlocks.Mobile20Desktop24, 'textExtraSmall'],
            [TitleFontSizeMobileAndDesktopPromoBlocks.Mobile24Desktop32, 'textSmall'],
            [TitleFontSizeMobileAndDesktopPromoBlocks.Mobile32Desktop44, 'textMedium'],
            [TitleFontSizeMobileAndDesktopPromoBlocks.Mobile40Desktop56, 'textLarge'],
        ])('getPromoBlockItemTitleFontSizeClassName()', (optionName, expected) => {
            it(`should return ${expected} font size for ${optionName} option`, () => {
                expect(getPromoBlockItemTitleFontSizeClassName(optionName)).toBe(expected);
            });
        });
    });

    describe('getPromoBlockItemTitleColorClassName', () => {
        describe.each([
            [undefined, null],
            [PromoBlockTitleColorOption.White, 'textWhite'],
            [PromoBlockTitleColorOption.Black, 'textBlack'],
        ])('getPromoBlockItemTitleColorClassName()', (optionName, expected) => {
            it(`should return ${expected} font size for ${optionName} option`, () => {
                expect(getPromoBlockItemTitleColorClassName(optionName)).toBe(expected);
            });
        });
    });

    describe('shouldHidePromoBlock', () => {
        it('should return true when totalItemsCount > maxItemsCount', () => {
            expect(shouldHidePromoBlock(PromoBlocksThemes.Big, PromoBlocksMaxItems.Big + 1, false, true)).toBe(true);
        });

        it('should return false when totalItemsCount <= maxItemsCount', () => {
            expect(shouldHidePromoBlock(PromoBlocksThemes.Big, PromoBlocksMaxItems.Big, false, true)).toBe(false);
            expect(shouldHidePromoBlock(PromoBlocksThemes.Big, PromoBlocksMaxItems.Big - 1, false, true)).toBe(false);
        });
    });

    describe('generateImageSizes', () => {
        it('should generate correct sizes string for PROMO_BLOCK_DEFAULT_RESPONSIVE', () => {
            expect(generateImageSizes(PROMO_BLOCK_DEFAULT_RESPONSIVE)).toBe(
                '(max-width: 768px) 100vw (max-width: 1024px) 50vw 33vw',
            );
        });

        it('should generate correct sizes string for PROMO_BLOCK_SMALL_RESPONSIVE', () => {
            expect(generateImageSizes(PROMO_BLOCK_SMALL_RESPONSIVE)).toBe(
                '(max-width: 768px) 100vw (max-width: 1024px) 33vw 25vw',
            );
        });

        it('should work for arbitrary responsive values (rounding)', () => {
            const custom = {
                desktop: { breakpoint: { max: 9999, min: 1024 }, items: 6 },
                tablet: { breakpoint: { max: 900, min: 600 }, items: 4 },
                mobile: { breakpoint: { max: 600, min: 0 }, items: 3 },
            };

            expect(generateImageSizes(custom)).toBe('(max-width: 600px) 33vw (max-width: 900px) 25vw 17vw');
        });
    });

    describe('isPromoBlockEmpty', () => {
        it('should be true if there are not fields', () => {
            const res = isPromoBlockEmpty({ fields: null } as any);
            expect(res).toBeTruthy();
        });

        it('should be true if all fields are empty', () => {
            const res = isPromoBlockEmpty({
                fields: {
                    Title: { value: '' },
                    Description: { value: '' },
                    Image: { value: {} },
                    Link: { value: { href: '' } },
                },
            } as any);
            expect(res).toBeTruthy();
        });

        it('should be false if there is at least one filled field', () => {
            const res = isPromoBlockEmpty({
                fields: {
                    Title: { value: 'Test' },
                    Description: { value: '' },
                    Image: { value: {} },
                    Link: { value: { href: '' } },
                },
            } as any);
            expect(res).toBeFalsy();
        });
    });

    describe('shouldRenderPromoBlock', () => {
        it('should be false if there are not fields', () => {
            const item = { id: 'test' } as IPromoBlockFields;
            const res = shouldRenderPromoBlock(item, true);
            expect(res).toBeFalsy();
        });

        it('should be false if all fields are empty and there is not edit mode', () => {
            const item = {
                fields: {
                    Title: { value: '' },
                    Description: { value: '' },
                    Image: { value: {} },
                    Link: { value: { href: '' } },
                },
                id: 'test',
            } as IPromoBlockFields;
            const res = shouldRenderPromoBlock(item, false);
            expect(res).toBeFalsy();
        });

        it('should be false if item is undefined', () => {
            const res = shouldRenderPromoBlock(undefined, true);
            expect(res).toBeFalsy();
        });

        it('should be true if item is not empty and there is not edit mode', () => {
            const item = { fields: { Title: { value: 'Test' } }, id: 'test' } as IPromoBlockFields;
            const res = shouldRenderPromoBlock(item, false);
            expect(res).toBeTruthy();
        });

        it('should be true if item is not empty and there is edit mode', () => {
            const item = { fields: { Title: { value: 'Test' } }, id: 'test' } as IPromoBlockFields;
            const res = shouldRenderPromoBlock(item, true);
            expect(res).toBeTruthy();
        });
    });
});
