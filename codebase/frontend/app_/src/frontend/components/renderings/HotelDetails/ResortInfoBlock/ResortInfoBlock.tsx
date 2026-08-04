import React, { useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { observer, useLocalObservable } from 'mobx-react-lite';
import sanitize from 'sanitize-html';

import { cmsUrls } from 'code/endpoints';
import settings from 'code/settings';
import { Tokens } from 'code/tokens';
import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getLocationHierarchy } from 'frontend/utils/getLocationHierarchy';
import isBackend from 'frontend/utils/isBackend';
import { addressStringToTitleCase } from 'frontend/utils/string.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import JSSResponsiveImage from 'frontend/components/common/JSSResponsiveImage';
import ReadMoreButton from 'frontend/components/common/ReadMoreButton';
import IconChevronDown from 'frontend/components/icons/ChevronDown';
import IconChevronUp from 'frontend/components/icons/ChevronUp';
import IconMapMarker from 'frontend/components/icons/MapMarker';

import styles from './ResortInfoBlock.module.scss';

const MAX_DESCRIPTION_LENGTH = 2;

const ResortInfoBlock: React.FC = () => {
    const [isDataLoaded, setIsDataLoaded] = React.useState(false);

    const localState = useLocalObservable(() => ({
        isReadLess: false,
        descriptionText: '',
        moreDescriptionText: '',
        isShownMapOnDesktop: false,
        isShownMapOnMobile: false,
    }));

    const {
        getPhrase,
        loadResortInfo,
        selectedOffer,
        accommodationId,
        resortInfo,
        hotel,
        isShownMapOnDesktop,
        isShownMapOnMobile,
        toggleMapVisibilityOnDesktop,
        toggleMapVisibilityOnMobile,
        layout,
        isHotelDetailsBrowsePage,
        isHotelDetailsPreview,
        accommodationOrDestinationCode,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        loadResortInfo: stores.bookingStore.loadResortInfo,
        selectedOffer: stores.bookingStore.selectedOffer,
        accommodationId: stores.bookingStore.accommodationId,
        resortInfo: stores.bookingStore.resortInfo,
        hotel: stores.bookingStore.hotel,
        isShownMapOnDesktop: stores.bookingStore.isShownMapOnDesktop,
        isShownMapOnMobile: stores.bookingStore.isShownMapOnMobile,
        toggleMapVisibilityOnDesktop: stores.bookingStore.toggleMapVisibilityOnDesktop,
        toggleMapVisibilityOnMobile: stores.bookingStore.toggleMapVisibilityOnMobile,
        layout: stores.layoutStore.layout,
        isHotelDetailsBrowsePage: stores.layoutStore.isHotelDetailsBrowsePage,
        isHotelDetailsPreview: stores.layoutStore.isHotelDetailsBrowsePagePreview,
        accommodationOrDestinationCode: stores.layoutStore.accommodationOrDestinationCode,
    }));

    const isScreenExtraSmall = useXSMobileViewport();
    const shouldLoadResortInfo = isHotelDetailsBrowsePage || !!selectedOffer;

    useEffect(() => {
        let isCurrentEffect = true;

        if (shouldLoadResortInfo) {
            setIsDataLoaded(false);
            loadResortInfo().finally(() => {
                if (isCurrentEffect) {
                    setIsDataLoaded(true);
                }
            });
        } else {
            setIsDataLoaded(false);
        }

        return () => {
            isCurrentEffect = false;
        };
    }, [shouldLoadResortInfo, loadResortInfo, accommodationId, accommodationOrDestinationCode]);

    const getParseDescription = useCallback(
        (description: string) => {
            const fullDescriptionArray = description ? description.split(/<\s*p[^>]*>/) : [];

            if (fullDescriptionArray.length > MAX_DESCRIPTION_LENGTH) {
                const moreDescriptionArray = fullDescriptionArray.splice(MAX_DESCRIPTION_LENGTH);
                localState.descriptionText = '<p>' + fullDescriptionArray[1];
                localState.moreDescriptionText = '<p>' + moreDescriptionArray.join('<p>');
            } else {
                localState.descriptionText = description;
                localState.moreDescriptionText = '';
            }
        },
        [localState],
    );

    useEffect(() => {
        const description = resortInfo?.resortDescription;

        getParseDescription(description || '');
    }, [resortInfo, getParseDescription]);

    const buttonClick = useCallback(() => {
        localState.isReadLess = !localState.isReadLess;
    }, [localState]);

    const showOrHideMapOnDesktopClick = useCallback(() => {
        toggleMapVisibilityOnDesktop(!isShownMapOnDesktop);
    }, [toggleMapVisibilityOnDesktop, isShownMapOnDesktop]);

    const showOrHideMapOnMobileClick = useCallback(() => {
        toggleMapVisibilityOnMobile(!isShownMapOnMobile);
    }, [toggleMapVisibilityOnMobile, isShownMapOnMobile]);

    const getResortName = (): string | undefined => {
        if (isHotelDetailsBrowsePage) {
            return getLocationHierarchy(layout)?.resort?.name;
        }

        return selectedOffer?.hotel?.resort?.name;
    };

    const getHotelAddress = (): string | undefined => {
        let address: string | undefined;
        let resort: string | undefined;
        let postalCode: string | undefined;
        let country: string | undefined;

        if (!isHotelDetailsBrowsePage) {
            address = hotel?.address;
            resort = hotel?.resort?.name;
            postalCode = hotel?.postalCode;
            country = hotel?.country?.name;
        } else {
            const locationHierarchy = getLocationHierarchy(layout);

            address = layout?.sitecore?.route?.fields?.Address?.value;
            resort = locationHierarchy?.resort?.name;
            country = locationHierarchy?.country?.name;
            postalCode = layout?.sitecore?.route?.fields?.PostalCode?.value;
        }

        return [
            address && addressStringToTitleCase(address),
            resort && addressStringToTitleCase(resort),
            postalCode,
            country && addressStringToTitleCase(country),
        ]
            .filter(Boolean)
            .join(', ');
    };

    const hotelAddress = getHotelAddress();

    const renderMapButton = (): JSX.Element => {
        const isMapOpen = isScreenExtraSmall ? isShownMapOnMobile : isShownMapOnDesktop;
        const hasHotelAddress = !!hotelAddress;

        return (
            <div
                className={classNames(styles.mapButtonWrapper, {
                    [styles.mapButtonWrapperWithoutAddress]: !hasHotelAddress,
                })}
            >
                <div className={styles.location}>
                    <IconMapMarker
                        className={classNames(styles.mapIcon, { [styles.mapIconLight]: !hasHotelAddress })}
                    />
                    {hasHotelAddress && (
                        <p className={styles.address} data-tid='hotel-address'>
                            {hotelAddress}
                        </p>
                    )}
                </div>
                <Button
                    data-tid='show-map-button'
                    onClick={isScreenExtraSmall ? showOrHideMapOnMobileClick : showOrHideMapOnDesktopClick}
                    isText
                    className={styles.dropdownButton}
                >
                    {isMapOpen ? (
                        <>
                            {getPhrase(SitecoreDictionary.HotelDetailsButtonsHideOnMap)}
                            <IconChevronUp />
                        </>
                    ) : (
                        <>
                            {getPhrase(SitecoreDictionary.HotelDetailsButtonsShowOnMap)}
                            <IconChevronDown />
                        </>
                    )}
                </Button>
            </div>
        );
    };

    const label = Tokenizer.replaceToken(
        resortInfo?.resortDescription?.length
            ? getPhrase(SitecoreDictionary.HotelResortInfoLabelsTitle)
            : getPhrase(SitecoreDictionary.HotelResortInfoLabelsExplore),
        Tokens.Name,
        getResortName() || '',
    );

    const isReloadingResortInfo = shouldLoadResortInfo && !isDataLoaded;

    if (isReloadingResortInfo || !resortInfo?.resortDescription?.length || isBackend()) {
        return (
            <div
                data-tid='resort-info-block-no-content'
                className={classNames(styles.noContent, styles.resortInfoWrapper)}
            >
                <div className={styles.contentWrapper}>
                    <h2 data-tid='resort-info-block-title' className={styles.title}>
                        {label}
                    </h2>
                    {!isHotelDetailsPreview && renderMapButton()}
                </div>
            </div>
        );
    }

    if (!isDataLoaded) {
        return null;
    }

    return (
        <div data-tid='resort-info' className={classNames(styles.resortInfo, styles.resortInfoWrapper)}>
            <div className={styles.imageWrapper}>
                <JSSResponsiveImage field={{ value: { src: cmsUrls.media(resortInfo.resortImageUrl) } }} />
            </div>
            <div className={styles.contentWrapper}>
                <h2 className={styles.title}>{label}</h2>
                <div
                    data-tid='resort-info-block-description-text'
                    dangerouslySetInnerHTML={{
                        __html: sanitize(localState.descriptionText, {
                            allowedTags: settings.Default.allowedSafeTags,
                        }),
                    }}
                />
                {localState.isReadLess && (
                    <div
                        data-tid='resort-info-block-more-description-text'
                        dangerouslySetInnerHTML={{
                            __html: sanitize(localState.moreDescriptionText, {
                                allowedTags: settings.Default.allowedSafeTags,
                            }),
                        }}
                    />
                )}
                <div className={classNames(styles.footerSection)}>
                    {!!localState.moreDescriptionText && (
                        <ReadMoreButton
                            dataTid='read-more-button'
                            onClick={buttonClick}
                            isReadLess={localState.isReadLess}
                            readLessText={getPhrase(SitecoreDictionary.GlobalsButtonsReadLess)}
                            readMoreText={getPhrase(SitecoreDictionary.GlobalsButtonsReadMore)}
                            className={styles.dropdownButton}
                        />
                    )}
                    {!isHotelDetailsPreview && renderMapButton()}
                </div>
            </div>
        </div>
    );
};

export default observer(ResortInfoBlock);
