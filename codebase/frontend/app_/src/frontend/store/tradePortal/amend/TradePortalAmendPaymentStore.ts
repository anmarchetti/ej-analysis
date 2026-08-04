import { action, makeObservable, runInAction } from 'mobx';

import { Tokens } from 'code/tokens';
import bookingService from 'frontend/services/booking.service';
import { BaseAmendPaymentStore } from 'frontend/store/base/amend/BaseAmendPaymentStore';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { getBrowserInfo } from 'frontend/utils/payment.utls';
import {
    getTransactionId,
    setTransactionDone,
    setTransactionProcessing,
    startNewTransaction,
} from 'frontend/utils/paymentTransaction';
import { getFlightDigitalNumber } from 'frontend/utils/route.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { ApiError } from 'models/data/ApiError';
import { AmendmentType } from 'models/data/IBookingInfo';
import { AMEND_SEATS_UNAVAILABLE_API_ERRORS, ApiErrors } from 'models/enum/ApiErrors';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export class TradePortalAmendPaymentStore extends BaseAmendPaymentStore {
    constructor(public rootStore: TradePortalRootStore) {
        super(rootStore);
        makeObservable(this);
    }

    get totalPrice() {
        if (this.rootStore.amendSeatsStore.amendmentCharges) {
            return this.rootStore.amendSeatsStore.amendmentCharges;
        }

        return 0;
    }

    @action initialize = async () => {
        const { amendSeatsStore, payStore, routerStore, userStore } = this.rootStore;

        // if user is not logged in redirect to login page
        const isLoggedIn = await userStore.checkIfUserLoggedIn();

        if (!isLoggedIn || !this.rootStore.viewBookingStore.booking || !amendSeatsStore.newSelection) {
            routerStore.redirectToLoginPage();

            return;
        }

        const { routes } = this.rootStore.viewBookingStore.booking?.package?.transport || {};

        this.amendPaymentPayload = {
            ...(getBookingPayload(this.rootStore.viewBookingStore.booking) as any),
            selectedSeats: {
                amendmentCharges: amendSeatsStore.amendmentCharges || 0,
                newSeatSelection: amendSeatsStore.newSelection,
                prevSeatSelection: this.rootStore.viewBookingStore.booking.seatSelection || [],
                guests: this.rootStore.viewBookingStore.booking.guests,
                outboundFlightNum: getFlightDigitalNumber(routes[0]),
                inboundFlightNum: getFlightDigitalNumber(routes[1]),
                validatedSeatsWithPrices: this.rootStore.seatMapStore.validatedSelectedSeats,
            },
        };

        this.booking = this.rootStore.viewBookingStore.booking;

        amendSeatsStore.initFromPayload();
        payStore.setAmount(this.totalPrice);

        startNewTransaction(this.booking.bookingReference);
    };

    @action onForceErrors = (state: boolean) => {
        this.rootStore.payStore.onForceErrors(state);
    };

    @action onPay = async () => {
        const { payStore } = this.rootStore;

        if (!this.amendPaymentPayload) {
            return;
        }

        try {
            const payBody: any = {
                browserInfo: {
                    ...getBrowserInfo(this.rootStore.layoutStore.lang),
                },
                bookingReference: this.amendPaymentPayload.bookingReference,
                lastName: this.amendPaymentPayload.lastName,
                date: this.amendPaymentPayload.date,
                paymentInfo: {
                    amount: payStore.amount,
                },
                sessionId: payStore.sessionId,
            };

            if (this.amendPaymentPayload.selectedSeats?.validatedSeatsWithPrices) {
                payBody.seatSelection = this.amendPaymentPayload.selectedSeats.validatedSeatsWithPrices;
            }

            this.isPaying = true;

            setTransactionProcessing();
            const transactionId = getTransactionId(this.amendPaymentPayload.bookingReference);
            payBody.deviceId = transactionId;

            await bookingService.amendCommitBooking(payBody, transactionId);

            runInAction(() => {
                this.goBackToViewBooking();
            });

            setTransactionDone();
        } catch (e) {
            startNewTransaction(this.amendPaymentPayload.bookingReference);

            runInAction(() => {
                const apiError = e as ApiError;

                if (AMEND_SEATS_UNAVAILABLE_API_ERRORS.includes(apiError.errorCode as ApiErrors)) {
                    this.rootStore.seatMapStore.setIsSelectedSeatsUnavailableError(true);
                }
            });
        } finally {
            runInAction(() => {
                this.isPaying = false;
            });
        }
    };

    goBackToViewBooking = (shouldOpenSeatMapWidget: boolean = false, hideAmendedSeatsPopup: boolean = false) => {
        if (!this.booking) {
            return;
        }

        if (!hideAmendedSeatsPopup) {
            this.rootStore.viewBookingStore.setSuccessfulAmendmentStatus(AmendmentType.Seats);
        }

        if (shouldOpenSeatMapWidget) {
            this.rootStore.seatMapStore.setOpenSeatMapForced(true);
        }

        this.rootStore.viewBookingStore.viewBookingPayload = {
            ...getBookingPayload(this.booking),
            amendPaymentPayload: this.amendPaymentPayload,
        };

        this.rootStore.viewBookingStore.getBooking(this.booking.bookingReference);
    };

    getAmendTransportLabel = (template: string = ''): string => {
        const { getPhrase } = this.rootStore.layoutStore;
        const phrase: string | undefined = SitecoreDictionary.TransferLabelsSeats;

        return (phrase && Tokenizer.replaceToken(template, Tokens.Transport, getPhrase(phrase))) || '';
    };

    goBackToPreviousPage = () => {
        if (!this.amendPaymentPayload?.bookingReference) {
            return;
        }

        this.goBackToViewBooking(true, true);
    };

    @action clearAmendPaymentStore = () => {
        this.amendPaymentPayload = undefined;
        this.booking = null;
    };
}
