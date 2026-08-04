import { FC, useEffect } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { getDestinationTypeByCodeLength } from 'frontend/utils/destinations.utils';
import { DestinationType } from 'models/enum/DestinationType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { FlightPlusHotelSitePath } from 'models/enum/SitePath';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';

import styles from './HolidayNotAvailable.module.scss';

export const HolidayNotAvailable: FC = () => {
    const {
        getPhrase,
        isPackageValid,
        isAirportParkingValidationError,
        isSelectedSeatsUnavailableError,
        failedToLoadData,
        selectedOffer,
        isFullMaintenance,
        resetBookingStore,
        redirectToHomePage,
        isCookiesPopupWasShown,
        selectedDestinationCodes,
        isFlightPlusHotelFunnel,
        buildFlightPlusHotelUrl,
        onSearchAgain,
        listenToPopState,
        trackUnavailablePopup,
        isNotEnoughLCBForLuxBooking,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isPackageValid: stores.bookingStore.isPackageValid,
        isAirportParkingValidationError: isHolidayStore(stores) && stores.bookingStore.isAirportParkingValidationError,
        isSelectedSeatsUnavailableError: isHolidayStore(stores) && stores.seatMapStore.isSelectedSeatsUnavailableError,
        failedToLoadData: stores.bookingStore.failedToLoadData,
        selectedOffer: stores.bookingStore.selectedOffer,
        isFullMaintenance: stores.layoutStore.isFullMaintenance,
        resetBookingStore: stores.bookingStore.resetBookingStore,
        redirectToHomePage: stores.routerStore.redirectToHomePage,
        isCookiesPopupWasShown: stores.appStore.isCookiesPopupWasShown,
        selectedDestinationCodes: stores.searchStore.searchTo.selectedDestinationCodes,
        listenToPopState: stores.routerStore.listenToPopState,
        trackUnavailablePopup: stores.trackingStore.trackUnavailablePopup,
        isFlightPlusHotelFunnel: stores.queryParamStore.isFlightPlusHotelFunnel,
        buildFlightPlusHotelUrl: stores.queryParamStore.buildFlightPlusHotelUrl,
        onSearchAgain: () =>
            stores.routerStore.onClickBackButton(stores.routerStore.backToSearchUrl, {
                BackToPromoFromHotelDetails: stores.routerStore.hasPromo,
            }),
        isNotEnoughLCBForLuxBooking: stores.bookingStore.isNotEnoughLCBForLuxBooking,
    }));

    const noErrors = !isSelectedSeatsUnavailableError && !isAirportParkingValidationError;
    const isPackageNotValid = isPackageValid === false && noErrors;

    // We show another popup (SeatsNotAvailablePopup) if package isn't valid due to seats (EJH-15751)
    const shouldShow = isPackageNotValid || failedToLoadData || selectedOffer === null || isNotEnoughLCBForLuxBooking;

    useEffect(() => {
        let listener;

        if (shouldShow) {
            trackUnavailablePopup();
            listener = listenToPopState(() => {
                resetBookingStore();

                return true;
            });
        }

        return () => {
            listener?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldShow]);

    if (!shouldShow || isFullMaintenance || !isCookiesPopupWasShown) {
        return null;
    }

    const destinationTypes = selectedDestinationCodes.map(code => getDestinationTypeByCodeLength(code));
    const isDirectSearchHotel = destinationTypes.includes(DestinationType.Hotel);

    const holidaysOnClick = (): void => {
        resetBookingStore();
        isDirectSearchHotel ? redirectToHomePage() : onSearchAgain();
    };

    const fphOnClick = (): void => {
        resetBookingStore();
        globalThis.location.href = buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Flights, false, true);
    };

    const content = isFlightPlusHotelFunnel
        ? {
              title: SitecoreDictionary.GlobalsTitlesHolidayNotAvailable,
              additionalText: SitecoreDictionary.FlightPlusHotelLabelsTripNotAvailable,
              buttonText: SitecoreDictionary.GlobalsButtonsSearchAgain,
              onClick: fphOnClick,
              className: classNames('holiday-unavailable', styles.flightPlusHotelContainer),
          }
        : {
              title: SitecoreDictionary.GlobalsTitlesHolidayNotAvailable,
              additionalText: selectedOffer
                  ? SitecoreDictionary.GlobalsTitlesWeAreSorry
                  : SitecoreDictionary.GlobalsTitlesWeAreSorryNoOffers,
              buttonText: isDirectSearchHotel
                  ? SitecoreDictionary.GlobalsButtonsHomePage
                  : SitecoreDictionary.GlobalsButtonsSearchAgain,
              onClick: holidaysOnClick,
              className: 'holiday-unavailable',
          };

    return (
        <Popup containerClass={content.className} title={getPhrase(content.title)}>
            <>
                <RichTextDictionary tag='div' className='additional-text' dictionaryKey={content.additionalText} />
                <Button data-tid='holiday-not-available-button' onClick={content.onClick}>
                    {getPhrase(content.buttonText)}
                </Button>
            </>
        </Popup>
    );
};

export default observer(HolidayNotAvailable);
