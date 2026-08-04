import { AxiosResponse } from 'axios';
import { action, computed, makeObservable, observable } from 'mobx';

import { CurrencyCode } from 'code/currency';
import validationService from 'frontend/services/validation.service';
import { ApiError } from 'models/data/ApiError';
import { BillingInfo } from 'models/data/payment/BillingInfo';
import { CardInfo } from 'models/data/payment/CardInfo';
import { TPayDetails } from 'models/data/payment/IPayDetails';
import { IPaymentAuthorization } from 'models/data/payment/IPaymentAuthorization';
import { ApiErrors } from 'models/enum/ApiErrors';
import { CardType } from 'models/enum/CardType';

import {
    commitBookingErrorCode,
    defaultFailure,
    failuresConfig,
    ITradePortalPaymentFailureItem,
} from './payment-failures.config';

export interface ITradePortalPayStoreInitialState {
    isPaymentAllowed: boolean;
}

class TradePortalPayStore {
    @observable amount = 0;
    @observable currency: CurrencyCode | undefined; // currency of booking
    @observable cardInfo: CardInfo = new CardInfo();
    @observable forceFieldErrors: boolean = false;
    @observable highlightFields: boolean = false;

    @observable formRerenderTrigger: number = Math.random();
    @observable paymentErrors: ITradePortalPaymentFailureItem[] = [];

    @observable paymentBlockInFocus: boolean = false;
    @observable billingAddressBlokInFocus: boolean = false;

    @observable billingInfo: BillingInfo = new BillingInfo();
    @observable customerEmail: string;

    @observable paymentAuthorization: Nullable<IPaymentAuthorization>;
    @observable requirePaymentAuthorization: boolean = false;

    @observable threeDSServerTransID: Nullable<string>;
    @observable md: Nullable<string>;

    @observable failedToPay: boolean;
    @observable sessionId: Nullable<string>;

    @observable isUseCreditActive = false; // is use credit form in active state
    @observable usedCredit = 0; // amount of credit user plan to use
    @observable userCreditAmount = 0; // total available user credit amount
    @observable isPaymentAllowed = true;
    @observable isUseCreditAllowed = true;
    @observable userCreditError = false;

    @computed get isAtcomError(): boolean {
        return !!(this.paymentErrors || []).find(el => el.code === commitBookingErrorCode);
    }

    /**
     * Errors related to commit booking process
     */
    @computed get commitBookingErrors(): ITradePortalPaymentFailureItem[] {
        return (this.paymentErrors || []).filter(x => x.code !== ApiErrors.BookingTransferIsNotAvailable);
    }

    /**
     * Unavailable transfer errors(commit booking)
     */
    @computed get transferErrors(): ITradePortalPaymentFailureItem[] {
        return (this.paymentErrors || []).filter(x => x.code === ApiErrors.BookingTransferIsNotAvailable);
    }

    @computed get canPay(): boolean {
        if (this.amountToPay > 0) {
            return this.isBillingInfoValid && this.isPaymentInfoValid;
        }

        // if amount is zero (in case payment by credit) user can pay anyway (even with invalid form)
        return true;
    }

    @computed get isPaymentInfoValid(): boolean {
        return (
            validationService.validateModel(
                this.cardInfo,
                this.cardInfo.cardType !== CardType.Maestro ? ['issueNumber'] : [],
            ).length === 0
        );
    }

    @computed get isBillingInfoValid(): boolean {
        return validationService.validateModel(this.billingInfo).length === 0;
    }

    @computed get fatalPaymentError(): boolean {
        return this.paymentErrors.some(el => el.isFatal);
    }

    @computed get hasCredit(): boolean {
        return !!this.userCreditAmount && this.userCreditAmount > 0;
    }

    /* total credit amount that user can spend on this particular holiday */
    @computed get totalCreditAmount(): number {
        if (this.amount > this.userCreditAmount) {
            return this.userCreditAmount ?? 0;
        }

        return this.amount ?? 0;
    }

    @computed get isCreditUsed(): boolean {
        return this.usedCredit > 0;
    }

    /* How much real money user should pay */

    @computed get amountToPay(): number {
        return Number(parseFloat(`${this.amount - this.usedCredit}`).toFixed(2));
    }

    @computed get paymentInfo(): TPayDetails {
        let info = {} as TPayDetails;

        if (this.usedCredit) {
            info.creditAmount = this.usedCredit;
        }

        if (this.amountToPay > 0) {
            info = {
                ...this.cardInfo,
                cardType: this.cardInfo.cardType,
                amount: this.amountToPay,
                billingInfo: {
                    ...this.billingInfo,
                },
                ...info,
            };
        }

        return info;
    }

