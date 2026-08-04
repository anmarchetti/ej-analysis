import React, { ElementType, FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { ENGLISH } from 'code/cmsLang';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getTitleFontClassName } from 'frontend/utils/componentStylesCustomisation.utils';
import { IHeroBannerFields, IHeroBannerParameters } from 'models/data/IHeroBanner';
import PageHeroBannerTextOrderOptions from 'models/enum/PageHeroBannerTextOrderOptions';
import PageHeroBannerVariants from 'models/enum/PageHeroBannerVariants';
import { JSSImage } from 'frontend/components/common/JSSImage';
import { getBannerTitleFontSizeClassName } from 'frontend/components/renderings/PageHeroBanner/components/StaticBanner/StaticBanner.utils';

import styles from './StaticBannerTitle.module.scss';

export interface IBannerTitleProps {
    fields: IHeroBannerFields;
    isStripeBottomVariant: boolean;
    params: IHeroBannerParameters;
}

const StaticBannerTitle: FC<IBannerTitleProps> = ({ isStripeBottomVariant, fields, params }) => {
    const { siteLang, isDestinationPage } = useStore((stores: TStores) => ({
        siteLang: stores.layoutStore.lang,
        isDestinationPage: stores.layoutStore.isDestinationPage,
    }));

    const { Name, ComposedTitle, Subtitle, Title, Icon } = fields || {};
    const { FontSize, TitleTag: SitecoreTitleTag, TextOrder, Variant, TitleFontStyle } = params || {};

    const subtitle = Subtitle && isDestinationPage ? Subtitle.value : '';
    const text =
        siteLang !== ENGLISH && !!ComposedTitle?.value
            ? ComposedTitle.value
            : `${Title?.value || Name?.value} ${subtitle}`;

    // Use upper case letter to avoid TypeScript error about 'JSX.IntrinsicElements'
    const TitleTag = (SitecoreTitleTag || 'h1') as ElementType;

    const titleSizeClassNames = getBannerTitleFontSizeClassName(FontSize);
    const titleFontClassNames = getTitleFontClassName(TitleFontStyle);

    const isSubtitleFirst = TextOrder === PageHeroBannerTextOrderOptions.SubtitleFirst;

    const isGreyBannerVariant =
        Variant === PageHeroBannerVariants.GreySmallBanner ||
        Variant === PageHeroBannerVariants.GreySmallCentetedTextBanner;

    return (
        <div
            className={classNames(styles.wrapper, isSubtitleFirst && styles.reverseWrapper)}
            data-tid='banner-title-wrapper'
        >
            <TitleTag
                data-tid='banner-title'
                className={classNames(
                    styles.title,
                    titleSizeClassNames,
                    titleFontClassNames,
                    isStripeBottomVariant && styles.stripeTitle,
                    isGreyBannerVariant && styles.smallTitle,
                )}
            >
                <JSSImage field={Icon} className={classNames(styles.icon, isGreyBannerVariant && styles.smallIcon)} />
                {text}
            </TitleTag>

            {!isDestinationPage && (
                <Text
                    className={classNames(styles.subtitle, isGreyBannerVariant && styles.smallSubtitle)}
                    field={Subtitle}
                    tag='div'
                    data-tid='static-banner-subtitle'
                />
            )}
        </div>
    );
};

export default observer(StaticBannerTitle);
