import { action, makeObservable, runInAction } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import logger from 'frontend/services/logging/logger.service';
import { BaseCreditStore } from 'frontend/store/base/credit/BaseCreditStore';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { getWebStorageItem } from 'frontend/utils/webStorage.utils';
import { BookingStatus } from 'models/enum/BookingStatus';
import { RefundOption } from 'models/enum/RefundOptions';
import SitePath from 'models/enum/SitePath';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

export class TradePortalCreditStore extends BaseCreditStore {
    constructor(public rootStore: TradePortalRootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @action initializeCancellation = async (): Promise<void> => {
        this.cancellationSummary = undefined;
        this.booking = this.rootStore.viewBookingStore.booking;

        if (!this.booking?.amendmentInfo?.canBookingCancelled || !this.canBeBookingCancelledFromWebsite) {
            this.isCancellationSummaryIsLoading = false;

            return;
        }

        this.initializeCancellationSummaryFetch();
    };

    @action initializeCancellationSummaryFetch = async (): Promise<void> => {
        if (this.booking?.bookingStatus === BookingStatus.Canceled) {
            return;
        }

        await this.fetchCancellationSummary(true);

        this.selectedRefundOTUC = this.cancellationSummary?.refunds[0];
    };

    @action initializeFromPayload = async (): Promise<void> => {
        const bookingPayload = getWebStorageItem(WebStorageKeys.BookingPayload, true, sessionStorage);

        if (!bookingPayload) {
            this.rootStore.routerStore.redirectToTradePortalFindBookingPage();

            return;
        }

        if (!this.booking) {
            await this.rootStore.viewBookingStore.getBooking(bookingPayload.bookingReference, true);

            const { booking } = this.rootStore.viewBookingStore;

            if (!booking) {
                this.rootStore.routerStore.redirectToTradePortalFindBookingPage();

                return;
            }

            runInAction(() => {
                this.booking = booking;
            });

            if (booking.bookingStatus === BookingStatus.Canceled) {
                this.rootStore.routerStore.redirectTo(SitePath.TradePortalViewCancelledBooking);

                return;
            }
        }
    };

    @action cancelBooking = async (): Promise<void> => {
        if (!this.cancellationSummary || !this.booking) {
            return;
        }

        this.isCreditBookingFailed = false;
        this.isCreditBookingLoading = true;

        try {
            const bookingPayload = getBookingPayload(this.booking);
            const { bookingReference, date, lastName } = bookingPayload;
            const agentInfo = this.rootStore.userStore.agentInfo;

            await bookingService.cancelBooking(
                this.selectedRefundOTUC?.refundOption || RefundOption.None,
                this.cancellationSummary.refundBreakdownValidationHash,
                bookingReference,
                lastName,
                date,
                true,
                agentInfo,
            );

            await this.rootStore.engageStore.sendOrderCancelEvent(bookingPayload);

            await this.rootStore.viewBookingStore.getBooking(bookingReference);
        } catch (e) {
            logger.error({ e });
            runInAction(() => {
                this.isCreditBookingFailed = true;
            });
        } finally {
            runInAction(() => {
                this.isCreditBookingLoading = false;
            });
        }
    };
}
