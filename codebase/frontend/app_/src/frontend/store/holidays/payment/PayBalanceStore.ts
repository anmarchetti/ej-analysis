import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { isDefined } from 'frontend/utils/object.utils';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { fillMDFor3DS1, getBrowserInfo, removeCardNumberFor3DS2 } from 'frontend/utils/payment.utls';
import {
    getTransaction,
    getTransactionId,
    isTransactionDone,
    isTransactionProcessing,
    setTransactionDone,
    setTransactionProcessing,
    startNewTransaction,
} from 'frontend/utils/paymentTransaction';
import { submitForm } from 'frontend/utils/submitForm';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { ApiError } from 'models/data/ApiError';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { BillingInfo } from 'models/data/payment/BillingInfo';
import { IPayDetailsFullWithApplePay, TPayDetails } from 'models/data/payment/IPayDetails';
import { IPaymentAuthorization } from 'models/data/payment/IPaymentAuthorization';
import { IThreeDSData } from 'models/data/payment/IThreeDSData';
import { ApiErrors } from 'models/enum/ApiErrors';
import SitePath from 'models/enum/SitePath';
import { SubmitPayload } from 'models/enum/SubmitPayload';

import { cancelPaymentError, commitBookingError } from './payment-failures.config';

export interface IPayBalancePayload {
    bookingReference: string;
    date: string;
    lastName: string;
    billingInfo?: BillingInfo;
    isFromCheckAndConfirm?: boolean;
}

export interface IPayBalanceInitialState {
    payBalancePayload: IPayBalancePayload;
}
export class PayBalanceStore {
    @observable payBalancePayload: IPayBalancePayload;

    @observable.ref booking: IBookingInfo;
    @observable isPaying: boolean = false;
    @observable isPaySuccess: boolean = false;
    @observable remainingAmount = 0;
    @observable isAmountPayValid: boolean = true;
    @observable amountForPayInFocus: boolean = false;
    @observable paidDetails: TPayDetails | IPayDetailsFullWithApplePay | undefined = undefined;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    public serialize(): IPayBalanceInitialState {
        return {
            payBalancePayload: toJS(this.payBalancePayload),
        };
    }

    public deserialize(initialState?: IPayBalanceInitialState): void {
        if (initialState) {
            this.payBalancePayload = initialState.payBalancePayload;
        }
    }

    @computed get canPay(): boolean {
        return this.rootStore.payStore.canPay && this.isAmountPayValid && this.rootStore.payStore.amount > 0;
    }

    @computed get onPaymentValidation(): boolean {
        return this.rootStore.payStore.isBillingInfoValid;
    }

    @computed get isFromCheckAndConfirm(): boolean {
        if (!this.payBalancePayload) {
            return false;
        }

        return !!this.payBalancePayload.isFromCheckAndConfirm;
    }

    @action toggleFocusAmountForPay = (state: boolean) => {
        this.amountForPayInFocus = state;
    };

    @action onAmountPayValidChange = (isValid: boolean) => {
        this.isAmountPayValid = isValid;
    };

    @action initialize = async (isCreditShown = false) => {
        const { payStore, holidayCreditStore } = this.rootStore;

        payStore.clearStore();

        if (!this.payBalancePayload) {
            this.rootStore.routerStore.redirectToHomePage();

            return;
        }

        try {
            const bookingRes = await bookingService.viewBooking(
                this.payBalancePayload.date,
                this.payBalancePayload.bookingReference,
                this.payBalancePayload.lastName,
            );
            const booking = bookingRes.data;
            payStore.setCurrency(booking.paymentInfo.currency);

            // Allow use credits if it's enabled in sitecore settings and logged-in user is lead passenger (EJH-16067)
            const isUseCreditAllowed =
                isCreditShown && holidayCreditStore.isCreditBookingEnabled && booking?.isLoggedInAsLeadPassenger;

            // need to set currency before getCredit because it's used inside getCredit func
            payStore.setCurrency(booking.paymentInfo.currency);

            if (isUseCreditAllowed) {
                await payStore.getCredit();
            }

            runInAction(() => {
                this.booking = booking;
                this.rootStore.bookingStore.extraLuggage.setExtraLuggageInfo(this.booking.extraLuggageInfo);
                this.remainingAmount = this.booking.paymentInfo.balanceDueAmount;
                payStore.setAmount(this.booking.paymentInfo.balanceDueAmount);
                payStore.setIsUseCreditAllowed(isUseCreditAllowed);

                if (this.payBalancePayload.billingInfo) {
                    const billingInfo = this.payBalancePayload.billingInfo;
                    payStore.setBillingInfo(
                        billingInfo.fullName,
                        billingInfo.address,
                        billingInfo.city,
                        billingInfo.postCode,
                        billingInfo.address2,
                    );
                }
            });

            const transaction = getTransaction();

            if (
                isDefined(transaction) &&
                this.payBalancePayload.bookingReference === transaction.q &&
                (isTransactionDone(transaction) || (this.canPay && isTransactionProcessing(transaction)))
            ) {
                if (isTransactionProcessing(transaction)) {
                    this.payRemainingBalance(undefined, true);
                } else {
                    this.goBackToViewBooking();
                }
            }
        } catch (e) {
            this.rootStore.routerStore.redirectToHomePage();
        }
    };

