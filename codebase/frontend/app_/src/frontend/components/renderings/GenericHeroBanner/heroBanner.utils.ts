import classNames from 'classnames';

import { Tokenizer } from 'frontend/utils/tokenizer';
import BannerBrightnessType from 'models/enum/banners/BrightnessType';
import BannerTextColor from 'models/enum/banners/TextColor';
import GenericHeroBannerVariant from 'models/enum/GenericHeroBannerVariant';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ISitecorePersonalizeExperimentBase } from 'models/sitecore/ISitecorePersonalizeExperiment';

export const CREDIT_FREE_VARIANTS = [
    GenericHeroBannerVariant.TranslucentWhiteStripe,
    GenericHeroBannerVariant.OpaqueWhiteStripe,
    GenericHeroBannerVariant.DualLightboxSlim,
    GenericHeroBannerVariant.LightboxWithRoundel,
    GenericHeroBannerVariant.MultiMessageThreeBoxes,
];

const CENTERED_VARIANTS = [
    GenericHeroBannerVariant.OneBox,
    GenericHeroBannerVariant.TwoBoxes,
    GenericHeroBannerVariant.Standard,
    GenericHeroBannerVariant.UnboundedBrand,
];

export const getHeroBannerWrapperClassNames = (
    className: string,
    TextColor: ISitecoreField<BannerTextColor>,
    singleSlide: boolean | undefined,
    isFlexible?: boolean,
    isUnbounded?: boolean,
): string =>
    classNames(className, BannerTextColorClass[TextColor?.value], {
        'single-slide': singleSlide,
        'flexible-container': isFlexible,
        'unbounded-container': isUnbounded,
    });

export const BannerTextColorClass: Record<keyof typeof BannerTextColor, string> = {
    [BannerTextColor.Orange]: 'text-color--orange',
    [BannerTextColor.Black]: 'text-color--black',
    [BannerTextColor.White]: 'text-color--white',
    [BannerTextColor.Grey]: 'text-color--grey',
};

export const getHeroBannerClassNames = (
    variant: GenericHeroBannerVariant,
    brightness: BannerBrightnessType,
    color: ISitecoreField<BannerTextColor>,
    isLower?: boolean,
    singleSlide?: boolean,
    className?: string,
): string[] => {
    const isCenteredContent = CENTERED_VARIANTS.includes(variant);
    const isLightBox = variant === GenericHeroBannerVariant.DualLightboxSlim;
    const isBoxVariant = isCenteredContent || isLightBox;
    const isUnbounded = variant === GenericHeroBannerVariant.UnboundedBrand;

    const bannerClass = classNames(
        'hero-banner',
        className,
        variant === GenericHeroBannerVariant.TranslucentWhiteStripe && 'hero-banner--translucent-stripe',
        variant === GenericHeroBannerVariant.OpaqueWhiteStripe && 'hero-banner--opaque-stripe',
        isCenteredContent && 'hero-banner--centered-content',
        brightness === BannerBrightnessType.Dark && 'brightness-dark',
        brightness === BannerBrightnessType.Medium && 'brightness-medium',
        isLower && 'low',
    );
    const contentClass = classNames('hero-banner__content-wrapper', {
        'single-slide': !isBoxVariant && singleSlide,
    });
    const wrapperClass = isBoxVariant
        ? getHeroBannerWrapperClassNames(
              'wrapper-container wrapper-container--px',
              color,
              singleSlide,
              isLightBox,
              isUnbounded,
          )
        : 'wrapper-container wrapper-container--px';

    return [bannerClass, contentClass, wrapperClass];
};

export const getHeroBannerControls = (
    fields: ISitecoreField<ISitecoreLink>[],
    experiment?: ISitecorePersonalizeExperimentBase,
): ISitecoreField<ISitecoreLink>[] => {
    if (!experiment?.ctas?.length) {
        return fields;
    }

    const tokens = experiment.ctas.reduce((prev, { token, url }) => {
        prev[token] = url;

        return prev;
    }, {});

    return fields.map(cta => {
        if (cta.value?.href) {
            cta.value = {
                ...cta.value,
                href: Tokenizer.replaceTokens(cta.value.href, tokens),
            };
        }

        return cta;
    });
};
