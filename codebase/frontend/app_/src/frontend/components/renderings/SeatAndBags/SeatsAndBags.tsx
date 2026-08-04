import { FunctionComponent, useEffect, useMemo } from 'react';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useLuxuryInternalFlight } from 'frontend/hooks/useLuxuryInternalFlight';
import usePrevious from 'frontend/hooks/usePrevious';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { formatDateToQuery } from 'frontend/utils/date.utils';
import { removeWebStorageItem } from 'frontend/utils/webStorage.utils';
import { ISeatsAndBagsProps } from 'models/data/ISeatsAndBagsFields';
import { BookingStatus } from 'models/enum/BookingStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Ancillaries from 'frontend/components/common/Ancillaries/Ancillaries';
import AncillariesDropdown from 'frontend/components/common/AncillariesDropdown/AncillariesDropdown';
import AncillariesPassengerType from 'frontend/components/common/AncillariesPassengerType/AncillariesPassengerType';
import OutlineBanner, { OutlineBannerContext } from 'frontend/components/common/OutlineBanner/OutlineBanner';
import { OutlineBannerTheme } from 'frontend/components/common/OutlineBanner/OutlineBannerTheme';

import SeatInfoMessages from './components/SeatInfoMessages/SeatInfoMessages';
import SeatMapActionPanel from './components/SeatMapActionPanel/SeatMapActionPanel';
import SeatMapPassengersList from './components/SeatMapPassengersList/SeatMapPassengersList';
import SeatsAndBagsLuxuryInternalFlight from './components/SeatsAndBagsLuxuryInternalFlight/SeatsAndBagsLuxuryInternalFlight';
import { usePricePanelInfo } from './hooks/usePricePanelInfo';
import { getPageFlow } from './SeatsAndBags.utils';

import styles from './SeatsAndBags.module.scss';

