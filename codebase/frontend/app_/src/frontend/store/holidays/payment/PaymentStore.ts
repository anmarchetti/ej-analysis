import { action, computed, makeObservable, observable } from 'mobx';

import { CurrencyCode } from 'code/currency';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import {
    getTransaction,
    isTransactionDone,
    isTransactionProcessing,
    startNewTransaction,
} from 'frontend/utils/paymentTransaction';

export class PaymentStore {
    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    @observable isDeposit = false;
    @observable confirmPolicy: boolean = false;
    @observable bookingReference: Nullable<string>;

    @computed get currency(): CurrencyCode | undefined {
        return this.rootStore.bookingStore.currency;
    }

    @computed get canPayDeposit(): boolean {
        const { bookingStore } = this.rootStore;

        if (!bookingStore.paymentInfo || bookingStore.isFlightAndHotelPackage) {
            return false;
        }

        return bookingStore.paymentInfo.depositPrice !== 0;
    }

    @computed get fullPrice(): number {
        const { bookingStore } = this.rootStore;

        if (bookingStore.paymentInfo) {
            return bookingStore.paymentInfo.totalPrice;
        }

        if (bookingStore.selectedOffer) {
            return bookingStore.selectedOffer.price;
        }

        return 0;
    }

    @computed get fullPricePP(): number {
        const { bookingStore } = this.rootStore;

        if (bookingStore.paymentInfo) {
            return bookingStore.paymentInfo.pricePP;
        }

        if (bookingStore.selectedOffer) {
            return bookingStore.selectedOffer.pricePP;
        }

        return 0;
    }

    @computed get depositPrice(): number {
        const { bookingStore } = this.rootStore;

        if (bookingStore.paymentInfo) {
            return bookingStore.paymentInfo.depositPrice;
        }

        return 0;
    }

    @computed get balanceDueDate(): string {
        const { bookingStore } = this.rootStore;

        if (bookingStore.paymentInfo) {
            return bookingStore.paymentInfo.balanceDueDate;
        }

        return '';
    }

    @computed get depositDueDate(): string {
        const { bookingStore } = this.rootStore;

        if (bookingStore.paymentInfo) {
            return bookingStore.paymentInfo.depositDueDate;
        }

        return '';
    }

    @computed get canPay(): boolean {
        return this.rootStore.payStore.canPay && this.confirmPolicy;
    }

    @action initialize = async (isCreditShown = false): Promise<void> => {
        this.clearPaymentStore();
        const { bookingStore, payStore, holidayCreditStore } = this.rootStore;

        const initRequests = [bookingStore.fetchOffer()];

        payStore.setCurrency(this.currency);

        const isUseCreditAllowed = isCreditShown && holidayCreditStore.isCreditBookingEnabled;

        if (isUseCreditAllowed) {
            initRequests.push(payStore.getCredit());
        }

        // fetch offer info and user credit in parallel
        await Promise.all(initRequests);

        payStore.setCurrency(this.currency);
        payStore.setIsUseCreditAllowed(isUseCreditAllowed);

        // if user has credit than full amount should be selected by default
        this.selectDefaultPaymentOption();

        if (bookingStore.guestsInfoPayload?.guests) {
            const guests = bookingStore.guestsInfoPayload.guests;
            const leadPassenger = guests.find(guest => guest.isLead);

            if (leadPassenger) {
                payStore.setBillingInfo(
                    `${leadPassenger.firstName} ${leadPassenger.lastName}`,
                    leadPassenger.address || '',
                    leadPassenger.city || '',
                    leadPassenger.postCode || '',
                    leadPassenger.address2 || '',
                );

                payStore.setCustomerEmail(leadPassenger.email || '');
            }
        }

        // TODO: share this logic?
        const transaction = getTransaction();

        // Don't commit booking if transaction started, but no card data (canPay = false).
        // (e.g. User go back to guest details during 3DS2 authentication and then return again to payment page (EJH-15017))
        if (transaction && (isTransactionDone(transaction) || (this.canPay && isTransactionProcessing(transaction)))) {
            bookingStore.commitBooking(undefined, true);
        }
    };

    @action selectDefaultPaymentOption = (): void => {
        if (this.canPayDeposit && !this.rootStore.payStore.hasCredit) {
            this.selectDepositPayment();
        } else {
            this.selectFullPayment();
        }
    };

    @computed get shouldConfirmPolicy(): boolean {
        return this.rootStore.payStore.forceFieldErrors && this.confirmPolicy === false;
    }

    @action togglePolicy = (state: boolean): void => {
        this.confirmPolicy = state;
    };

    @action reselectPayment = (): void => {
        this.isDeposit ? this.selectDepositPayment() : this.selectFullPayment();
    };

    @action selectFullPayment = (): void => {
        this.rootStore.payStore.setAmount(this.fullPrice);
        this.isDeposit = false;
    };

    @action selectDepositPayment = (): void => {
        this.rootStore.payStore.setAmount(this.depositPrice);
        this.isDeposit = true;
    };

    @action setBookingReference = (bookingReference: Nullable<string>): void => {
        this.bookingReference = bookingReference;
    };

    @action clearPaymentStore = (): void => {
        this.rootStore.payStore.clearStore();
        this.isDeposit = false;
    };

    @action clearPaymentUI = (hard: boolean = true): void => {
        this.rootStore.payStore.clearUI(hard);

        if (hard) {
            this.togglePolicy(false);
        }
    };

    /** Start new transaction on page load if needed */
    @action startTransactionOnPageLoad = (): void => {
        const currentTransaction = getTransaction();
        const query = decodeURIComponent(this.rootStore.routerStore.search);

        // if it is a hotel details or extras page then start new transaction anyway
        if (this.rootStore.layoutStore.isHotelDetailsBookPage || this.rootStore.layoutStore.isExtrasPage) {
            startNewTransaction(query, this.rootStore.bookingStore.totalPrice);

            return;
        }

        // Start new transaction if we dont have one and queries are not equal on Guest Details / Payment Page
        if (
            (this.rootStore.layoutStore.isGuestDetailsPage || this.rootStore.layoutStore.isPaymentPage) &&
            query !== currentTransaction?.q
        ) {
            startNewTransaction(query, this.rootStore.bookingStore.totalPrice);
        }
    };
}
