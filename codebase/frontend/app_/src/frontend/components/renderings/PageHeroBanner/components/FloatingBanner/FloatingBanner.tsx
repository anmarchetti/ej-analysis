import React, { FunctionComponent, useEffect, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getTitleFontClassName } from 'frontend/utils/componentStylesCustomisation.utils';
import { getRelatedDestinationsCodes } from 'frontend/utils/search/search.utils';
import { TSubHeroBannerProps } from 'models/data/IHeroBanner';
import { MediaSize } from 'models/data/MediaSizeParams';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { IDestinationAvailability } from 'models/IDestinationsAvailability';
import CreditAnchor from 'frontend/components/common/CreditAnchor/CreditAnchor';
import JSSImage from 'frontend/components/common/JSSImage';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';

import FloatingBannerTitle from './components/FloatingBannerTitle/FloatingBannerTitle';
import FloatingUnavailableBanner from './components/FloatingUnavailableBanner/FloatingUnavailableBanner';

import styles from './FloatingBanner.module.scss';

export const FloatingBanner: FunctionComponent<TSubHeroBannerProps> = ({
    fields,
    params,
    rendering,
    cheapestLivePriceForDestinationPage,
}) => {
    const {
        isEditMode,
        isDestinationPage,
        isDestinationUnavailableBannerEnabled,
        isSearchFlexibleOnDestinationGuide,
        getDestinationsAvailability,
        isVirtualResortBrowsePage,
        isVirtualRegionBrowsePage,
        pageFields,
    } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
        isDestinationPage: stores.layoutStore.isDestinationPage,
        isDestinationUnavailableBannerEnabled: stores.layoutStore.isDestinationUnavailableBannerEnabled,
        isSearchFlexibleOnDestinationGuide: stores.layoutStore.isSearchFlexibleOnDestinationGuide,
        getDestinationsAvailability: stores.hotelsStore.getDestinationsAvailability,
        isVirtualRegionBrowsePage: stores.layoutStore.isVirtualRegionBrowsePage,
        isVirtualResortBrowsePage: stores.layoutStore.isVirtualResortBrowsePage,
        pageFields: stores.layoutStore.pageFields,
    }));

    const [availability, setAvailability] = useState<Nullable<IDestinationAvailability>>(null);

    const isMobile = useMobileViewport();

    const isVirtualRegionOrResortPage = isVirtualResortBrowsePage || isVirtualRegionBrowsePage;

    const destinationCode = isDestinationPage ? fields?.Code?.value : null;
    const isShowUnavailableBanner =
        isDestinationUnavailableBannerEnabled &&
        !!destinationCode &&
        !availability?.[destinationCode] &&
        !!availability;

    const relatedDestinationsCodes = getRelatedDestinationsCodes(
        pageFields,
        isVirtualRegionBrowsePage,
        isVirtualResortBrowsePage,
    );

    useEffect(() => {
        const loadDestinationsAvailability = async (): Promise<void> => {
            if (isEditMode || !destinationCode || !isDestinationUnavailableBannerEnabled) {
                return;
            }

            const destinationsAvailability = await getDestinationsAvailability(destinationCode);
            setAvailability(destinationsAvailability);
        };

        if (destinationCode) {
            loadDestinationsAvailability();
        }

        return () => {
            setAvailability(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destinationCode]);

    if (!fields) {
        return null;
    }

    const titleClassName = getTitleFontClassName(params.TitleFontStyle);

    const {
        Name,
        Title,
        Subtitle,
        Image,
        Logo,
        PageCategory,
        CreditIcon,
        CreditText,
        CreditLink,
        DisableCreditAnchor,
        ComposedTitle,
    } = fields;

    return (
        <>
            <div data-tid='floating-banner' className={styles.simpleHeroBanner}>
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
                <div className={styles.imageShadow}>
                    {isEditMode && <JSSImage field={Image} />}

                    <div className={styles.inner} data-tid='floating-banner-inner'>
                        <Placeholder name={PlaceholderNames.HeroBannerTopSection} rendering={rendering} />

                        <div className={styles.content}>
                            <div className={styles.logoWrapper}>
                                <FloatingBannerTitle
                                    ComposedTitle={ComposedTitle}
                                    Subtitle={Subtitle}
                                    Title={Title}
                                    Name={Name}
                                    className={titleClassName}
                                />
                                <div className={styles.logoPosition}>
                                    {!!Logo?.value?.src && (
                                        <div className={styles.logo}>
                                            <JSSImageNext
                                                field={Logo}
                                                alt={Logo.value.alt}
                                                fill
                                                mediaSize={MediaSize.Small}
                                                data-tid='floating-logo'
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isShowUnavailableBanner && <FloatingUnavailableBanner PageCategory={PageCategory} />}

                            <div className={styles.creditAnchorWrapper}>
                                {!!cheapestLivePriceForDestinationPage && (
                                    <Placeholder
                                        name={PlaceholderNames.LivePrice}
                                        rendering={rendering}
                                        livePrice={cheapestLivePriceForDestinationPage}
                                        destinationVirtualCode={
                                            isVirtualRegionOrResortPage ? destinationCode : undefined
                                        }
                                        destinationRelatedCodes={relatedDestinationsCodes}
                                        isFlexibleSearch={isSearchFlexibleOnDestinationGuide}
                                        availableOriginsSearchEnabled
                                        isHolidaysResultButtonEnabled
                                        hasGenericTaxTooltip
                                    />
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
                                    />
                                )}
                            </div>

                            {!isMobile && (
                                <Placeholder
                                    name={PlaceholderNames.FloatingSearchpod}
                                    isFloating
                                    rendering={rendering}
                                    render={components => (
                                        <div className={styles.floatingSearchPodWrapper}>
                                            <div data-tid='desktop-search-pod' className={styles.desktopSearchPod}>
                                                {components}
                                            </div>
                                        </div>
                                    )}
                                    renderEmpty={() => null}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isMobile && <Placeholder name={PlaceholderNames.FloatingSearchpod} isFloating rendering={rendering} />}
        </>
    );
};

export default observer(FloatingBanner);
