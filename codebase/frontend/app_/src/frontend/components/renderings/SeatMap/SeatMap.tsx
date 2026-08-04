import { FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import Script from 'next/script';

import { envPublic } from 'code/env';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { normalizeSeatMapFields } from 'frontend/utils/seatMap.utils';
import { getWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import {
    ISeatMapWidgetTrackingEvent,
    ISitTogetherClickedData,
    ISitTogetherImpressionData,
    TrackingEventCodes,
} from 'models/data/ISeatMapWidgetTrackingEvent';
import { ISeatMapWidgetValue } from 'models/data/ISeatMapWidgetValue';
import { ApiErrors } from 'models/enum/ApiErrors';
import { NavigationActionMode } from 'models/enum/NavigationActionMode';
import { SeatMapFlightDirection } from 'models/enum/SeatMapFlightDirection';
import { SeatType } from 'models/enum/SeatType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import FullScreenPopup from 'frontend/components/common/FullScreenPopup/FullScreenPopup';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import SeatMapSpinner from 'frontend/components/common/SeatMapSpinner';

import CancellationPopUp from './components/CancellationPopUp/CancellationPopUp';
import { ISeatMapFields } from './components/ISeatMapFields';
import NavigationActionsBlock from './components/NavigationActionsBlock/NavigationActionsBlock';
import SeatMapContent from './components/SeatMapContent/SeatMapContent';
import {
    getBackButtonLabel,
    getSitTogetherWebStorageKeyFromDirection,
    getSitTogetherWebStorageKeyValue,
} from './SeatMap.utils';

interface ISeatMapWidgetProps {
    adultsCount: number;
    adultsWithInfantsCount: number;
    arrAirportCodeOut: string;
    childrenCount: number;
    depAirportCodeOut: string;
    depDateOut: string;
    flightNumberOut: string;
    arrAirportCodeIn?: string;
    depAirportCodeIn?: string;
    depDateIn?: string;
    flightNumberIn?: string;
    isPostBooking?: boolean; // true on View Booking page only
}

export interface ISeatMapProps extends ISitecoreComponent<ISeatMapFields> {
    onClose: () => void;
    props: ISeatMapWidgetProps;
}

const SeatMap: FC<ISeatMapProps> = ({ fields, props, onClose }) => {
    const [isCancelPopupOpened, setIsCancelPopupOpened] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [ready, setReady] = useState(false);
    const [active, setActive] = useState(false);
    const [value, setValue] = useState<ISeatMapWidgetValue>({
        direction: SeatMapFlightDirection.Outbound,
        selectedSeatLength: 0,
        actionMode: NavigationActionMode.EmptySelection,
        isSelectionEmpty: false,
        isSelectionIncorrect: false,
        isSelectionImpossible: false,
    });

    const { isPostBooking = false } = props;

    const {
        seatsResponse,
        seatsMapTimeBannerAutoHide,
        seatMapInitialSelection,
        onSelectSeats,
        trackSeatsPageLoad,
        onclearSelectedSeatsUnavailableError,
        isProcessingSeatSelection,
        setOpenSeatMapForced,
        setSeatWidgetWasLoadedOnce,
        seatWidgetWasLoadedOnce,
        isTradePortal,
        isPricesHidden,
        isScreenLarge,
        getPhrase,
        children,
        trackSeatMapTabSwitching,
        validatedSelectedSeats,
        isAmendDatesSummaryPage,
        trackSeatMapSitTogetherClick,
        trackSeatMapSitTogetherImpression,
        isLuxuryPackage,
    } = useStore((stores: TStores) => ({
        seatsResponse: stores.seatMapStore.seatsResponse,
        seatsMapTimeBannerAutoHide: stores.seatMapStore.seatsMapTimeBannerAutoHide,
        seatMapInitialSelection: stores.seatMapStore.seatMapInitialSelection,
        onSelectSeats: stores.seatMapStore.onSelectSeats,
        isProcessingSeatSelection: stores.seatMapStore.isProcessingSeatSelection,
        onclearSelectedSeatsUnavailableError: stores.seatMapStore.onclearSelectedSeatsUnavailableError,
        setOpenSeatMapForced: stores.seatMapStore.setOpenSeatMapForced,
        setSeatWidgetWasLoadedOnce: stores.seatMapStore.setSeatWidgetWasLoadedOnce,
        seatWidgetWasLoadedOnce: stores.seatMapStore.seatWidgetWasLoadedOnce,
        isTradePortal: stores.layoutStore.isTradePortal,
        isPricesHidden: isTradeStore(stores) && stores.layoutStore.isExtrasPage && stores.layoutStore.isPricesHidden,
        trackSeatsPageLoad: stores.trackingStore.trackSeatsPageLoad,
        trackSeatMapTabSwitching: stores.trackingStore.trackSeatMapTabSwitching,
        isScreenLarge: stores.appStore.isScreenLarge,
        getPhrase: stores.layoutStore.getPhrase,
        children: stores.flightsPassengersStore.children,
        validatedSelectedSeats: stores.seatMapStore.validatedSelectedSeats,
        isAmendDatesSummaryPage: stores.layoutStore.isAmendDatesSummaryPage,
        trackSeatMapSitTogetherClick: stores.trackingStore.trackSeatMapSitTogetherClick,
        trackSeatMapSitTogetherImpression: stores.trackingStore.trackSeatMapSitTogetherImpression,
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage || stores.viewBookingStore.isLuxuryPackage,
    }));

    const childrenInfo = children?.map(child => ({
        passengerId: child.inboundPassenger.passengerId,
        age: child.inboundPassenger.age,
    }));

    useEffect(() => {
        if (active && window.SeatsMapWidget) {
            if (!validatedSelectedSeats.some(selectedSeat => selectedSeat.seats)) {
                setLoaded(true);
            }

            window.SeatsMapWidget.clearChangeListeners();
            window.SeatsMapWidget.on('change', (currentValue: ISeatMapWidgetValue) => {
                setValue({
                    ...currentValue,
                });
                setLoaded(true);
            });

            window.SeatsMapWidget.clearTrackingEventListeners();
            window.SeatsMapWidget.on('trackingEvent', (trackingEvent: ISeatMapWidgetTrackingEvent): void => {
                switch (trackingEvent.code) {
                    case TrackingEventCodes.SitTogetherClicked:
                        onSitTogetherClicked(trackingEvent.data as ISitTogetherClickedData);
                        break;
                    case TrackingEventCodes.SitTogetherImpression:
                        onSitTogetherImpression(trackingEvent.data as ISitTogetherImpressionData);
                        break;
                }
            });
        }
    }, [active, trackSeatMapSitTogetherClick, trackSeatMapSitTogetherImpression, validatedSelectedSeats]);

    // Track seats page load event on every tab change
    useEffect(() => {
        if (value.direction) {
            trackSeatsPageLoad(value.direction);
        }
    }, [value.direction, trackSeatsPageLoad]);

    useEffect(() => {
        if (seatWidgetWasLoadedOnce && window.SeatsMapWidget) {
            const fieldsForWidget = {
                ...fields,
                PerPersonLabel: { value: getPhrase(SitecoreDictionary.GlobalsPriceLabelsPerPerson) },
                IncludedLabel: { value: getPhrase(SitecoreDictionary.LuggageLabelsIncluded) },
            } as ISeatMapFields;

            const normalizedFields = normalizeSeatMapFields(fieldsForWidget);

            window.SeatsMapWidget.setTranslations(normalizedFields);
        }
    }, [seatWidgetWasLoadedOnce, fields]);

    useEffect(() => {
        if (seatWidgetWasLoadedOnce && ready && !active) {
            window.SeatsMapWidget?.setApiUrl(`${envPublic.WEBAPI_URL}/v1.0`);

            const includedSeatCategories = isLuxuryPackage ? [SeatType.Standard, SeatType.RearStandard] : [];
            const options = {
                selector: '#seat-map',
                hideCtaFlow: true,
                shouldSeatAll: true,
                initialSelection: seatMapInitialSelection,
                timeBannerAutoHide: seatsMapTimeBannerAutoHide,
                responseOverride: seatsResponse,
                isPostBooking,
                isTradePortal,
                isPricesHidden,
                trackSeatMapTabSwitching,
                includedSeatCategories,
                isLuxury: isLuxuryPackage,
            };

            window.SeatsMapWidget?.startSeatSelection(
                props.adultsCount,
                props.childrenCount,
                props.adultsWithInfantsCount,

                props.depAirportCodeOut,
                props.arrAirportCodeOut,
                props.depDateOut,
                props.flightNumberOut,

                props?.depAirportCodeIn,
                props?.arrAirportCodeIn,
                props?.depDateIn,
                props?.flightNumberIn,

                options,
                childrenInfo,
            );
            setActive(true);
            setOpenSeatMapForced(false);
        }
    }, [
        ready,
        active,
        props,
        seatsMapTimeBannerAutoHide,
        seatMapInitialSelection,
        seatsResponse,
        setOpenSeatMapForced,
        isPostBooking,
        seatWidgetWasLoadedOnce,
        isTradePortal,
        isPricesHidden,
        childrenInfo,
    ]);

    if (!fields) {
        return null;
    }

    const {
        BtnCancel,
        SpinnerHeader,
        LoadingScreenTitle,
        CancellationPopUpBackButton,
        CancellationPopUpContinueButton,
        CancellationPopUpDescription,
        CancellationPopUpTitle,
    } = fields;
    const totalPassengers = props.adultsCount + props.childrenCount; // INFO: here adults already included count of passengers with and without infants

    const backToLabel = getBackButtonLabel(fields, isAmendDatesSummaryPage, isPostBooking);

    const onError = e => {
        if (e.errorCode === ApiErrors.SelectedSeatsNotAvailable) {
            // this has to be detach, as seat clearance should be performed after modal closes;
            onclearSelectedSeatsUnavailableError(() => window.SeatsMapWidget.clearAllSeats());
        }
    };

    const onPopupClose = () => {
        const isSeatsSelected = window.SeatsMapWidget.checkIfNewSeatsSelected();

        if (isSeatsSelected) {
            setIsCancelPopupOpened(true);
        } else {
            onClose();
        }
    };

    const onSitTogetherClicked = (trackingEvent: ISitTogetherClickedData) => {
        trackSeatMapSitTogetherClick(trackingEvent);
        storeSitTogetherInSessionStorage(trackingEvent);
    };

    const onSitTogetherImpression = (trackingEvent: ISitTogetherImpressionData) => {
        trackSeatMapSitTogetherImpression(trackingEvent);
        storeSitTogetherInSessionStorage(trackingEvent);
    };

    const storeSitTogetherInSessionStorage = (trackingEvent: ISitTogetherClickedData | ISitTogetherImpressionData) => {
        const storageKey = getSitTogetherWebStorageKeyFromDirection(trackingEvent);
        const previousValue = getWebStorageItem(storageKey, false, sessionStorage);

        const storageValue = getSitTogetherWebStorageKeyValue(trackingEvent, previousValue);
        setWebStorageItem(storageKey, storageValue, sessionStorage);
    };

    return (
        <>
            {(!window.SeatsMapWidget || !loaded) && <SeatMapSpinner header={SpinnerHeader?.value} />}
            {isProcessingSeatSelection && isPostBooking && <OverlaySpinner header={LoadingScreenTitle?.value} />}
            <FullScreenPopup
                ariaLabel={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsPopup)}
                onClose={onPopupClose}
                fields={{
                    BackToLabel: backToLabel,
                    BtnCancel: BtnCancel,
                }}
                navigationActionBlock={
                    <NavigationActionsBlock
                        fields={fields}
                        totalPassengers={totalPassengers}
                        widgetOutputData={value}
                        onSelectSeats={widgetData => onSelectSeats(widgetData, onClose, onError)}
                    />
                }
                isMobile={!isScreenLarge}
                isInitialized={isProcessingSeatSelection}
            >
                <SeatMapContent {...fields} />
                {isCancelPopupOpened && (
                    <CancellationPopUp
                        CancellationPopUpBackButton={CancellationPopUpBackButton}
                        CancellationPopUpContinueButton={CancellationPopUpContinueButton}
                        CancellationPopUpTitle={CancellationPopUpTitle}
                        CancellationPopUpDescription={CancellationPopUpDescription}
                        setIsCancelPopupOpened={setIsCancelPopupOpened}
                        onSeatMapClose={onClose}
                    />
                )}
            </FullScreenPopup>
            <Script
                src={envPublic.SEAT_MAP_WIDGET_URL}
                onLoad={(): void => {
                    if (!seatWidgetWasLoadedOnce) {
                        setSeatWidgetWasLoadedOnce();
                    }
                }}
                onReady={(): void => {
                    if (!ready) {
                        setReady(true);
                    }
                }}
            />
        </>
    );
};

export default observer(SeatMap);
