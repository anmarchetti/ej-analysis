import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getSitecoreImageBackgroundStyles } from 'frontend/utils/getImage';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getBookingDestinationForTracking } from 'frontend/utils/viewBooking.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import { MediaSize } from 'models/data/MediaSizeParams';
import { PartnershipComponentThemes } from 'models/enum/PartnershipComponentThemes';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { withRerender } from 'frontend/components/hoc';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';

import PriceContent from './components/PriceContent';

import styles from './BannerCard.module.scss';

export type TBannerCardFields = {
    CTA: ISitecoreField<ISitecoreLink>;
    Description: ISitecoreField<string>;
    Image: ISitecoreField<ISitecoreImage>;
    Logo: ISitecoreField<ISitecoreImage>;
    Price: ISitecoreField<string>;
    PricePrefix: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
};

export interface IBannerCardProps extends IComponentWithRerenderProps {
    fields: TBannerCardFields;
    index: number;
    childrenCount?: number;
    elRef?: (node?: Nullable<Element>) => void;
    handleClick?: () => void;
    isExternalExtras?: boolean;
    isGridBanner?: boolean;
    isLogoBackgroundTransparent?: TSitecoreCheckboxValue;
    isSingleGridItemOnRow?: boolean;
    livePrice?: Nullable<ILivePrice>;
    theme?: PartnershipComponentThemes;
}

export const BannerCard = ({
    elRef,
    theme,
    handleClick,
    wasRerendered,
    livePrice,
    isLogoBackgroundTransparent,
    isExternalExtras,
    childrenCount,
    isGridBanner,
    isSingleGridItemOnRow,
    fields,
    index,
}: IBannerCardProps) => {
    const { isEditMode, isScreenLessMedium, isPriceToggleActive, trackExternalExtrasTileClick, booking } = useStore(
        (stores: TStores) => ({
            isEditMode: stores.layoutStore.isEditMode,
            isScreenLessMedium: stores.appStore.isScreenLessMedium,
            isPriceToggleActive: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
            trackExternalExtrasTileClick: stores.trackingStore.trackExternalExtrasTileClick,
            booking: stores.viewBookingStore.booking || stores.bookingStore.booking,
        }),
    );

    const { Title, Description, Subtitle, Image, Logo, CTA, Price, PricePrefix } = fields || {};
    const withoutLivePriceTheme = theme === PartnershipComponentThemes.WithoutLivePrice;
    const shouldDisplayPrice = isPriceToggleActive && (!!livePrice?.pricePP || (Price?.value && PricePrefix?.value));

    const link = {
        value: {
            ...CTA.value,
            href: Tokenizer.replaceTokens(CTA.value?.href || '', {
                [Tokens.Destination]: getBookingDestinationForTracking(booking),
            }),
        },
    };
    const onBannerClick = (): void => {
        trackExternalExtrasTileClick(
            fields.Title?.value,
            index + 1,
            livePrice?.price ? String(livePrice.price) : fields.Price?.value,
            link.value?.href,
        );
    };

    return (
        <div
            ref={elRef}
            onClick={onBannerClick}
            data-tid='banner-card'
            className={classNames('no-print', styles.bannerCard, {
                [styles.bannerCardPartnership]: !isExternalExtras,
                [styles.externalExtrasBanner]: isExternalExtras,
                [styles.bannerCardTwoOrLess]: childrenCount && childrenCount <= 2,
                [styles.gridBanner]: isGridBanner,
                [styles.singleGridItemOnRow]: isSingleGridItemOnRow,
            })}
        >
            <div
                className={classNames(styles.info, { [styles.infoPartnership]: !isExternalExtras })}
                data-tid='banner-info'
            >
                <Text field={Subtitle} tag='div' className={styles.subtitle} data-tid='banner-subtitle' />
                <Text field={Title} tag='h2' className={styles.title} data-tid='banner-title' />
                <RichTextWithLinks field={Description} className={styles.description} data-tid='banner-description' />
                <RouterLink
                    link={link}
                    data-tid='banner-link-button'
                    className={classNames(styles.button, {
                        'btn--outlined': !withoutLivePriceTheme,
                        [styles.buttonExternal]: isExternalExtras,
                    })}
                    onClick={handleClick}
                >
                    {CTA?.value?.text}
                </RouterLink>
            </div>
            <div
                className={classNames(styles.bg, { [styles.bgPartnership]: !isExternalExtras })}
                style={getSitecoreImageBackgroundStyles(
                    Image,
                    MediaSize.Large,
                    wasRerendered && isScreenLessMedium,
                    isEditMode,
                )}
                data-tid='banner-bg'
            />
            {Logo?.value.src && (
                <div
                    className={classNames(
                        styles.logoContainer,
                        isSitecoreCheckboxSelected(isLogoBackgroundTransparent) && styles.logoContainerTransparent,
                    )}
                    data-tid='banner-logo-container'
                >
                    <JSSImage
                        data-tid='banner-logo'
                        field={Logo}
                        className={classNames(styles.logo, isExternalExtras && styles.logoExternalExtras)}
                    />
                </div>
            )}

            {shouldDisplayPrice && (
                <PriceContent
                    isExternalExtras={isExternalExtras}
                    link={link}
                    livePrice={livePrice}
                    price={Price}
                    pricePrefix={PricePrefix}
                />
            )}
        </div>
    );
};

export default observer(withRerender(BannerCard));
