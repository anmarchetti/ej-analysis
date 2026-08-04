import classNames from 'classnames';

import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { IHeroBannerParameters } from 'models/data/IHeroBanner';
import { TitleFontSizeMobileAndDesktopBanner } from 'models/enum/CustomisableComponentsParameters';
import PageHeroBannerVariants from 'models/enum/PageHeroBannerVariants';

import styles from './StaticBanner.module.scss';

export const getBannerClass = (params: IHeroBannerParameters, isStripeBottomVariant: boolean): string => {
    const { Variant, ShowImageGradient } = params || {};

    return classNames(
        styles.wrapper,
        isStripeBottomVariant && styles.stripeBottom,
        Variant === PageHeroBannerVariants.OpaqueBottomStripe && styles.opaqueBottom,
        Variant === PageHeroBannerVariants.GreySmallBanner && styles.greySmall,
        Variant === PageHeroBannerVariants.GreySmallCentetedTextBanner && styles.greySmallCenteredText,
        isSitecoreCheckboxSelected(ShowImageGradient) && styles.gradientOverlay,
    );
};

export const getBannerTitleFontSizeClassName = (fontSize?: TitleFontSizeMobileAndDesktopBanner): Nullable<string> => {
    switch (fontSize) {
        case TitleFontSizeMobileAndDesktopBanner.Mobile40Desktop66:
            return 'mobile-f40-desktop-f66';
        case TitleFontSizeMobileAndDesktopBanner.Mobile44Desktop74:
            return 'mobile-f44-desktop-f74';
        case TitleFontSizeMobileAndDesktopBanner.Mobile48Desktop82:
            return 'mobile-f48-desktop-f82';
        case TitleFontSizeMobileAndDesktopBanner.Mobile50Desktop90:
            return 'mobile-f50-desktop-f90';
        default:
            return null;
    }
};
