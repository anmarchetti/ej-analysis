import Axios, { AxiosResponse } from 'axios';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import { CurrencyCode } from 'code/currency';
import creditManagementService from 'frontend/services/creditManagement.service';
import validationService from 'frontend/services/validation.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { getLocalizedFormatValue } from 'frontend/utils/date.utils';
import { ApiError } from 'models/data/ApiError';
import { IMyCreditInfo } from 'models/data/MyCreditInfo';
import { BillingInfo } from 'models/data/payment/BillingInfo';
import { CardInfo } from 'models/data/payment/CardInfo';
import { IPayDetailsFullWithApplePay, TPayDetails } from 'models/data/payment/IPayDetails';
import { IPaymentAuthorization } from 'models/data/payment/IPaymentAuthorization';
import { ApiErrors } from 'models/enum/ApiErrors';
import { CardType } from 'models/enum/CardType';
import { PaymentType } from 'models/enum/PaymentType';

import { commitBookingErrorCode, defaultFailure, failuresConfig, IPaymentFailureItem } from './payment-failures.config';

export interface IPayStoreInitialState {
    isPaymentAllowed: boolean;
}

export class PayStore {
    @observable amount = 0;
    @observable currency: CurrencyCode | undefined; // currency of booking
    @observable cardInfo: CardInfo = new CardInfo();
    @observable forceFieldErrors: boolean = false;
    @observable highlightFields: boolean = false;

    @observable formRerenderTrigger: number = Math.random();
    @observable paymentErrors: IPaymentFailureItem[] = [];

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
    @observable isUseCreditAllowed = true;
    @observable usedCredit = 0; // amount of credit user plan to use
    @observable userAllCredits: Nullable<IMyCreditInfo[]> = null; // user credits from all markets
    @observable userCreditError = false;
    @observable isPaymentAllowed = true;

    @computed get isAtcomError(): boolean {
        return !!(this.paymentErrors || []).find(el => el.code === commitBookingErrorCode);
    }

    /**
     * Errors related to commit booking process
     */
    @computed get commitBookingErrors(): IPaymentFailureItem[] {
        return (this.paymentErrors || []).filter(x => x.code !== ApiErrors.BookingTransferIsNotAvailable);
    }

    /**
     * Unavailable transfer errors(commit booking)
     */
    @computed get transferErrors(): IPaymentFailureItem[] {
        return (this.paymentErrors || []).filter(x => x.code === ApiErrors.BookingTransferIsNotAvailable);
    }

    @computed get canPay(): boolean {
        if (this.amountToPay > 0) {
            switch (this.selectedPaymentType) {
                case PaymentType.Card:
                    return this.isBillingInfoValid && this.isPaymentInfoValid;
                case PaymentType.ApplePay:
                    return true;
                default:
                    return false;
            }
        }

        // if amount is zero (in case payment by credit) user can pay anyway (even with invalid form)
        // if amount is less than zero, comes from a refund, so we can go ahead
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

    // search for the Apple Pay error
    @computed get applePayValidationError(): IPaymentFailureItem | undefined {
        return this.paymentErrors.find(e => e.code === 'apple_merchant_validation_failed');
    }

    // User credit amount in current currency
    @computed get userCreditAmount(): number {
        if (this.currency && this.userAllCredits?.length) {
            const credit = this.userAllCredits.find(el => el.currency === this.currency);

            return credit?.balance ?? 0;
        }

        return 0;
    }

    @computed get hasCredit(): boolean {
        return this.isUseCreditAllowed && this.userCreditAmount > 0;
    }

    /* total credit amount that user can spend on this particular holiday */
    @computed get totalCreditAmount(): number {
        if (this.amount > this.userCreditAmount) {
            return this.userCreditAmount;
        }

        return this.amount ?? 0;
    }

    @computed get isCreditUsed() {
        return this.usedCredit > 0;
    }

    /* How much real money user should pay */

    @computed get amountToPay() {
        return Number(parseFloat(`${this.amount - this.usedCredit}`).toFixed(2));
    }

    @computed get expirationDateWaterMask() {
        return getLocalizedFormatValue('monthAnYear');
    }

    getExpirationDateValueForBackEnd() {
        const maskSeparator = this.expirationDateWaterMask[2];

        return this.cardInfo.expirationDate.replace(maskSeparator, '/');
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
                expirationDate: this.getExpirationDateValueForBackEnd(),
            };
        }

