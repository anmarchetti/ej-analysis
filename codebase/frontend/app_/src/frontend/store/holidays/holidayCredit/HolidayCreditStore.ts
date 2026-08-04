import Axios, { CancelTokenSource } from 'axios';
import { action, computed, makeObservable, observable, runInAction, when } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import creditManagementService from 'frontend/services/creditManagement.service';
import { logger } from 'frontend/services/logging';
import { BaseCreditStore } from 'frontend/store/base/credit/BaseCreditStore';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { containsFAndHPromoCode, containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { getWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IBalanceHistory } from 'models/data/IBalanceHistory';
import { IBookingRefundResponse, IMyCreditInfo } from 'models/data/MyCreditInfo';
import { BookingStatus } from 'models/enum/BookingStatus';
import { CreditType } from 'models/enum/CreditType';
import HttpsStatusCodes from 'models/enum/HttpStatusCodes';
import { RefundOption } from 'models/enum/RefundOptions';
import SiteSettings from 'models/enum/SiteSettings';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

export class HolidayCreditStore extends BaseCreditStore {
    private myCreditsCancelSource: CancelTokenSource;

    @observable isRefundSuccessPopupShown: boolean = false;
    @observable recentRefund: Nullable<IBookingRefundResponse>;
    @observable balanceHistory: IBalanceHistory = {};
    @observable isHistoryLoading: boolean = false;
    @observable isCreditLoading: boolean = false;
    @observable confirmPolicy: boolean = false;
    @observable forcePolicyError: boolean = false;
    @observable creditBalance: Nullable<IMyCreditInfo[]> = null;
    @observable marketCredit: Nullable<IMyCreditInfo> = null; // credits data for current market
    @observable hasCreditHistory: boolean = false;
    @observable isCreditEnabledApiSettings: boolean = false;
    @observable selectedRefundType: CreditType;

    constructor(public rootStore: HolidaysRootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @computed get isCreditBookingEnabled(): boolean {
        return !!this.rootStore.layoutStore.getSetting(SiteSettings.EnableCreditBooking);
    }

    @computed get isOneTimeUseCreditEnabled(): boolean {
        return !!this.rootStore.layoutStore.getSettingAsBoolean(SiteSettings.EnableOneTimeUseCredit);
    }

    @computed get showCreditExpiryInfoPopupBeforeCancellation(): boolean {
        return !!this.rootStore.layoutStore.getSettingAsBoolean(
            SiteSettings.ShowCreditExpiryInfoPopupBeforeCancellation,
        );
    }

    @action initializeCreditConfirmPage = (): void => {
        const refund = this.booking?.refund;

        if (!this.isCreditBookingEnabled || !refund || !(refund.credit.isEligible || refund.refund.isEligible)) {
            this.rootStore.routerStore.redirectToViewBookingsPage();

            return;
        }

        this.isCancellationSummaryIsLoading = false;
        this.isCreditBookingFailed = !!this.booking?.cancellationIsBlocked;
        this.isCreditBookingLoading = false;
        this.confirmPolicy = false;
        this.forcePolicyError = false;
        this.recentRefund = null;
        this.selectedRefundType = refund.credit.isEligible ? CreditType.Credit : CreditType.Refund;
    };

    @action initializeFromPayload = async (): Promise<void> => {
        const bookingPayload = getWebStorageItem(WebStorageKeys.BookingPayload, true, sessionStorage);

        if (!bookingPayload) {
            this.rootStore.routerStore.redirectToViewBookingsPage();

            return;
        }

        if (!this.booking) {
            await this.rootStore.viewBookingStore.getBooking(bookingPayload, true);

            const { booking } = this.rootStore.viewBookingStore;

            if (!booking) {
                this.rootStore.routerStore.redirectToViewBookingsPage();

                return;
            }

            if (booking.bookingStatus === BookingStatus.Canceled) {
                this.rootStore.routerStore.redirectTo(this.rootStore.layoutStore.viewBookingLinks.cancelled);

                return;
            }

            this.booking = booking;
        }
    };

    @action initializeCancellation = async (): Promise<void> => {
        this.cancellationSummary = undefined;
        this.booking = this.rootStore.viewBookingStore.booking;

        if (
            this.booking?.isExternalAgency ||
            !this.booking?.amendmentInfo?.canBookingCancelled ||
            (!this.canBeBookingCancelledFromWebsite && !this.booking.isDestinationRulesApplied)
        ) {
            this.isCancellationSummaryIsLoading = false;

            return;
        }

        this.initializeCancellationSummaryFetch();
    };

    @action initializeCancellationSummaryFetch = async (): Promise<void> => {
        if (this.booking?.bookingStatus === BookingStatus.Canceled) {
            return;
        }

        if (!this.isCreditBookingEnabled) {
            this.rootStore.routerStore.redirectToViewBookingsPage();

            return;
        }

        await this.fetchCancellationSummary(false);

        this.confirmPolicy = false;
        this.forcePolicyError = false;
        this.selectedRefundOTUC = this.cancellationSummary?.refunds[0];
    };

    @action cancelBooking = async (): Promise<void> => {
        if (!this.cancellationSummary || !this.booking || this.booking.cancellationIsBlocked) {
            return;
        }

        this.isCreditBookingFailed = false;
        this.isCreditBookingLoading = true;

        try {
            const bookingPayload = getBookingPayload(this.booking);
            const { bookingReference, date, lastName } = bookingPayload;

            await bookingService.cancelBooking(
                this.selectedRefundOTUC?.refundOption || RefundOption.None,
                this.cancellationSummary.refundBreakdownValidationHash,
                bookingReference,
                lastName,
                date,
            );

            await this.rootStore.engageStore.sendOrderCancelEvent(bookingPayload);

            runInAction(async () => {
                await this.rootStore.viewBookingStore.getBooking(bookingPayload);
            });
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

    @action creditBooking = async (isCreditOnlyRefund: boolean): Promise<void> => {
        if (!this.booking) {
            return;
        }

        this.isCreditBookingFailed = false;
        this.isCreditBookingLoading = true;

        try {
            const bookingPayload = getBookingPayload(this.booking);
            const { bookingReference, date, lastName } = bookingPayload;

            const res = (
                await bookingService.creditBooking(
                    isCreditOnlyRefund ? CreditType.Credit : CreditType.Refund,
                    bookingReference,
                    lastName,
                    date,
                )
            )?.data;

            runInAction(async () => {
                this.rootStore.routerStore.redirectToHolidayCreditPage();
                this.toggleCreditSuccessPopup(true);
                this.recentRefund = res;
            });
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

    @action clearRecentRefund = (): void => {
        this.recentRefund = null;
        this.booking = null;
        this.toggleCreditSuccessPopup(false);
    };

    @action toggleCreditSuccessPopup = (state: boolean): void => {
        this.isRefundSuccessPopupShown = state;
    };

    @computed get shouldConfirmPolicy(): boolean {
        return this.forcePolicyError && this.confirmPolicy === false;
    }

    @action togglePolicy = (state: boolean): void => {
        this.confirmPolicy = state;
    };

    @action onForcePolicyError = (state: boolean): void => {
        this.forcePolicyError = state;
    };

    @action fetchBalanceHistory = async (throwError = false): Promise<void> => {
        try {
            this.isHistoryLoading = true;

            const result = await creditManagementService.loadBalanceHistory();

            runInAction(() => {
                this.isHistoryLoading = false;
                this.balanceHistory = result;
            });
        } catch (e) {
            logger.info(`Get balance history data error`);
            runInAction(() => {
                this.isHistoryLoading = false;
            });

            if (throwError) {
                throw e;
            }
        }
    };

    @action fetchMyCreditBalance = async (throwError = false, fromCache: boolean = false): Promise<void> => {
        try {
            const { isPaymentPage, isPayRemainingBalancePage, isBookingConfirmationPage } = this.rootStore.routerStore;

            /** Disable cache on some specific pages */
            const disableCache = isPaymentPage() || isPayRemainingBalancePage() || isBookingConfirmationPage();

            const getValFromCache = fromCache && !disableCache;

            if (this.isCreditLoading) {
                await when(() => this.isCreditLoading === false);

                return;
            }

            // cancel previous request if there is one
            if (this.myCreditsCancelSource) {
                this.myCreditsCancelSource.cancel();
            }

            this.myCreditsCancelSource = Axios.CancelToken.source();
            this.isCreditLoading = true;
            const result = await creditManagementService.loadCreditBalance(this.myCreditsCancelSource, getValFromCache);

            runInAction(() => {
                this.isCreditEnabledApiSettings = result.every(item => item.creditIsEnabled);
                this.isCreditLoading = false;
                this.creditBalance = result;
                this.marketCredit = result.find(item => item.currency === this.rootStore.marketStore.currency);
                this.hasCreditHistory = result.some(item => item.hasCreditHistory);
                this.rootStore.trackingStore.trackCreditOnAccount(this.creditBalance);
            });
        } catch (e) {
            if (!Axios.isCancel(e)) {
                logger.info(`Get credit balance error`);

                if (throwError) {
                    throw e;
                }
            }
        } finally {
            runInAction(() => {
                this.isCreditLoading = false;
            });
        }
    };

    @action clearStore = (): void => {
        this.balanceHistory = {};
        this.creditBalance = null;
        this.isHistoryLoading = false;
        this.isCreditLoading = false;
        this.hasCreditHistory = false;
    };

    @action setCreditEnabledApiSettings = (state: boolean): void => {
        this.isCreditEnabledApiSettings = state;
    };

    @action initialize = async (): Promise<void> => {
        const isLoggedIn = await this.rootStore.userStore.checkIfUserLoggedIn();

        if (!this.isCreditBookingEnabled || !isLoggedIn) {
            this.rootStore.routerStore.redirectToLoginPage(true);

            return;
        }

        this.clearStore();

        try {
            await Promise.all([this.fetchBalanceHistory(true), this.fetchMyCreditBalance(true, true)]);
        } catch (e) {
            // if we got unauthorized error, it means that user is not logged in, then we should redirect him to login page
            // this is required when user has many tabs and logs out in one of them
            if (e.response?.status === HttpsStatusCodes.Unauthorized) {
                await this.rootStore.userStore.onLogout(true);
                this.rootStore.routerStore.redirectToLoginPage(true);
            }
        }
    };

    @action setSelectedRefundType = (type: CreditType): void => {
        this.selectedRefundType = type;
    };

    @computed get isLuxuryPackage(): boolean {
        return containsLuxuryPromoCode(this.booking?.promoCollections || []);
    }

    @computed get isFlightAndHotelPackage(): boolean {
        return containsFAndHPromoCode(this.booking?.promoCollections || []);
    }

    @computed get isFlightExternal(): boolean {
        return !!this.booking?.package?.transport?.routes[0]?.isExt;
    }

    @computed get isEligibleForCreditRefund(): boolean {
        return this.isOneTimeUseCreditEnabled
            ? !!this.cancellationSummary?.refunds.find(refund => refund.refundOption === RefundOption.Credit)
            : this.booking?.refund?.credit?.isEligible || false;
    }

    @computed get isEligibleForOriginalPaymentRefund(): boolean {
        return this.isOneTimeUseCreditEnabled
            ? !!this.cancellationSummary?.refunds.find(refund => refund.refundOption === RefundOption.OriginalPayment)
            : this.booking?.refund?.refund?.isEligible || false;
    }

    @computed get showCreditExpiresSoonBannerWithinDays(): number {
        return this.rootStore.layoutStore.getSetting(SiteSettings.ShowCreditExpiresSoonBannerWithinDays) || 0;
    }
}
