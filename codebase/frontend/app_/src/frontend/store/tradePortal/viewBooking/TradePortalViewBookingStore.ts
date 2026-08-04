import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import BaseViewBookingStore, { IViewBookingPayload } from 'frontend/store/base/viewBooking/BaseViewBookingStore';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { GuestBookingInfo } from 'models/data/GuestBookingInfo';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import { ACCESS_TO_PRIVATE_BOOKING, BookingErrorCodes, BookingStatus, FRAUD_CODE } from 'models/enum/BookingStatus';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { EventTypes } from 'models/enum/tracking/EventTypes';

export class TradePortalViewBookingStore extends BaseViewBookingStore {
    @observable isLoading: boolean = false;
    @observable isLoadingBookingPrivacy: boolean = false;

    @observable guestBookingInfo: GuestBookingInfo = new GuestBookingInfo();
    @observable errorMessage: Nullable<BookingErrorCodes> = null;

    @observable isAmendSSRLoading: boolean = false;
    @observable isAmendSSRFailed: boolean = false;

    @observable isAmendedFlights: boolean = false;
    @observable isAmendedTransfers: boolean = false;

    constructor(public rootStore: TradePortalRootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @computed get isLeadLoggedIn(): boolean {
        return !!this.booking?.isLoggedInAsLeadPassenger;
    }

    @computed get amendBookingStatuses(): AmendBookingStatus[] {
        return this.booking?.amendmentInfo?.amendBookingStatus || [];
    }

    @computed get isAmendTransfersEligibleByAtcom(): boolean {
        return !!this.booking?.amendmentInfo?.transfer?.amendAllow;
    }

    @computed get isAmendTransfersDisabledByTimeBound(): boolean {
        return this.amendBookingStatuses.includes(AmendBookingStatus.AmendTransfersDisabledByTimeBound);
    }

    @computed get isAmendFlightsEligibleByAtcom(): boolean {
        return !!this.booking?.amendmentInfo?.route;
    }

    @computed get isAmendFlightsDisabledByTimeBound(): boolean {
        return this.amendBookingStatuses.includes(AmendBookingStatus.AmendFlightsDisabledByTimeBound);
    }

    @computed get isAmendSeatsDisabled(): boolean {
        return (
            this.amendBookingStatuses.includes(AmendBookingStatus.AmendSeatsDisabled) ||
            this.amendBookingStatuses.includes(AmendBookingStatus.AmendSeatsDisabledOnSite)
        );
    }

    @action clearGuestBookingInfo = (): void => {
        this.guestBookingInfo.clearData();
        this.booking = null;
        this.changeErrorMessage();
    };

    @action changeErrorMessage = (messageCode?: BookingErrorCodes): void => {
        if (messageCode !== this.errorMessage) {
            this.errorMessage = messageCode || null;
        }
    };

    @action getBooking = async (bookingReference: string, isBookingReload?: boolean): Promise<void> => {
        try {
            this.toggleLoading(true);

            this.changeErrorMessage();
            const result = await bookingService.sendSimpleBookingSearch(bookingReference);

            this.baseUpdateBookingInfo(result);

            if (!isBookingReload) {
                this.handleViewBookingRedirects();
            }

            this.toggleLoading(false);
        } catch (e) {
            switch (e.errorCode) {
                case FRAUD_CODE:
                    this.changeErrorMessage(BookingErrorCodes.Fraud);
                    break;
                case ACCESS_TO_PRIVATE_BOOKING:
                    this.changeErrorMessage(BookingErrorCodes.AccessToPrivateBooking);
                    break;
                default:
                    this.changeErrorMessage(BookingErrorCodes.NotFound);
            }
            runInAction(() => {
                this.booking = null;
            });
        } finally {
            this.toggleLoading(false);
        }
    };

    loadBooking = async (reloadBooking: boolean = false): Promise<void> => {
        let bookingPayload: Nullable<IViewBookingPayload>;

        if (!reloadBooking) {
            bookingPayload = this.viewBookingPayload || this.refreshBookingPayloadFromStorage;
        } else if (this.booking) {
            bookingPayload = getBookingPayload(this.booking);
        }

        if (!bookingPayload?.bookingReference) {
            this.rootStore.routerStore.redirectToTradePortalFindBookingPage();

            return;
        }

        await this.getBooking(bookingPayload.bookingReference, reloadBooking);
    };

    @action clearBooking = (): void => {
        this.baseUpdateBookingInfo(null);
    };

    @action toggleLoading = (state: boolean): void => {
        this.isLoading = state;
    };

    @action toggleLoadingBookingPrivacy = (state: boolean): void => {
        this.isLoadingBookingPrivacy = state;
    };

    @action amendBookingSpecialRequests = async (specialRequests: string[]): Promise<void> => {
        if (!this.booking) return;

        try {
            this.isAmendSSRFailed = false;
            this.isAmendSSRLoading = true;
            const { bookingReference, date, lastName } = getBookingPayload(this.booking);
            const res = await bookingService.amendBookingSpecialRequests(
                bookingReference,
                date,
                lastName,
                specialRequests,
            );

            if (res.data) {
                const newBooking = res.data;

                this.rootStore.trackingStore.trackBookingSpecialRequests(
                    EventTypes.SpecialRequestPb,
                    newBooking,
                    this.booking.specialRequests,
                );

                this.baseUpdateBookingInfo(newBooking);
            }
        } catch (e) {
            runInAction(() => (this.isAmendSSRFailed = true));
        } finally {
            runInAction(() => (this.isAmendSSRLoading = false));
        }
    };

    @action resetAmendSSR = (): void => {
        this.isAmendSSRFailed = false;
        this.isAmendSSRLoading = false;
    };

    @action continueToPay = async (): Promise<void> => {
        if (!this.booking) {
            this.toggleAmendErrorPopup(true);

            return;
        }

        if (!this.rootStore.amendSeatsStore.newSelection) {
            return;
        }

        this.rootStore.amendPaymentStore.initialize();
        this.rootStore.routerStore.redirectToAmendPaymentPage();
    };

    @action handleViewBookingRedirects = (): void => {
        if (
            !!this.rootStore.layoutStore.getSetting(SiteSettings.EnableCancellationTradePortal) &&
            this.booking?.bookingStatus === BookingStatus.Canceled
        ) {
            this.rootStore.routerStore.redirectTo(SitePath.TradePortalViewCancelledBooking);

            return;
        }

        this.rootStore.routerStore.redirectTo(SitePath.TradePortalViewBooking);
    };

    isBookingPayloadClearRequired = (): boolean =>
        SitePath.TradePortalViewBooking !== this.rootStore.routerStore.pathname;
}
