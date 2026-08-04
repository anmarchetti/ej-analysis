import React, { FC, useEffect, useMemo } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';

import { useLuxuryInternalFlight } from 'frontend/hooks/useLuxuryInternalFlight';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { IAncillariesParams } from 'frontend/components/common/Ancillaries/Ancillaries';
import OutlineBanner, { OutlineBannerContext } from 'frontend/components/common/OutlineBanner/OutlineBanner';
import { OutlineBannerTheme } from 'frontend/components/common/OutlineBanner/OutlineBannerTheme';
import HoldLuggageExtras from 'frontend/components/renderings/HoldLuggage/components/HoldLuggageExtras/HoldLuggageExtras';
import HoldLuggageHeader from 'frontend/components/renderings/HoldLuggage/components/HoldLuggageHeader/HoldLuggageHeader';

import BottomAlert from './components/BottomAlert/BottomAlert';
import HoldLuggageBanners from './components/HoldLuggageBanners/HoldLuggageBanners';
import HoldLuggageSelected from './components/HoldLuggageSelected/HoldLuggageSelected';
import { IHoldLuggageFields } from './IHoldLuggageFields';

import styles from './HoldLuggage.module.scss';

export interface IHoldLuggageProps extends ISitecoreComponent<IHoldLuggageFields, IAncillariesParams> {
    adultsAndChildrenNumber?: number;
    infantsNumber?: number;
}