        return info;
    }

    @computed get selectedPaymentType(): string {
        const { paymentTypeStore } = this.rootStore;

        if (paymentTypeStore) {
            return paymentTypeStore.selectedPaymentType;
        }

        return '';
    }

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    public serialize(): IPayStoreInitialState {
        return {
            isPaymentAllowed: this.isPaymentAllowed,
        };
    }

    public deserialize(initialState?: IPayStoreInitialState): void {
        if (initialState) {
            this.isPaymentAllowed = initialState.isPaymentAllowed;
        }
    }

    @action applePayPaymentInfo = (event: ApplePayJS.ApplePayPaymentAuthorizedEvent): IPayDetailsFullWithApplePay => {
        let info = {} as IPayDetailsFullWithApplePay;
        const cardType =
            event.payment.token.paymentMethod.network.toLowerCase() === 'amex'
                ? 'AmericanExpress'
                : event.payment.token.paymentMethod.network;

        if (this.amountToPay > 0) {
            info = {
                token: event.payment.token,
                paymentType: PaymentType.ApplePay,
                amount: this.amountToPay,
                billingInfo: {
                    ...this.billingInfo,
                },
                cardType,
            };
        }

        if (this.usedCredit) {
            info.creditAmount = this.usedCredit;
        }

        return info;
    };

    @action setFailedToPay = (hasFailed: boolean) => {
        this.failedToPay = hasFailed;
    };

    @action setPaymentErrors = (e: ApiError): void => {
        const { selectedPaymentType } = this.rootStore.payStore;

        this.paymentErrors = (e.innerErrors || [])
            .map(el => {
                const failure = failuresConfig.find(f => f.code === el.code);
                const resultingFailure = el.code && failure ? failure : defaultFailure;

                return { ...resultingFailure, ...{ correlationId: e.correlationId, details: el.message } };
            })
            .filter((el, idx, array) => array.findIndex(f => f.code === el.code) === idx);

        // show at least default error if no error
        if (this.paymentErrors.length < 1) {
            this.paymentErrors.push(defaultFailure);
        }

        if (selectedPaymentType === PaymentType.Card && !this.fatalPaymentError) {
            this.clearCardInfo();
            this.toggleHighlightFields(true);
            this.toggleFocusPaymentBlock(true);
        }
    };

    @action setPaymentError = (error: any) => {
        this.paymentErrors = [error];
    };

    //  set Apple Pay failure
    @action setMerchantValidationFailure = (details?: string): IPaymentFailureItem => {
        const failure = failuresConfig.find(f => f.code === 'apple_merchant_validation_failed') || defaultFailure;
        const enrichedError = { ...failure, details };
        this.setPaymentError(enrichedError);

        return enrichedError;
    };

    @action toggleFocusPaymentBlock = (state: boolean) => {
        this.paymentBlockInFocus = state;
    };

    @action clearCardInfo = () => {
        this.cardInfo = new CardInfo();
    };

    @action toggleFocusBillingAddressBlock = (state: boolean) => {
        this.billingAddressBlokInFocus = state;
    };

    @action toggleHighlightFields = (state: boolean) => {
        this.highlightFields = state;
    };

    @action rerenderForm = () => {
        this.formRerenderTrigger = Math.random();
    };

    @action setBillingInfo = (
        fullName?: string,
        address?: string,
        city?: string,
        postCode?: string,
        address2?: string,
    ) => {
        this.billingInfo = new BillingInfo(fullName, address, city, postCode, address2);
    };

    @action setCustomerEmail = (email: string) => {
        this.customerEmail = email;
    };

    @action clearStore = () => {
        this.clearUI();
        this.clearCardInfo();
        this.billingInfo = new BillingInfo();
        this.userCreditError = false;
        this.amount = 0;
        this.isUseCreditAllowed = true;
        this.currency = undefined;
    };

    @action setAmount = (amount: number) => {
        this.amount = amount;
        this.resetUseCredit();
    };

    @action setCurrency = (currency?: CurrencyCode) => {
        this.currency = currency;
    };

    @action clearUI = (hard: boolean = true) => {
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

    @action onForceErrors = (shouldForceErrors: boolean): void => {
        this.forceFieldErrors = shouldForceErrors;

        if (!shouldForceErrors) {
            return;
        }

        if (this.selectedPaymentType === PaymentType.Card && !this.isPaymentInfoValid) {
            this.toggleFocusPaymentBlock(true);

            return;
        }

        if (!this.isBillingInfoValid) {
            this.toggleFocusBillingAddressBlock(true);
        }
    };

    @action setPaymentAuthorization = (result: AxiosResponse<any>) => {
        this.requirePaymentAuthorization = true;
        this.paymentAuthorization = result.data;
        this.threeDSServerTransID =
            this.threeDSServerTransID || (result.data ? result.data.threeDSServerTransID : null);
        this.sessionId = result.data ? result.data.sessionID : null;
        this.md = this.md || (result.data ? result.data.md : null);
    };

    @action setSessionId = (sessionId: Nullable<string>) => {
        this.sessionId = sessionId;
    };

    @action setIsUseCreditAllowed = (state: boolean) => {
        this.isUseCreditAllowed = state;
    };

    @action useCredit = (amount: number) => {
        this.usedCredit = amount;
        this.isUseCreditActive = false;
    };

    /* toggle use credit block */
    @action toggleUseCredit = () => {
        this.isUseCreditActive = this.isCreditUsed ? false : !this.isUseCreditActive;
        this.usedCredit = 0;
    };

    @action editUseCredit = () => {
        this.usedCredit = 0;
        this.isUseCreditActive = true;
    };

    @action resetUseCredit = () => {
        this.usedCredit = 0;
        this.isUseCreditActive = false;
    };

    @action getCredit = async () => {
        this.userAllCredits = [];
        this.userCreditError = false;

        try {
            const result = await creditManagementService.loadCreditBalance(Axios.CancelToken.source());
            runInAction(() => {
                this.userAllCredits = result;
            });
        } catch (e) {
            // If user is not authorized, do not show error, the credit block should be just hidden.
            if (e.response?.status !== 401) {
                this.userCreditError = true;
            }
        }
    };
}