    @action reinitializeAfterLogin = async (isCreditShown = false) => {
        try {
            const bookingRes = await bookingService.viewBooking(
                this.payBalancePayload.date,
                this.payBalancePayload.bookingReference,
                this.payBalancePayload.lastName,
            );
            const booking = bookingRes.data;

            // Allow use credits if it's enabled in sitecore settings and logged-in user is lead passenger (EJH-16067)
            const isUseCreditAllowed =
                isCreditShown &&
                this.rootStore.holidayCreditStore.isCreditBookingEnabled &&
                booking?.isLoggedInAsLeadPassenger;

            runInAction(() => {
                this.booking = booking;
                this.rootStore.payStore.setIsUseCreditAllowed(isUseCreditAllowed);
            });
        } catch (e) {}
    };

    @action onForceErrors = (state: boolean) => {
        this.rootStore.payStore.forceFieldErrors = state;

        if (state && !this.isAmountPayValid) {
            this.toggleFocusAmountForPay(true);

            return;
        }

        this.rootStore.payStore.onForceErrors(true);
    };

    @action payRemainingBalance = async (threeDSData?: IThreeDSData, force?: boolean) => {
        const { payStore } = this.rootStore;
        const { setPaymentAuthorization, clearCardInfo, setSessionId, clearUI } = payStore;

        this.paidDetails = undefined;

        try {
            // TODO if request has errors for some reason finally part is called after payRemainingBalance is called from iFrame component
            const hasErrors =
                threeDSData?.authenticationError ||
                threeDSData?.challengeError ||
                threeDSData?.fingerprintError ||
                threeDSData?.fingerprintTimeout;

            if (!force && (this.isPaying || !this.canPay) && !hasErrors) {
                if (!this.canPay) {
                    this.onForceErrors(true);
                }

                return;
            }

            const payBody: any = {
                paymentInfo: {
                    ...payStore.paymentInfo,
                },
                browserInfo: {
                    ...getBrowserInfo(this.rootStore.layoutStore.lang),
                },
                bookingReference: this.payBalancePayload.bookingReference,
                lastName: this.payBalancePayload.lastName,
                date: this.payBalancePayload.date,
            };

            this.isPaying = true;
            clearUI(false);

            payBody.sessionId = payStore.sessionId || undefined;

            if (threeDSData?.threeDSEventType) {
                const threeDSServerTransID = payStore.threeDSServerTransID;

                const {
                    transactionReference,
                    md,
                    paRes,
                    issuerUrl,
                    challengeComplete,
                    bookingReference,
                    requestId,
                    sessionId,
                    transStatus,
                    // 3DS errors
                    authenticationError,
                    fingerprintError,
                    fingerprintTimeout,
                    challengeError,
                } = threeDSData;

                Object.assign(payBody.paymentInfo, {
                    threeDSServerTransID,
                    transactionReference,
                    md,
                    paRes,
                    issuerUrl,
                    challengeComplete,
                    transStatus,
                    authenticationError,
                    fingerprintError,
                    fingerprintTimeout,
                    challengeError,
                });

                Object.assign(payBody, {
                    bookingReference: bookingReference || undefined,
                    requestId: requestId || undefined,
                    sessionId: sessionId || undefined,
                });
            }

            removeCardNumberFor3DS2(this.rootStore.payStore, payBody);
            fillMDFor3DS1(this.rootStore.payStore, payBody);

            setTransactionProcessing();
            const transactionId = getTransactionId(this.payBalancePayload.bookingReference);
            payBody.deviceId = transactionId;

            const result = await bookingService.payRemainingBalance(payBody, transactionId);

            setSessionId(null);

            if ((result.data as IPaymentAuthorization).resultCode) {
                setPaymentAuthorization(result as any);
            } else {
                logger.info(`Booking committed: ${(result.data as IBookingInfo).bookingReference}`);

                runInAction(() => {
                    // store info how balance was paid
                    this.paidDetails = {
                        ...payStore.paymentInfo,
                    };

                    this.booking = result.data;
                    payStore.setFailedToPay(false);
                    clearUI();
                    clearCardInfo();
                    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

                    this.isPaySuccess = true;
                });

                setTransactionDone();
            }
        } catch (e) {
            this.handleBookingError(e as ApiError);
        } finally {
            runInAction(() => {
                this.isPaying = false;
            });
        }
    };