export const HoldLuggage: FC<IHoldLuggageProps> = props => {
    const {
        extraLuggage,
        infants,
        adultsAndChildrenNumber,
        isConfirmationPage,
        maxNumberOfAdditionalLuggage,
        maxNumberOfSportEquipments,
        largeSportEquipmentCategoryCode,
        maxNumberOfLargeSportsEquipment,
        isExtrasPage,
        isFlightExternal,
        isHoldLuggageFull,
        initializeHoldLuggage,
        isLoading,
        isLuxuryPackage,
        shouldPromoteBags,
        setHBGreenPromoShown,
    } = useStore(({ bookingStore, guestDetailsStore, layoutStore, viewBookingStore, appStore }: TStores) => ({
        isFlightExternal: bookingStore.isFlightExternal || viewBookingStore.isFlightExternal,
        isHoldLuggageFull: bookingStore.holdLuggage.isHoldLuggageFull,
        initializeHoldLuggage: bookingStore.holdLuggage.initializeHoldLuggage,
        isExtrasPage: layoutStore.isExtrasPage,
        extraLuggage: bookingStore.extraLuggage,
        infants: guestDetailsStore.infants,
        adultsAndChildrenNumber: guestDetailsStore.adultsAndChildrenNumber || props.adultsAndChildrenNumber || 0,
        isConfirmationPage: layoutStore.isConfirmationPage,
        maxNumberOfAdditionalLuggage: layoutStore.maxNumberOfAdditionalLuggage,
        maxNumberOfSportEquipments: layoutStore.maxNumberOfSportEquipments,
        largeSportEquipmentCategoryCode: layoutStore.largeSportEquipmentCategoryCode,
        maxNumberOfLargeSportsEquipment: layoutStore.maxNumberOfLargeSportsEquipment,
        isLoading: appStore.isLoading,
        isLuxuryPackage: bookingStore.isLuxuryPackage,
        shouldPromoteBags: layoutStore.shouldPromoteBags,
        setHBGreenPromoShown: bookingStore.extraLuggage.setHBGreenPromoShown,
    }));
    const isLuxuryInternalFlight = useLuxuryInternalFlight();
    const outlineTheme = useMemo(() => {
        if (isLuxuryPackage && isExtrasPage) {
            return { theme: OutlineBannerTheme.LuxuryTheme };
        }

        if (
            shouldPromoteBags &&
            extraLuggage.isLCBAddingUnavailable &&
            extraLuggage.canAddHoldLuggage &&
            isExtrasPage
        ) {
            return { theme: OutlineBannerTheme.PromoTheme };
        }

        return { theme: OutlineBannerTheme.NoTheme };
    }, [
        isLuxuryPackage,
        isExtrasPage,
        shouldPromoteBags,
        extraLuggage.isLCBAddingUnavailable,
        extraLuggage.canAddHoldLuggage,
    ]);

    useEffect(() => {
        setHBGreenPromoShown(outlineTheme.theme === OutlineBannerTheme.PromoTheme);
    }, [outlineTheme.theme, setHBGreenPromoShown]);

    const {
        bookingExtras,
        luggagePrices,
        luggageTypes,
        luggageSelectionFromUrl,
        sportEquipmentSelectionFromUrl,
        canAddHoldLuggage,
        defaultBagsNumber,
        existingExtraLuggageItemsNumber,
    } = extraLuggage;

    const infantsNumber = infants?.length || props.infantsNumber || 0;
    const isFlightInternalOnExtras = !isFlightExternal && isExtrasPage;

    useEffect(() => {
        if (!bookingExtras?.length) {
            return;
        }

        const settings = {
            largeSportEquipmentCategoryCode,
            maxNumberOfLargeSportsEquipment,
            maxNumberOfAdditionalLuggage,
            maxNumberOfSportEquipments,
        };

        initializeHoldLuggage({
            luggageTypes,
            luggagePrices,
            adultsAndChildrenNumber,
            infantsNumber,
            selectedLuggage: luggageSelectionFromUrl,
            selectedSportEquipment: sportEquipmentSelectionFromUrl,
            settings,
        });
    }, [bookingExtras, adultsAndChildrenNumber, infantsNumber]);

    const { fields, params } = props;
    const { Color } = params || {};

    const numberOfComplementaryBags = infantsNumber + defaultBagsNumber;
    const luggageCount = existingExtraLuggageItemsNumber + numberOfComplementaryBags;
    const shouldHideMainContent = !isConfirmationPage && !canAddHoldLuggage && !numberOfComplementaryBags;
    const containerClassName = isConfirmationPage ? styles.holdLuggageConfirmation : styles.holdLuggage;

    if (!fields || isLuxuryInternalFlight) {
        return null;
    }

    if (isLoading && isExtrasPage) {
        return (
            <div
                className={classNames(containerClassName, styles.placeholderHoldLuggage, 'placeholder-shimmer')}
                data-tid='shimmer'
            />
        );
    }

    if (!adultsAndChildrenNumber || (isConfirmationPage && !luggageCount)) {
        return null;
    }

    const showBottomAlert = !isConfirmationPage && isLuxuryPackage;
    const {
        UnavailableMessageHeader,
        UnavailableMessageDescription,
        RequestFailureDescription,
        RequestFailureHeader,
        InternalFlightHeader,
        InternalFlightDescription,
        OutlineBannerTextContent,
    } = fields;

    if (isFlightInternalOnExtras) {
        return (
            <div
                className={classNames(containerClassName, styles.internalFlightContainer)}
                data-tid='hold-luggage-container'
            >
                {!shouldHideMainContent && (
                    <OutlineBannerContext.Provider value={outlineTheme}>
                        <OutlineBanner textContent={OutlineBannerTextContent} color={Color}>
                            <div className={classNames(!isConfirmationPage && styles.container)}>
                                <div
                                    className={classNames(!isConfirmationPage && styles.luggageContainer)}
                                    data-tid='hold-selected-container'
                                >
                                    <HoldLuggageExtras fields={fields} isHoldLuggageFull={isHoldLuggageFull} />
                                    <HoldLuggageSelected infantsNumber={infantsNumber} additionalFields={fields} />
                                </div>
                                {showBottomAlert && <BottomAlert text={fields.ExtraBagsAndSportsNotAvailable} />}
                            </div>
                        </OutlineBanner>
                    </OutlineBannerContext.Provider>
                )}
            </div>
        );
    }

    return (
        <div className={containerClassName} data-tid='hold-luggage-container'>
            <HoldLuggageHeader fields={fields} luggageCount={luggageCount} />
            {!isConfirmationPage && isFlightExternal && (
                <HoldLuggageBanners
                    unavailableMessageHeader={UnavailableMessageHeader}
                    unavailableMessageDescription={UnavailableMessageDescription}
                    requestFailureDescription={RequestFailureDescription}
                    requestFailureHeader={RequestFailureHeader}
                    internalFlightHeader={InternalFlightHeader}
                    internalFlightDescription={InternalFlightDescription}
                />
            )}
            {!shouldHideMainContent && (
                <OutlineBannerContext.Provider value={outlineTheme}>
                    <OutlineBanner textContent={OutlineBannerTextContent} color={Color}>
                        <div className={classNames(!isConfirmationPage && styles.container)}>
                            <div
                                className={classNames(!isConfirmationPage && styles.luggageContainer)}
                                data-tid='hold-selected-container'
                            >
                                <HoldLuggageSelected infantsNumber={infantsNumber} additionalFields={fields} />
                                <HoldLuggageExtras fields={fields} isHoldLuggageFull={isHoldLuggageFull} />
                            </div>
                            {showBottomAlert && <BottomAlert text={fields.ExtraBagsAndSportsNotAvailable} />}
                        </div>
                    </OutlineBanner>
                </OutlineBannerContext.Provider>
            )}
        </div>
    );
};

export default observer(HoldLuggage);
