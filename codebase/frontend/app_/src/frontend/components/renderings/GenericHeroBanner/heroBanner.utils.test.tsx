import { beachExperimentMock, defaultExperimentMock } from 'frontend/__mocks__/experiments';
import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import BannerBrightnessType from 'models/enum/banners/BrightnessType';
import BannerTextColor from 'models/enum/banners/TextColor';
import GenericHeroBannerVariant from 'models/enum/GenericHeroBannerVariant';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import { getHeroBannerClassNames, getHeroBannerControls, getHeroBannerWrapperClassNames } from './heroBanner.utils';

describe('heroBanner.utils', () => {
    describe('getHeroBannerWrapperClassNames', () => {
        const createProps = () =>
            ({
                className: 'className',
                TextColor: { value: 'Grey' },
                singleSlide: true,
            } as any);

        let mockProps = createProps();

        beforeEach(() => {
            mockProps = createProps();
        });

        it('should return with grey text color', () => {
            const wrapperClassNames = getHeroBannerWrapperClassNames(
                mockProps.className,
                mockProps.TextColor,
                mockProps.singleSlide,
            );
            expect(wrapperClassNames).toBe('className text-color--grey single-slide');
        });

        it('should return with black text color', () => {
            mockProps.TextColor.value = 'Black';
            const wrapperClassNames = getHeroBannerWrapperClassNames(
                mockProps.className,
                mockProps.TextColor,
                mockProps.singleSlide,
            );
            expect(wrapperClassNames).toBe('className text-color--black single-slide');
        });

        it('should return with orange text color', () => {
            mockProps.TextColor.value = 'Orange';
            const wrapperClassNames = getHeroBannerWrapperClassNames(
                mockProps.className,
                mockProps.TextColor,
                mockProps.singleSlide,
            );
            expect(wrapperClassNames).toBe('className text-color--orange single-slide');
        });

        it('should return with white text color', () => {
            mockProps.TextColor.value = 'White';
            const wrapperClassNames = getHeroBannerWrapperClassNames(
                mockProps.className,
                mockProps.TextColor,
                mockProps.singleSlide,
            );
            expect(wrapperClassNames).toBe('className text-color--white single-slide');
        });

        it('should return without single-slide', () => {
            mockProps.singleSlide = undefined;
            const wrapperClassNames = getHeroBannerWrapperClassNames(
                mockProps.className,
                mockProps.TextColor,
                mockProps.singleSlide,
            );
            expect(wrapperClassNames).toBe('className text-color--grey');
        });

        it('should return with flexible-container', () => {
            mockProps.isFlexible = true;
            const wrapperClassNames = getHeroBannerWrapperClassNames(
                mockProps.className,
                mockProps.TextColor,
                mockProps.singleSlide,
                mockProps.isFlexible,
            );
            expect(wrapperClassNames).toBe('className text-color--grey single-slide flexible-container');
        });

        it('should return with unbounded-container when isUnbounded is true', () => {
            const wrapperClassNames = getHeroBannerWrapperClassNames(
                mockProps.className,
                mockProps.TextColor,
                false,
                false,
                true,
            );
            expect(wrapperClassNames).toBe('className text-color--grey unbounded-container');
        });
    });

    describe('getHeroBannerClassNames', () => {
        it('should return proper classNames for TranslucentWhiteStripe Variant', () => {
            const [bannerClass, contentClass, wrapperClass] = getHeroBannerClassNames(
                GenericHeroBannerVariant.TranslucentWhiteStripe,
                BannerBrightnessType.Dark,
                mockSitecoreField(BannerTextColor.Orange),
                true,
                true,
                'propsClassName',
            );
            expect(bannerClass).toBe('hero-banner propsClassName hero-banner--translucent-stripe brightness-dark low');
            expect(contentClass).toBe('hero-banner__content-wrapper single-slide');
            expect(wrapperClass).toBe('wrapper-container wrapper-container--px');
        });

        it('should return proper classNames for OpaqueWhiteStripe Variant', () => {
            const [bannerClass, contentClass, wrapperClass] = getHeroBannerClassNames(
                GenericHeroBannerVariant.OpaqueWhiteStripe,
                BannerBrightnessType.Medium,
                mockSitecoreField(BannerTextColor.Black),
                false,
                false,
            );
            expect(bannerClass).toBe('hero-banner hero-banner--opaque-stripe brightness-medium');
            expect(contentClass).toBe('hero-banner__content-wrapper');
            expect(wrapperClass).toBe('wrapper-container wrapper-container--px');
        });

        it('should return proper classNames for TwoBoxes Variant', () => {
            const [bannerClass, contentClass, wrapperClass] = getHeroBannerClassNames(
                GenericHeroBannerVariant.TwoBoxes,
                BannerBrightnessType.Light,
                mockSitecoreField(BannerTextColor.White),
                false,
                true,
            );
            expect(bannerClass).toBe('hero-banner hero-banner--centered-content');
            expect(contentClass).toBe('hero-banner__content-wrapper');
            expect(wrapperClass).toBe('wrapper-container wrapper-container--px text-color--white single-slide');
        });

        it('should return proper classNames for DualLightboxSlim Variant', () => {
            const [bannerClass, contentClass, wrapperClass] = getHeroBannerClassNames(
                GenericHeroBannerVariant.DualLightboxSlim,
                BannerBrightnessType.Light,
                mockSitecoreField(BannerTextColor.Grey),
            );
            expect(bannerClass).toBe('hero-banner');
            expect(contentClass).toBe('hero-banner__content-wrapper');
            expect(wrapperClass).toBe('wrapper-container wrapper-container--px text-color--grey flexible-container');
        });

        it('should return proper classNames for Unbounded Variant', () => {
            const [bannerClass, contentClass, wrapperClass] = getHeroBannerClassNames(
                GenericHeroBannerVariant.UnboundedBrand,
                BannerBrightnessType.Light,
                mockSitecoreField(BannerTextColor.Grey),
            );
            expect(bannerClass).toBe('hero-banner hero-banner--centered-content');
            expect(contentClass).toBe('hero-banner__content-wrapper');
            expect(wrapperClass).toBe('wrapper-container wrapper-container--px text-color--grey unbounded-container');
        });
    });

    describe('getHeroBannerControls', () => {
        const ctaHref = 'https://web.holidays.easyjet.com{cta}';
        const cta2Href = 'https://web.holidays.easyjet.com{cta}2';
        const createProps = () => [
            mockSitecoreField(mockSitecoreLinkField(ctaHref, 'have first good holiday', SitecoreLinkType.Anchor)),
            mockSitecoreField(mockSitecoreLinkField(cta2Href, 'have second great holiday', SitecoreLinkType.Anchor)),
            mockSitecoreField('') as any,
        ];

        let mockFields = createProps();

        beforeEach(() => {
            mockFields = createProps();
        });

        it('should replace controls href with token from sitecore personalize', () => {
            const controls = getHeroBannerControls(mockFields, beachExperimentMock);

            expect(controls[0].value.href).toBe(
                'https://web.holidays.easyjet.com/en/holidays/test/path-to-item?org=LTN',
            );
            expect(controls[1].value.href).toBe(
                'https://web.holidays.easyjet.com/en/holidays/test/path-to-item?org=LTN2',
            );
        });

        it('should left controls href as it is when NO experiment provided', () => {
            const controls = getHeroBannerControls(mockFields, defaultExperimentMock);

            expect(controls[0].value.href).toBe(ctaHref);
            expect(controls[1].value.href).toBe(cta2Href);
        });

        it('should left controls href as it is when experiment has empty ctas', () => {
            const controls = getHeroBannerControls(mockFields);

            expect(controls[0].value.href).toBe(ctaHref);
            expect(controls[1].value.href).toBe(cta2Href);
        });
    });
});
