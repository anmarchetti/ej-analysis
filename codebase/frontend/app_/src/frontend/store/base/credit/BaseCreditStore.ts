import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import { TRootStore } from 'frontend/store/IStores';
import { buildFlightPlusHotelUrl } from 'frontend/utils/url.utils';
import { getBookingPayload, getDaysBeforeDeparture } from 'frontend/utils/viewBooking.utils';
import { setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ICancellationSummaryResponse, IRefundOption } from 'models/data/MyCreditInfo';
import { GuestType } from 'models/enum/GuestType';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

export class BaseCreditStore {
    @observable.ref booking: Nullable<IBookingInfo> = null;
    @observable isCancellationSummaryIsLoading: boolean = true;
    @observable isCancellationSummaryFailed: boolean = false;
    @observable cancellationSummary: Nullable<ICancellationSummaryResponse> = undefined;
    @observable selectedRefundOTUC: IRefundOption | undefined;
    @observable isCreditBookingFailed: boolean = false;
    @observable isCreditBookingLoading: boolean = false;
    @observable prevPagePath: Nullable<SitePath | string> = undefined;

    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    @action startBookingCancellation = (): void => {
        // Need to support redirection from Micro app
        setWebStorageItem(
            WebStorageKeys.BookingPayload,
            getBookingPayload(this.rootStore.viewBookingStore.booking as IBookingInfo),
            sessionStorage,
        );

        this.booking = this.rootStore.viewBookingStore.booking;
        const { isFlightPlusHotelFunnel } = this.rootStore.queryParamsStore;
        this.rootStore.routerStore.redirectTo(
            isFlightPlusHotelFunnel ? buildFlightPlusHotelUrl(SitePath.CancelBooking) : SitePath.CancelBooking,
        );
    };

    @action setPrevPagePath = (path: SitePath | string): void => {
        this.prevPagePath = path;
    };

    @action setSelectedRefundOTUC = (refund: IRefundOption): void => {
        this.selectedRefundOTUC = refund;
    };

    @computed get daysBeforeDepartureWhenBookingCanBeCancelled(): number {
        return this.rootStore.layoutStore.getSettingAsNumber(
            SiteSettings.BookingCanBeCancelledXOrMoreDaysBeforeDeparture,
        );
    }

    @computed get canBeBookingCancelledFromWebsite(): boolean {
        if (!this.booking) {
            return false;
        }

        return (getDaysBeforeDeparture(this.booking) ?? 0) >= this.daysBeforeDepartureWhenBookingCanBeCancelled;
    }

    @action clearFetchCancellationSummary = (): void => {
        this.isCancellationSummaryFailed = false;
        this.isCancellationSummaryIsLoading = true;
    };

    @action fetchCancellationSummary = async (isTradePortal: boolean = false): Promise<void> => {
        if (!this.booking || !!this.cancellationSummary) {
            this.isCancellationSummaryIsLoading = false;

            return;
        }

        try {
            this.isCancellationSummaryIsLoading = true;
            const bookingPayload = getBookingPayload(this.booking);
            const { bookingReference, date, lastName } = bookingPayload;

            const result = await bookingService.getCancellationSummary(bookingReference, lastName, date, isTradePortal);

            runInAction(() => {
                this.isCancellationSummaryIsLoading = false;
                this.isCancellationSummaryFailed = false;
                this.cancellationSummary = result;
            });
        } catch (e) {
            logger.error({ e });
            runInAction(() => {
                this.isCancellationSummaryFailed = true;
            });
        } finally {
            runInAction(() => {
                this.isCancellationSummaryIsLoading = false;
            });
        }
    };

    @computed get depositPerPassenger(): number {
        if (this.booking) {
            const {
                paymentInfo: { depositPrice },
                guests,
            } = this.booking;
            const adultsAndChildren = guests.filter(g => g.type !== GuestType.Infant).length;

            return adultsAndChildren > 0 ? depositPrice / adultsAndChildren : 0;
        }

        return 0;
    }

    @action clearCreditStore = (): void => {
        this.selectedRefundOTUC = undefined;
        this.cancellationSummary = undefined;
        this.isCancellationSummaryFailed = false;
        this.isCancellationSummaryIsLoading = true;
        this.isCreditBookingFailed = false;
        this.isCreditBookingLoading = false;
        this.booking = null;
        this.prevPagePath = undefined;
    };
}