    private readonly handleBookingError = (error: ApiError): void => {
        startNewTransaction(this.payBalancePayload.bookingReference);

        const { payStore } = this.rootStore;
        const { setPaymentError, clearUI, setSessionId } = payStore;

        const data = error.additionalData;

        if (data != null) {
            setSessionId(data['sessionId']);
        }

        runInAction(() => {
            clearUI();
            payStore.setFailedToPay(true);
            const apiError = error;

            /** Payment errors */
            if (apiError.errorCode === ApiErrors.CommitBookingError) {
                setPaymentError({ ...commitBookingError, ...{ correlationId: apiError.correlationId } });
            } else if (apiError.errorCode === ApiErrors.CancelPaymentError) {
                setPaymentError({ ...cancelPaymentError, ...{ correlationId: apiError.correlationId } });
            } else {
                payStore.setPaymentErrors(error);
            }
        });
    };

    @action payRemainingBalanceWithApplePay = async (
        event: ApplePayJS.ApplePayPaymentAuthorizedEvent,
    ): Promise<void> => {
        const { payStore } = this.rootStore;
        const { setSessionId, clearUI } = payStore;

        this.paidDetails = undefined;

        try {
            if (!this.canPay) {
                this.onForceErrors(true);

                return;
            }

            if (this.isPaying) {
                return;
            }

            const paymentInfo: IPayDetailsFullWithApplePay = payStore.applePayPaymentInfo(event);

            const payBody: any = {
                paymentInfo,
                browserInfo: {
                    ...getBrowserInfo(this.rootStore.layoutStore.lang),
                },
                bookingReference: this.payBalancePayload.bookingReference,
                lastName: this.payBalancePayload.lastName,
                date: this.payBalancePayload.date,
            };

            this.isPaying = true;
            clearUI(false);

            payBody.sessionId = payStore.sessionId || undefined;

            setTransactionProcessing();
            const transactionId = getTransactionId(this.payBalancePayload.bookingReference);

            payBody.deviceId = transactionId;

            const result = await bookingService.payRemainingBalance(payBody, transactionId);

            setSessionId(null);

            logger.info(`Booking committed: ${(result.data as IBookingInfo).bookingReference}`);

            runInAction(() => {
                // store info how balance was paid
                this.paidDetails = { ...paymentInfo };

                this.booking = result.data;
                payStore.setFailedToPay(false);
                clearUI();
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

                this.isPaySuccess = true;
            });

            setTransactionDone();
        } catch (e) {
            this.handleBookingError(e as ApiError);
        } finally {
            runInAction(() => {
                this.isPaying = false;
            });
        }
    };

    goBackToViewBooking = () => {
        if (!this.booking) {
            return;
        }

        const bookingPayload = getBookingPayload(this.booking);

        submitForm(`${this.rootStore.layoutStore.basePath}${SitePath.ViewBooking}`, SubmitPayload.ViewBookingInfo, {
            ...bookingPayload,
            isBackToPageClicked: true,
        });
    };

    @computed get isFlightExternal(): boolean {
        return !!this.booking?.package?.transport?.routes[0]?.isExt;
    }

    @computed get isLuxuryPackage(): boolean {
        return containsLuxuryPromoCode(this.booking?.promoCollections);
    }
}
