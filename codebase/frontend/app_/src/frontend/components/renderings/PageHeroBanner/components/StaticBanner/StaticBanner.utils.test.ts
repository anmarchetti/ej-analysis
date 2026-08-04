import { TitleFontSizeMobileAndDesktopBanner } from 'models/enum/CustomisableComponentsParameters';
import PageHeroBannerVariants from 'models/enum/PageHeroBannerVariants';

import { getBannerClass, getBannerTitleFontSizeClassName } from './StaticBanner.utils';

describe('utils', () => {
    describe('getBannerClass', () => {
        it('should add default class', () => {
            const result = getBannerClass({}, false);

            expect(result).toEqual('wrapper');
        });

        it('ShowImageGradient', () => {
            const result = getBannerClass(
                {
                    ShowImageGradient: '1',
                },
                true,
            );

            expect(result).toEqual('wrapper stripeBottom gradientOverlay');
        });

        describe('Variant', () => {
            it('OpaqueBottomStripe', () => {
                const result = getBannerClass(
                    {
                        Variant: PageHeroBannerVariants.OpaqueBottomStripe,
                    },
                    false,
                );

                expect(result).toEqual('wrapper opaqueBottom');
            });

            it('GreySmallBanner', () => {
                const result = getBannerClass(
                    {
                        Variant: PageHeroBannerVariants.GreySmallBanner,
                    },
                    false,
                );

                expect(result).toEqual('wrapper greySmall');
            });

            it('GreySmallCentetedTextBanner', () => {
                const result = getBannerClass(
                    {
                        Variant: PageHeroBannerVariants.GreySmallCentetedTextBanner,
                    },
                    false,
                );

                expect(result).toEqual('wrapper greySmallCenteredText');
            });
        });
    });

    describe('getBannerTitleFontSizeClassName', () => {
        describe.each([
            [undefined, null],
            [TitleFontSizeMobileAndDesktopBanner.Mobile40Desktop66, 'mobile-f40-desktop-f66'],
            [TitleFontSizeMobileAndDesktopBanner.Mobile44Desktop74, 'mobile-f44-desktop-f74'],
            [TitleFontSizeMobileAndDesktopBanner.Mobile48Desktop82, 'mobile-f48-desktop-f82'],
            [TitleFontSizeMobileAndDesktopBanner.Mobile50Desktop90, 'mobile-f50-desktop-f90'],
        ])('getBannerTitleFontSizeClassName()', (optionName, expected) => {
            it(`should return ${expected} font size for ${optionName} option`, () => {
                expect(getBannerTitleFontSizeClassName(optionName)).toBe(expected);
            });
        });
    });
});
