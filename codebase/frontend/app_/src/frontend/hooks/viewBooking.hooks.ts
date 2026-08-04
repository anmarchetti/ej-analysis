import { useEffect, useMemo } from 'react';

import { Tokens } from 'code/tokens';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { getDurationLabel } from 'frontend/utils/accommodation.utils';
import { formatDateL10n, getDaysDifference } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { IBookingInfo, IPreBookingInfo } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';

import { useChatbotTracking } from './useChatbotTracking/useChatbotTracking';
import useStore from './useStore';

export const useViewBookingPageInit = (
    isViewBookingStatusPage?: boolean,
): { booking: Nullable<IBookingInfo>; isLoading: boolean } => {
    const {
        booking,
        isLoading,
        isPostTravelPage,
        loadBooking,
        toggleLoading,
        setUserDetails,
        clearBooking,
        clearViewBookingPayload,
        clearAmendDatesStore,
        isBookingClearRequired,
        isBookingPayloadClearRequired,
        clearAmendTransfersStore,
        clearAmendFlightsStore,
        clearAmendRoomAndBoardStore,
        clearAmendHotelStore,
        setIsViewBookingStatusPage,
        fetchReviews,
        setPassengersStore,
        readRefreshBookingPayloadFromStorage,
        loadBookingTransfers,
        isLoadingTransfers,
        isPreTravelPage,
        isInDestinationPage,
    } = useStore((stores: TStores) => ({
        booking: stores.viewBookingStore.booking,
        isLoading: stores.viewBookingStore.isLoading,
        toggleLoading: stores.viewBookingStore.toggleLoading,
        clearBooking: stores.viewBookingStore.clearBooking,
        fetchReviews: stores.hotelReviewsStore.fetchReviews,
        setPassengersStore: stores.flightsPassengersStore.setPassengersStore,
        readRefreshBookingPayloadFromStorage: stores.viewBookingStore.readRefreshBookingPayloadFromStorage,
        loadBooking: stores.viewBookingStore.loadBooking,
        isBookingPayloadClearRequired: stores.viewBookingStore.isBookingPayloadClearRequired,
        clearViewBookingPayload: stores.viewBookingStore.clearViewBookingPayload,
        ...(isHolidayStore(stores) && {
            isPostTravelPage: stores.viewBookingStore.isPostTravelPage,
            removeFromDataLayer: stores.trackingStore.removeFromDataLayer,
            fireChatbotViewBookingEvent: stores.trackingStore.fireChatbotViewBookingEvent,
            clearAmendDatesStore: stores.amendDatesStore.clearStore,
            clearAmendRoomAndBoardStore: stores.amendRoomAndBoardStore.clearStore,
            clearAmendTransfersStore: stores.amendTransfersStore.clearStore,
            clearAmendFlightsStore: stores.amendFlightsStore.clearStore,
            clearAmendHotelStore: stores.amendHotelStore.clearStore,
            setIsViewBookingStatusPage: stores.viewBookingStore.setIsViewBookingStatusPage,
            setUserDetails: stores.userStore.setUserDetails,
            isBookingClearRequired: stores.viewBookingStore.isBookingClearRequired,
            loadBookingTransfers: stores.viewBookingStore.loadBookingTransfers,
            isLoadingTransfers: stores.viewBookingStore.isLoadingTransfers,
            isPreTravelPage: stores.viewBookingStore.isPreTravelPage,
            isInDestinationPage: stores.viewBookingStore.isInDestinationPage,
        }),
    }));

    useEffect(() => {
        clearAmendDatesStore?.();
        clearAmendTransfersStore?.();
        clearAmendFlightsStore?.();
        clearAmendRoomAndBoardStore?.();
        clearAmendHotelStore?.();

        if (isViewBookingStatusPage) {
            setIsViewBookingStatusPage?.(true);
        }

        if (booking) {
            setPassengersStore(booking);
        }

        const initBooking = async (): Promise<void> => {
            try {
                await setUserDetails?.();

                if (!booking) {
                    readRefreshBookingPayloadFromStorage();

                    await loadBooking();
                }

                toggleLoading(false);
            } catch {
                toggleLoading(false);
            }
        };

        initBooking();

        return () => {
            if (isBookingPayloadClearRequired()) {
                clearViewBookingPayload();
            }

            if (isBookingClearRequired?.()) {
                clearBooking();
            }

            setIsViewBookingStatusPage?.(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const loadTransfers = async (): Promise<void> => {
            if (!booking || (!isPreTravelPage && !isInDestinationPage)) return;

            const { date, lastName } = getBookingPayload(booking);

            if (lastName && date && booking.transfers?.[0]?.type !== TransferType.NoTransfer) {
                await loadBookingTransfers?.(booking.bookingReference, lastName, date);
            }
        };

        loadTransfers();

        if (booking && isViewBookingStatusPage && isPostTravelPage) {
            fetchReviews();
        }
    }, [booking]);

    useChatbotTracking(booking);

    return { booking, isLoading: isLoading || !!isLoadingTransfers };
};

// Get board icon and label
export const useBoard = (booking: IPreBookingInfo): { iconUrl: string | undefined; label: string } =>
    useMemo(() => {
        const accom = booking.package?.accom;
        const boardTypes = (accom?.rooms || []).map(x => x.boardType).filter(b => !!b?.title);
        const label = Array.from(new Set(boardTypes.map(b => b.title))).join(', ');
        const iconUrl = boardTypes.find(b => b.iconUrl)?.iconUrl;

        return { iconUrl, label };
    }, [booking]);

export const useDatesLabel = (
    booking: IPreBookingInfo,
    isTradePortal: boolean,
    getPhrase: (key: string) => string,
    dateFormatOptions?: Partial<{
        holiday: {
            end: string;
            start: string;
        };
        tradePortal: {
            end: string;
            start: string;
        };
    }>,
): string[] =>
    useMemo(() => {
        const {
            holiday: holidayDateParsing = {
                end: 'ddd DD MMM YYYY',
                start: 'ddd DD MMM YYYY',
            },
            tradePortal: tradeDateParsing = {
                end: 'ddd DD MMM YYYY',
                start: 'ddd DD MMM',
            },
        } = dateFormatOptions || {};
        const accom = booking.package?.accom;

        if (!accom?.startDate) {
            return [];
        }

        if (isTradePortal) {
            if (!accom?.endDate) {
                return [];
            }

            const startDate = formatDateL10n(accom.startDate, tradeDateParsing.start);
            const endDate = formatDateL10n(accom.endDate, tradeDateParsing.end);

            return [`${getPhrase(SitecoreDictionary.GlobalsLabelsFrom)} ${startDate} - ${endDate}`];
        }

        const startDate = formatDateL10n(accom.startDate, holidayDateParsing.start);
        const endDate = formatDateL10n(accom.endDate, holidayDateParsing.end);

        return [startDate, endDate];
    }, [booking]);

// Get guests label
export const useGuests = (
    booking: IPreBookingInfo,
    getPhrase: (key: string) => string,
    guestLabel: string,
    guestsLabel: string,
): string =>
    useMemo(() => {
        const guestsAmount = booking.guests.length;
        const label = getPhrase(guestsAmount > 1 ? guestsLabel : guestLabel);

        return Tokenizer.replaceToken(label, Tokens.People, `${guestsAmount}`);
    }, [booking]);

// Get nights label
export const useNightsLabel = (
    startDate: string,
    endDate: string,
    getPhrase: (key: string) => string,
): Nullable<string> =>
    useMemo(() => {
        if (!startDate || !endDate) {
            return null;
        }

        const nights = getDaysDifference(new Date(endDate), new Date(startDate));

        return getDurationLabel(getPhrase, nights);
    }, [startDate, endDate]);
