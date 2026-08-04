import React, { FC, useEffect, useState } from 'react';
import { Image as ImageComponent, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getRelatedDestinationsCodes } from 'frontend/utils/search/search.utils';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { TSubHeroBannerProps } from 'models/data/IHeroBanner';
import { MediaSize } from 'models/data/MediaSizeParams';
import PageHeroBannerHeightOptions from 'models/enum/PageHeroBannerHeightOptions';
import PageHeroBannerVariants from 'models/enum/PageHeroBannerVariants';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { IDestinationAvailability } from 'models/IDestinationsAvailability';
import CreditAnchor from 'frontend/components/common/CreditAnchor/CreditAnchor';
import JSSImage from 'frontend/components/common/JSSImage';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

import BannerTitle from './components/StaticBannerTitle/StaticBannerTitle';
import UnavailableBanner from './components/StaticUnavailableBanner/StaticUnavailableBanner';
import { getBannerClass } from './StaticBanner.utils';

import styles from './StaticBanner.module.scss';

export const StaticBanner: FC<TSubHeroBannerProps> = ({
    fields,
    params,
    rendering,
    cheapestLivePriceForDestinationPage,
}) => {
    const {
        isEditMode,
        isDestinationHeroBannerLivePriceEnabled,
        isSearchFlexibleOnDestinationGuide,
        isDestinationPage,
        trackHolidayTypesHubEvents,
        sitePath,
        isDestinationUnavailableBannerEnabled,
        isResortBrowsePage,
        getDestinationsAvailability,
        isVirtualResortBrowsePage,
        isVirtualRegionBrowsePage,
        pageFields,
    } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
        isDestinationHeroBannerLivePriceEnabled: stores.layoutStore.isDestinationHeroBannerLivePriceEnabled,
        isSearchFlexibleOnDestinationGuide: stores.layoutStore.isSearchFlexibleOnDestinationGuide,
        isDestinationPage: stores.layoutStore.isDestinationPage,
        trackHolidayTypesHubEvents: stores.trackingStore.trackHolidayTypesHubEvents,
        sitePath: stores.layoutStore.sitePath,
        isDestinationUnavailableBannerEnabled: stores.layoutStore.isDestinationUnavailableBannerEnabled,
        isResortBrowsePage: stores.layoutStore.isResortBrowsePage,
        getDestinationsAvailability: stores.hotelsStore.getDestinationsAvailability,
        isVirtualRegionBrowsePage: stores.layoutStore.isVirtualRegionBrowsePage,
        isVirtualResortBrowsePage: stores.layoutStore.isVirtualResortBrowsePage,
        pageFields: stores.layoutStore.pageFields,
    }));

    const {
        Code,
        Image,
        Logo,
        CreditIcon,
        CreditText,
        CreditLink,
        DisableCreditAnchor,
        PageDescription,
        DealPageLink,
        Icon,
    } = fields || {};
    const { Variant, IsTriangleGrey, IsTriangleStart, Height } = params || {};

    const [availability, setAvailability] = useState<Nullable<IDestinationAvailability>>(null);

    const destinationCode = isDestinationPage ? Code?.value : null;
    const isVirtualRegionOrResortPage = isVirtualResortBrowsePage || isVirtualRegionBrowsePage;
    const relatedDestinationsCodes = getRelatedDestinationsCodes(
        pageFields,
        isVirtualRegionBrowsePage,
        isVirtualResortBrowsePage,
    );

    useEffect(() => {
        const loadDestinationsAvailability = async (): Promise<void> => {
            if (isEditMode || !destinationCode || !isDestinationUnavailableBannerEnabled || !isResortBrowsePage) {
                return;
            }

            const availability = await getDestinationsAvailability(destinationCode);
            setAvailability(availability);
        };

        loadDestinationsAvailability();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Code?.value]);

    if (!fields) {
        return null;
    }

    const shouldRenderUnavailableBanner =
        isDestinationHeroBannerLivePriceEnabled &&
        isResortBrowsePage &&
        availability &&
        destinationCode &&
        !availability?.[destinationCode] &&
        !cheapestLivePriceForDestinationPage?.price;

    const isStripeBottomVariant =
        Variant === PageHeroBannerVariants.TranslucentBottomStripe ||
        Variant === PageHeroBannerVariants.OpaqueBottomStripe;

    const bannerClass = getBannerClass(params, isStripeBottomVariant);

    const onDealPageLinkClick = (): void => {
        trackHolidayTypesHubEvents(EventTypes.CTAClick, {
            position: 'Top',
            name: DealPageLink?.value?.text,
            destination: buildSitecoreLinkFullUrl(DealPageLink, sitePath),
        });
    };

    return (
        <div data-tid='static-banner' className={bannerClass}>
            {!isEditMode && (
                <JSSImageNext
                    field={Image}
                    priority
                    fill
                    mediaSize={{
                        mobile: MediaSize.Medium,
                        desktop: MediaSize.Large,
                        tablet: MediaSize.Large,
                    }}
                />
            )}
            {isEditMode && (
                <div className='exp-editor-bg-image'>
                    <ImageComponent field={Image} />
                </div>
            )}

            <div
                className={classNames(
                    'wrapper-container--px',
                    styles.inner,
                    Height === PageHeroBannerHeightOptions.Height400 && styles.h400,
                )}
                data-tid='static-banner-inner'
            >
                <div className={styles.top}>
                    <Placeholder name={PlaceholderNames.HeroBannerTopSection} rendering={rendering} />

                    <div className={styles.topRight}>
                        {!!Logo?.value?.src && (
                            <div className={styles.logo}>
                                <JSSImage field={Logo} />
                            </div>
                        )}

                        {!!CreditIcon && !!CreditText && !!CreditLink && (
                            <CreditAnchor
                                fields={{
                                    CreditIcon,
                                    CreditText,
                                    CreditLink,
                                    DisableCreditAnchor,
                                }}
                                isPillStyle
                                isHomepageBannerElement={false}
                                className={styles.creditAnchor}
                            />
                        )}
                    </div>
                </div>

                <div className={styles.mainContent}>
                    <div
                        data-tid='static-banner-text-block'
                        className={classNames(styles.textBlock, !!Icon?.value?.src && styles.withIcon)}
                    >
                        <BannerTitle fields={fields} params={params} isStripeBottomVariant={isStripeBottomVariant} />

                        {!!PageDescription && (
                            <RichTextWithLinks
                                className={styles.description}
                                field={PageDescription}
                                tag='div'
                                dataId='static-banner-description'
                            />
                        )}

                        <Placeholder
                            name={PlaceholderNames.LivePrice}
                            rendering={rendering}
                            livePrice={cheapestLivePriceForDestinationPage}
                            destinationVirtualCode={isVirtualRegionOrResortPage ? destinationCode : undefined}
                            destinationRelatedCodes={relatedDestinationsCodes}
                            isFlexibleSearch={isSearchFlexibleOnDestinationGuide}
                            availableOriginsSearchEnabled
                            isLink
                            hasChevronIcon
                            hasGenericTaxTooltip
                        />

                        {shouldRenderUnavailableBanner && <UnavailableBanner {...fields} />}

                        {!!DealPageLink?.value?.href && (
                            <RouterLink
                                className={classNames(styles.button, 'btn btn--medium')}
                                link={DealPageLink}
                                onClick={onDealPageLinkClick}
                            >
                                {DealPageLink.value.text}
                            </RouterLink>
                        )}
                    </div>
                </div>
            </div>

            {isStripeBottomVariant ? (
                <div className={styles.stripe} data-tid='static-banner-stripe' />
            ) : (
                <div
                    data-tid='static-banner-triangle'
                    className={classNames(
                        styles.triangle,
                        isSitecoreCheckboxSelected(IsTriangleGrey) && styles.greyTriangle,
                        isSitecoreCheckboxSelected(IsTriangleStart) ? styles.start : styles.end,
                    )}
                />
            )}
        </div>
    );
};

export default observer(StaticBanner);