export const SeatsAndBags: FunctionComponent<ISeatsAndBagsProps> = ({
    fields,
    rendering,
    booking,
    onAmendSeatsClick,
}) => {
    const {
        outbound,
        inbound,
        selectedOffer,
        isExtrasPage,
        fetchSeatMap,
        isSeatMapFailed,
        passengersByQueue,
        adultsWithInfantsCount,
        adultsWithoutInfantsCount,
        childrenCount,
        isSeatMapFlowEnabled,
        isEnabledToBookSeats,
        initializePageLoadObject,
        isAmendPaymentPage,
        isViewBookingPage,
        isConfirmationPage,
        isPreviousBooking,
        isSeatMapPostBookingFlowEnabled,
        shouldOpenSeatMapForced,
        setSeatMapOpened,
        isSeatMapOpened,
        seatsResponse,
        isPricesHidden,
        isHideSeatMapWarningMessages,
        isBookingOutOfSync,
        isFlightExternal,
        isLoading,
        isLuxuryPackage,
        isPremiumSeatsSelected,
    } = useStore((stores: TStores) => ({
        isFlightExternal: stores.bookingStore.isFlightExternal || stores.viewBookingStore.isFlightExternal,
        outbound: stores.seatMapStore.outboundFlight,
        inbound: stores.seatMapStore.inboundFlight,
        selectedOffer: stores.bookingStore.selectedOffer,
        minNumberOfDaysToDeparture: stores.seatMapStore.minNumberOfDaysToDeparture,
        isExtrasPage: stores.layoutStore.isExtrasPage,
        fetchSeatMap: stores.seatMapStore.fetchSeatMap,
        isSeatMapFailed: stores.seatMapStore.isSeatMapFailed,
        passengersByQueue: stores.flightsPassengersStore.passengersByQueue,
        adultsWithInfantsCount: stores.flightsPassengersStore.adultsWithInfantsCount,
        adultsWithoutInfantsCount: stores.flightsPassengersStore.adultsWithoutInfantsCount,
        childrenCount: stores.flightsPassengersStore.childrenCount,
        isSeatMapFlowEnabled: stores.seatMapStore.isSeatMapFlowEnabled,
        isEnabledToBookSeats: stores.seatMapStore.isEnabledToBookSeats,
        isAmendPaymentPage: stores.layoutStore.isAmendPaymentPage,
        isViewBookingPage: stores.layoutStore.isViewBookingPage,
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
        isSeatMapPostBookingFlowEnabled: stores.seatMapStore.isSeatMapPostBookingFlowEnabled,
        shouldOpenSeatMapForced: stores.seatMapStore.shouldOpenSeatMapForced,
        setSeatMapOpened: stores.seatMapStore.setSeatMapOpened,
        isSeatMapOpened: stores.seatMapStore.isSeatMapOpened,
        seatsResponse: stores.seatMapStore.seatsResponse,
        isPricesHidden: isTradeStore(stores) && stores.layoutStore.isPricesHidden,
        ...(isHolidayStore(stores) && {
            initializePageLoadObject: stores.trackingStore.initializePageLoadObject,
            isPreviousBooking: stores.viewBookingsStore.isPreviousBooking,
        }),
        isHideSeatMapWarningMessages: isHolidayStore(stores) && stores.seatMapStore.isHideSeatMapWarningMessages,
        isBookingOutOfSync: stores.viewBookingStore.isBookingOutOfSync,
        isLoading: stores.appStore.isLoading,
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage || stores.viewBookingStore.isLuxuryPackage,
        isPremiumSeatsSelected: stores.seatMapStore.isPremiumSeatsSelected,
    }));

    const { isPostBookingFlow, isBookingFlow } = getPageFlow(
        booking,
        isViewBookingPage,
        isConfirmationPage,
        isAmendPaymentPage,
    );
    const isLuxuryInternalFlight = useLuxuryInternalFlight();

    const getPricesVisibility = (): boolean => {
        if (isAmendPaymentPage) {
            return false;
        }

        return !isBookingFlow || isPricesHidden;
    };
    const shouldHidePrices = getPricesVisibility();

    const pricePanelInfo = usePricePanelInfo(shouldHidePrices);
    const isBookingCanceled = booking?.bookingStatus === BookingStatus.Canceled;
    const isBookingFulfilled = !!isPreviousBooking?.(booking); // is booking from Previous tab on View Booking page

    const previousSelectedOffer = usePrevious(selectedOffer);

    useEffect(() => {
        if (shouldOpenSeatMapForced && seatsResponse.length > 0) {
            setSeatMapOpened(true);
        }
    }, [shouldOpenSeatMapForced, setSeatMapOpened, seatsResponse]);

    useEffect(() => {
        if (isSeatMapOpened) {
            removeWebStorageItem(WebStorageKeys.SeatTogetherCheckboxDeparture, sessionStorage);
            removeWebStorageItem(WebStorageKeys.SeatTogetherCheckboxReturn, sessionStorage);
        }
    }, [isSeatMapOpened]);

    useEffect(() => {
        if (!isExtrasPage) {
            return;
        }

        const getSeatMap = async (): Promise<void> => {
            if (selectedOffer?.transport?.routes) {
                await fetchSeatMap(selectedOffer.transport.routes, selectedOffer.accom.prom);
            }
        };

        if (!previousSelectedOffer && selectedOffer) {
            getSeatMap();
        }
    }, [fetchSeatMap, isExtrasPage, previousSelectedOffer, selectedOffer]);

    useEffect(() => {
        if (
            !isViewBookingPage ||
            (isPostBookingFlow && (isBookingCanceled || isBookingFulfilled || !isSeatMapPostBookingFlowEnabled))
        ) {
            return;
        }

        const getSeatMap = async (): Promise<void> => {
            const { routes } = booking?.package.transport || {};

            if (routes?.length) {
                await fetchSeatMap(routes, booking?.prom);
            }
        };

        if (!previousSelectedOffer && booking?.package) {
            getSeatMap();
        }
    }, [
        isViewBookingPage,
        previousSelectedOffer,
        booking,
        fetchSeatMap,
        isBookingFulfilled,
        isSeatMapPostBookingFlowEnabled,
        isPostBookingFlow,
        isBookingCanceled,
    ]);

    const isLuxuryInternalFlightComponent = useMemo((): boolean => {
        if ((isExtrasPage || isConfirmationPage) && isLuxuryInternalFlight) {
            return true;
        }

        if (isViewBookingPage && isLuxuryInternalFlight && isBookingOutOfSync) {
            return true;
        }

        return false;
    }, [isExtrasPage, isLuxuryInternalFlight, isSeatMapFailed, isViewBookingPage, isBookingOutOfSync]);

    const outlineBannerThemeValue = useMemo(
        () => ({
            theme:
                isLuxuryPackage && !isPremiumSeatsSelected && isExtrasPage
                    ? OutlineBannerTheme.LuxuryTheme
                    : OutlineBannerTheme.NoTheme,
        }),
        [isLuxuryPackage, isPremiumSeatsSelected, isExtrasPage],
    );

    const viewBookingOutlineBannerThemeValue = useMemo(
        () => ({
            theme:
                isLuxuryPackage && !isPremiumSeatsSelected && isViewBookingPage
                    ? OutlineBannerTheme.LuxuryTheme
                    : OutlineBannerTheme.NoTheme,
        }),
        [isLuxuryPackage, isPremiumSeatsSelected, isViewBookingPage],
    );

    if (!fields) {
        return null;
    }

    const handleBookSeatsClick = (e: React.MouseEvent): void => {
        onAmendSeatsClick ? onAmendSeatsClick(e) : setSeatMapOpened(true);
    };

    // hide component if
    // 1) on extras page but not flights data
    // 2) don't have any info about passengers
    const isNoFlightsOnExtraPage = isExtrasPage && !outbound && !inbound;
    const isNoPassengersInfo = !isAmendPaymentPage && !passengersByQueue.length && isFlightExternal;

    if (isLoading && isExtrasPage) {
        return (
            <div
                className={classNames(styles.placeholderSeatsBags, 'seats-and-bags', 'placeholder-shimmer')}
                data-tid='shimmer'
            />
        );
    }

    if (isNoFlightsOnExtraPage || isNoPassengersInfo) {
        return null;
    }

    const getTitling = (): { Description: ISitecoreField<string>; Subtitle: ISitecoreField<string> } => {
        if (isLuxuryInternalFlight) {
            return {
                Subtitle: fields.LuxuryInternalFlightTitling?.fields?.Subtitle,
                Description: fields.LuxuryInternalFlightTitling?.fields?.Description,
            };
        }

        if ((isExtrasPage || isViewBookingPage) && isLuxuryPackage) {
            return {
                Subtitle: fields.LuxuryTitling?.fields?.Subtitle,
                Description: fields.LuxuryTitling?.fields?.Description,
            };
        }

        return {
            Subtitle: fields.DefaultTitling?.fields?.Subtitle,
            Description: fields.DefaultTitling?.fields?.Description,
        };
    };

    if (isLuxuryInternalFlightComponent) {
        return (
            <SeatsAndBagsLuxuryInternalFlight
                {...getTitling()}
                Icon={fields.Icon}
                LuxurySeriesSeatFlightsTitlePostBook={fields.LuxurySeriesSeatFlightsTitlePostBook}
                SeriesSeatFlightsPageTitle={fields.SeriesSeatFlightsPageTitle}
            />
        );
    }

    const isSeatsSelected = !!booking?.seatSelection?.find(flight => !!flight.seats);

    const isSeatComponentShown = (): boolean => {
        if (isAmendPaymentPage) {
            return true;
        }

        if (isBookingFlow) {
            return isEnabledToBookSeats;
        }

        const isSeatsComponentShownPostBooking =
            (isSeatMapPostBookingFlowEnabled || isSeatsSelected) && !isBookingOutOfSync && !isSeatMapFailed;

        return isSeatsComponentShownPostBooking;
    };

    const isInfoMessageShown = (): boolean => {
        if (!isSeatMapFlowEnabled || isAmendPaymentPage) {
            return false;
        }

        if (isBookingFlow) {
            return !isSeatMapFailed && !isFlightExternal && !isLuxuryPackage;
        }

        return !isFlightExternal && isBookingOutOfSync;
    };

    const onCloseSeatMap = (): void => {
        setSeatMapOpened(false);

        // When seat map popup opened, it's tracked as new pageLoad (e.g Seats Outbound Page).
        // After closing popup, need reset pageLoad for real page (e.g. Extras page).
        initializePageLoadObject?.();
    };

    const getActionPanel = (): JSX.Element | null => {
        const isBookingFlowEnabled = isBookingFlow && isEnabledToBookSeats;
        const isPostBookingFlowEnabled = isPostBookingFlow && isSeatMapPostBookingFlowEnabled;

        if ((isBookingFlowEnabled || isPostBookingFlowEnabled) && !isBookingOutOfSync && !isBookingCanceled) {
            return (
                <SeatMapActionPanel
                    handleBookSeatsClick={handleBookSeatsClick}
                    fields={fields}
                    passengers={passengersByQueue}
                />
            );
        }

        return null;
    };

    // Messages
    const shouldShowWarning = isSeatMapFailed && isFlightExternal;
    const shouldShowInfoMessage = isInfoMessageShown();
    const shouldShowNotAvailableMessage = isBookingFlow && !isSeatMapFlowEnabled;
    const shouldShowOutOfSyncMessage =
        isBookingOutOfSync && !shouldShowNotAvailableMessage && !shouldShowInfoMessage && !shouldShowWarning;
    const shouldShowMessages = !isHideSeatMapWarningMessages && !isAmendPaymentPage;

    // Seat map action panel
    const seatMapActionPanel = getActionPanel();

    const shouldShowSeatComponent = isSeatComponentShown();

    const shouldShowSeatMap = outbound && isSeatMapOpened && !isAmendPaymentPage;

    if (isExtrasPage) {
        removeWebStorageItem(WebStorageKeys.SeatUrgencyMessageText, sessionStorage);
    }

    return (
        <div
            data-tid='seats-and-bags-container'
            className={classNames('seats-and-bags', { [styles.internalFlightContainer]: shouldShowInfoMessage })}
        >
            <OutlineBannerContext.Provider value={viewBookingOutlineBannerThemeValue}>
                <OutlineBanner className={styles.outlineBanner}>
                    {shouldShowInfoMessage && isBookingFlow && (
                        <Text
                            field={fields.SeriesSeatFlightsPageTitle}
                            tag='h2'
                            className={styles.title}
                            data-tid='seats-and-bags-title'
                        />
                    )}
                    {shouldShowSeatComponent && (
                        <OutlineBannerContext.Provider value={outlineBannerThemeValue}>
                            <Ancillaries
                                {...getTitling()}
                                fields={fields}
                                actionPanel={seatMapActionPanel}
                                outboundSelection={
                                    <SeatMapPassengersList
                                        seats={passengersByQueue.map(passenger => passenger.outboundPassenger?.seat)}
                                    />
                                }
                                inboundSelection={
                                    <SeatMapPassengersList
                                        seats={passengersByQueue.map(passenger => passenger.inboundPassenger?.seat)}
                                    />
                                }
                            >
                                <AncillariesDropdown
                                    fields={fields}
                                    pricePanelsInbound={pricePanelInfo.inboundPricePanels}
                                    pricePanelsOutbound={pricePanelInfo.outboundPricePanels}
                                    passengerTypeInfo={passengersByQueue.map((passenger, numberOfPerson) => (
                                        <AncillariesPassengerType
                                            {...passenger}
                                            fields={fields}
                                            numberOfPerson={numberOfPerson + 1}
                                            key={passenger.outboundPassenger?.passengerId}
                                        />
                                    ))}
                                    actionPanel={seatMapActionPanel}
                                />
                            </Ancillaries>
                        </OutlineBannerContext.Provider>
                    )}
                    {shouldShowMessages && (
                        <SeatInfoMessages
                            fields={fields}
                            shouldShowInfoMessage={shouldShowInfoMessage}
                            shouldShowNotAvailableMessage={shouldShowNotAvailableMessage}
                            shouldShowOutOfSyncMessage={shouldShowOutOfSyncMessage}
                            shouldShowWarning={shouldShowWarning}
                        />
                    )}
                    {shouldShowSeatMap && (
                        <Placeholder
                            name={PlaceholderNames.SeatMap}
                            rendering={rendering}
                            props={{
                                isPostBooking: isPostBookingFlow,
                                adultsCount: adultsWithoutInfantsCount + adultsWithInfantsCount, // in the seat-map widget we do not seat infants, so adultsWithInfants must be merged here with adultsWithoutInfants, this because in the widget then the adultsWithInfants element are created again
                                childrenCount,
                                adultsWithInfantsCount, // in widget we use this value as number of infants. adultsAndInfants will be created in widget again
                                depAirportCodeOut: outbound.depPt,
                                arrAirportCodeOut: outbound.arrPt,
                                depDateOut: formatDateToQuery(outbound.depDate),
                                flightNumberOut: outbound.fltNo.replace(/\D/g, ''),
                                ...(inbound
                                    ? {
                                          depAirportCodeIn: inbound.depPt,
                                          arrAirportCodeIn: inbound.arrPt,
                                          depDateIn: formatDateToQuery(inbound.depDate),
                                          flightNumberIn: inbound.fltNo.replace(/\D/g, ''),
                                      }
                                    : {}),
                            }}
                            onClose={onCloseSeatMap}
                        />
                    )}
                </OutlineBanner>
            </OutlineBannerContext.Provider>
        </div>
    );
};

export default observer(SeatsAndBags);