    constructor() {
        makeObservable(this);
    }

    public serialize(): ITradePortalPayStoreInitialState {
        return {
            isPaymentAllowed: this.isPaymentAllowed,
        };
    }

    public deserialize(initialState?: ITradePortalPayStoreInitialState): void {
        if (initialState) {
            this.isPaymentAllowed = initialState.isPaymentAllowed;
        }
    }

    @action setFailedToPay = (hasFailed: boolean): void => {
        this.failedToPay = hasFailed;
    };

    @action setIsUseCreditAllowed = (state: boolean): void => {
        this.isUseCreditAllowed = state;
    };

    @action setPaymentErrors = (e: ApiError): void => {
        this.paymentErrors = (e.innerErrors || [])
            .map(el => {
                const failure = failuresConfig.find(f => f.code === el.code);
                const resultingFailure = el.code && failure ? failure : defaultFailure;

                return { ...resultingFailure, ...{ correlationId: e.correlationId } };
            })
            .filter((el, idx, array) => array.findIndex(f => f.code === el.code) === idx);

        // show at least default error if no error
        if (this.paymentErrors.length < 1) {
            this.paymentErrors.push(defaultFailure);
        }

        if (!this.fatalPaymentError) {
            this.clearCardInfo();
            this.toggleHighlightFields(true);
        }

        this.toggleFocusPaymentBlock(true);
    };

    @action setPaymentError = (error: ITradePortalPaymentFailureItem): void => {
        this.paymentErrors = [error];
    };

    @action toggleFocusPaymentBlock = (state: boolean): void => {
        this.paymentBlockInFocus = state;
    };

    @action clearCardInfo = (): void => {
        this.cardInfo = new CardInfo();
    };

    @action toggleFocusBillingAddressBlock = (state: boolean): void => {
        this.billingAddressBlokInFocus = state;
    };

    @action toggleHighlightFields = (state: boolean): void => {
        this.highlightFields = state;
    };

    @action rerenderForm = (): void => {
        this.formRerenderTrigger = Math.random();
    };

    @action setBillingInfo = (
        fullName?: string,
        address?: string,
        city?: string,
        postCode?: string,
        address2?: string,
    ): void => {
        this.billingInfo = new BillingInfo(fullName, address, city, postCode, address2);
    };

    @action setCustomerEmail = (email: string): void => {
        this.customerEmail = email;
    };

    @action clearStore = (): void => {
        this.clearUI();
        this.clearCardInfo();
        this.billingInfo = new BillingInfo();

        this.amount = 0;
        this.currency = undefined;
    };

    @action setAmount = (amount: number): void => {
        this.amount = amount;
        this.resetUseCredit();
    };

    @action setCurrency = (currency?: CurrencyCode): void => {
        this.currency = currency;
    };

    @action clearUI = (hard: boolean = true): void => {
        if (hard) {
            this.threeDSServerTransID = null;
            this.paymentAuthorization = null;
            this.rerenderForm();
        }

        this.requirePaymentAuthorization = false;
        this.toggleHighlightFields(false);
        this.onForceErrors(false);
        this.paymentErrors = [];
    };

    @action onForceErrors = (state: boolean): void => {
        this.forceFieldErrors = state;

        if (state) {
            if (!this.isPaymentInfoValid) {
                this.toggleFocusPaymentBlock(true);

                return;
            }

            if (!this.isBillingInfoValid) {
                this.toggleFocusBillingAddressBlock(true);

                return;
            }
        }
    };

    @action setPaymentAuthorization = (result: AxiosResponse<any>): void => {
        this.requirePaymentAuthorization = true;
        this.paymentAuthorization = result.data;
        this.threeDSServerTransID =
            this.threeDSServerTransID || (result.data ? result.data.threeDSServerTransID : null);
        this.sessionId = result.data ? result.data.sessionID : null;
        this.md = this.md || (result.data ? result.data.md : null);
    };

    @action setSessionId = (sessionId: Nullable<string>): void => {
        this.sessionId = sessionId;
    };

    @action useCredit = (amount: number): void => {
        this.usedCredit = amount;
        this.isUseCreditActive = false;
    };

    /* toggle use credit block */
    @action toggleUseCredit = (): void => {
        this.isUseCreditActive = this.isCreditUsed ? false : !this.isUseCreditActive;
        this.usedCredit = 0;
    };

    @action editUseCredit = (): void => {
        this.usedCredit = 0;
        this.isUseCreditActive = true;
    };

    @action resetUseCredit = (): void => {
        this.usedCredit = 0;
        this.isUseCreditActive = false;
    };
}

export default TradePortalPayStore;
