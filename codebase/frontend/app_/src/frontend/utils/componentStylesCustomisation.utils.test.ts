import { mockCustomisableParams, mockTextBlockCustomisableParams } from 'frontend/__mocks__/customisableParams';
import {
    ContainerPaddingOptions,
    PaddingBottomOptions,
    PaddingTopOptions,
    TextPosition,
    TitleFontSizeMobileAndDesktop,
    TitleFontStyle,
    TitleWeight,
} from 'models/enum/CustomisableComponentsParameters';

import {
    getCssModuleClassName,
    getCustomisableTitleClassName,
    getFontWeightClassName,
    getMobileAndDesktopFontSizeClassName,
    getPaddingBottomClassName,
    getPaddingSizeClassName,
    getPaddingTopClassName,
    getTextBlockTextPositionClassName,
    getTextPositionClassName,
    getTitleFontClassName,
} from './componentStylesCustomisation.utils';

describe('componentStylesCustomisation.utils', () => {
    describe('getCssModuleClassName', () => {
        const stylesModule = {
            wrapper: 'wrapperClassname',
        };

        describe.each([
            ['wrapper', 'wrapperClassname'],
            [null, ''],
            ['nonExistingClass', ''],
        ])('getCssModuleClassName()', (optionName, expected) => {
            it(`should return ${expected} module className for ${optionName} option`, () => {
                expect(getCssModuleClassName(stylesModule, optionName)).toBe(expected);
            });
        });
    });

    describe('getCustomisableTitleClassNames', () => {
        it('should return all classes', () => {
            const position = getCustomisableTitleClassName('test-class', mockCustomisableParams);

            expect(position).toBe('test-class mobile-f14-desktop-f16 weight-200 position-center font-rounded');
        });

        it('should return all text block classes', () => {
            const position = getCustomisableTitleClassName('test-class', mockTextBlockCustomisableParams, true);

            expect(position).toBe(
                'test-class mobile-f14-desktop-f16 weight-200 text-block__header--centered font-rounded',
            );
        });
    });

    describe('getMobileAndDesktopFontSize', () => {
        describe.each([
            [undefined, null],
            [TitleFontSizeMobileAndDesktop.Mobile14Desktop16, 'mobile-f14-desktop-f16'],
            [TitleFontSizeMobileAndDesktop.Mobile18Desktop24, 'mobile-f18-desktop-f24'],
            [TitleFontSizeMobileAndDesktop.Mobile20Desktop32, 'mobile-f20-desktop-f32'],
            [TitleFontSizeMobileAndDesktop.Mobile24Desktop36, 'mobile-f24-desktop-f36'],
        ])('getMobileAndDesktopFontSizeClassName()', (optionName, expected) => {
            it(`should return ${expected} font size for ${optionName} option`, () => {
                expect(getMobileAndDesktopFontSizeClassName(optionName)).toBe(expected);
            });
        });
    });

    describe.each([
        [undefined, null],
        [TitleWeight.Weight100, 'weight-100'],
        [TitleWeight.Weight200, 'weight-200'],
        [TitleWeight.Weight300, 'weight-300'],
        [TitleWeight.Weight400, 'weight-400'],
        [TitleWeight.Weight500, 'weight-500'],
        [TitleWeight.Weight600, 'weight-600'],
        [TitleWeight.Weight700, 'weight-700'],
        [TitleWeight.Weight800, 'weight-800'],
        [TitleWeight.Weight900, 'weight-900'],
    ])('getFontWeightClassName()', (optionName, expected) => {
        it(`should return ${expected} font weight for ${optionName} option`, () => {
            expect(getFontWeightClassName(optionName)).toBe(expected);
        });
    });

    describe.each([
        [undefined, null],
        [TextPosition.Left, 'position-left'],
        [TextPosition.Right, 'position-right'],
        [TextPosition.Center, 'position-center'],
    ])('getTextPositionClassName()', (optionName, expected) => {
        it(`should return ${expected} position for ${optionName} option`, () => {
            expect(getTextPositionClassName(optionName)).toBe(expected);
        });
    });

    describe.each([
        [TitleFontStyle.GenerationHeadline, 'font-generation-headline'],
        [TitleFontStyle.Rounded, 'font-rounded'],
        [TitleFontStyle.RoundedDemi, 'font-rounded-demi'],
        [TitleFontStyle.Unbounded, 'font-unbounded-sans'],
        [undefined, null],
        [TitleFontStyle.Default, null],
    ])('getTitleFontClassName()', (optionName, expected) => {
        it(`should return ${expected} font name for ${optionName} option`, () => {
            expect(getTitleFontClassName(optionName)).toBe(expected);
        });
    });

    describe.each([
        [ContainerPaddingOptions.Padding16, 'padding-16'],
        [ContainerPaddingOptions.Padding24, 'padding-24'],
        [ContainerPaddingOptions.Padding32, 'padding-32'],
        [ContainerPaddingOptions.Padding48, 'padding-48'],
        [undefined, undefined],
    ])('getPaddingSizeClassName()', (optionName, expected) => {
        it(`should return ${expected} padding size for ${optionName} option`, () => {
            expect(getPaddingSizeClassName(optionName)).toBe(expected);
        });
    });

    describe.each([
        [undefined, false, null],
        [TextPosition.Left, true, 'text-block__header--left'],
        [TextPosition.Left, false, ''],
        [TextPosition.Right, true, 'text-block__header--right'],
        [TextPosition.Right, false, 'text-block__description--right'],
        [TextPosition.Center, true, 'text-block__header--centered'],
        [TextPosition.Center, false, 'text-block__description--centered'],
    ])('getTextBlockTextPositionClassName()', (optionName, isTitle, expected) => {
        it(`should return ${expected} position for ${optionName} option when is ${!isTitle && 'NOT '}title`, () => {
            expect(getTextBlockTextPositionClassName(optionName, isTitle)).toBe(expected);
        });
    });

    describe.each([
        [PaddingBottomOptions.Padding32, 'padding-bottom-32'],
        [PaddingBottomOptions.Padding64, 'padding-bottom-64'],
        [PaddingBottomOptions.PaddingMobile32, 'padding-bottom-mobile-32'],
    ])('getPaddingBottomClassName()', (optionName, expected) => {
        it(`should return ${expected} padding bottom for ${optionName} option`, () => {
            expect(getPaddingBottomClassName(optionName)).toBe(expected);
        });
    });

    describe.each([
        [PaddingTopOptions.Padding32, 'padding-top-32'],
        [PaddingTopOptions.Padding64, 'padding-top-64'],
        [PaddingTopOptions.PaddingMobile32, 'padding-top-mobile-32'],
    ])('getPaddingBottomClassName()', (optionName, expected) => {
        it(`should return ${expected} padding bottom for ${optionName} option`, () => {
            expect(getPaddingTopClassName(optionName)).toBe(expected);
        });
    });
});
