import { action, computed, makeObservable, observable } from 'mobx';

import { CurrencyCode } from 'code/currency';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { getTransaction, startNewTransaction } from 'frontend/utils/paymentTransaction';

class TradePortalPaymentStore {
    constructor(public rootStore: TradePortalRootStore) {
        makeObservable(this);
    }

    @observable confirmPolicy: boolean = false;
    @observable bookingReference: Nullable<string>;

    @computed get currency(): CurrencyCode | undefined {
        return this.rootStore.bookingStore.currency;
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

    @computed get canPay(): boolean {
        return this.confirmPolicy;
    }

    @action initialize = async (): Promise<void> => {
        const { bookingStore, guestDetailsStore, payStore } = this.rootStore;

        if (!guestDetailsStore.hasGuestInStorage()) {
            this.rootStore.routerStore.redirectToHomePage();

            return;
        }

        await Promise.all([bookingStore.fetchOffer(true), guestDetailsStore.initializeGuests()]);

        payStore.setCurrency(this.currency);
        this.selectFullPayment();
    };

    @computed get shouldConfirmPolicy(): boolean {
        return this.rootStore.payStore.forceFieldErrors && this.confirmPolicy === false;
    }

    @action togglePolicy = (state: boolean): void => {
        this.confirmPolicy = state;
    };

    @action selectFullPayment = (): void => {
        this.rootStore.payStore.setAmount(this.fullPrice);
    };

    @action setBookingReference = (bookingReference: Nullable<string>): void => {
        this.bookingReference = bookingReference;
    };

    @action clearPaymentStore = (): void => {
        this.rootStore.payStore.clearStore();
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
            (this.rootStore.layoutStore.isGuestDetailsPage || this.rootStore.layoutStore.isConfirmPage) &&
            query !== currentTransaction?.q
        ) {
            startNewTransaction(query, this.rootStore.bookingStore.totalPrice);
        }
    };

    @action selectDefaultPaymentOption = (): void => {
        this.rootStore.payStore.setAmount(this.fullPrice);
    };
}

export default TradePortalPaymentStore;
