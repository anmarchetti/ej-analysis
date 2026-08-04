import { CurrencyCode } from 'code/currency';
import { PaymentOption, RefundPaymentMethod } from 'frontend/store/base/amend/BaseAmendPaymentStore';
import { IPaymentFailureItem } from 'frontend/store/holidays/payment/payment-failures.config';
import { getCardType } from 'frontend/utils/payment.utls';
import { PaymentStep } from 'models/data/AmendInfo';
import { IApplePayBookingPaymentInfo } from 'models/data/IAmendBookingRequestBody';
import { AmendmentType } from 'models/data/IBookingInfo';
import { IPaymentGAParams, IPaymentHistoryItem } from 'models/data/IPaymentInfo';
import { IPayDetailsFull, IPayDetailsFullWithApplePay, TPayDetails } from 'models/data/payment/IPayDetails';
import { EventActions, EventLabels } from 'models/enum/tracking/GenericEventParams';

import {
    getPaymentErrorMessage,
    getPaymentLabelForBalancePaymentSuccess,
    getPaymentLabelForSuccess,
    IPaymentMethod,
} from './Payment.utils';

export const EVENT_ACTION_HOVER_VIEW_FULL_DETAILS = 'view full details hover';
export const EVENT_ACTION_CLICKED_VIEW_FULL_DETAILS = 'view full details clicked';
export const EVENT_ACTION_BILLING_ADDRESS_EDIT_CLICK = 'billing address edit click';
export const EVENT_ACTION_BILLING_ADDRESS_EDIT_UPDATED = 'billing address updated';
export const EVENT_ACTION_CLICK_TO_PAY = 'Pay now click';
export const EVENT_ACTION_SHOW_PRICE_BREAKDOWN_CLICK = 'price breakdown click';
export const EVENT_ACTION_PAYMENT_ERROR = 'payment error';
export const EVENT_ACTION_CLICK_TO_PAY_DEPOSIT = 'pay the deposit click';
export const EVENT_ACTION_CLICK_TO_PAY_FULL_AMOUNT = 'pay the full amount click';
export const EVENT_ACTION_PRICE_JUMP_POPUP = 'price jump popup';
export const EVENT_ACTION_REFUND_AMENDMENTS = 'refund success';
export const EVENT_ACTION_HOLIDAY_UNAVAILABLE = 'holiday is unavailable';
export const EVENT_ACTION_LOGIN_SUCCESSFUL = 'login success';
export const EVENT_ACTION_PAY_FOR_CHANGE_NOW = 'pay for your change now click';
export const EVENT_ACTION_PAY_FOR_CHANGE_LATER = 'pay for your change later click';

export const EVENT_ACTION_AMEND_PAYMENT_STEP_1 = 'step 1';
export const EVENT_ACTION_AMEND_PAYMENT_STEP_2 = 'step 2';
export const EVENT_ACTION_AMEND_PAYMENT_STEP_3 = 'step 3';
export const EVENT_ACTION_AMEND_PAYMENT_TYPE = {
    CONTINUE: 'continue',
    EXPAND: 'expand',
    COLLAPSE: 'collapse',
};

export const EVENT_ACTION_PAYMENT_SUCCESS = 'payment success';
export const EVENT_ACTION_PAYMENT_SUCCESS_SOURCE_TYPE = {
    CARD: 'paid by card',
    CREDIT: 'paid by credit',
    CARD_CREDIT: 'paid by card & credit',
};

export enum EventActionClickToPayType {
    Full = 'Paid in Full',
    Deposit = 'Paid Deposit',
    FullCredit = 'Paid in Full with Credit',
    DepositCredit = 'Paid Deposit with Credit',
}

export type TEventActionAmendPaymentType =
    (typeof EVENT_ACTION_AMEND_PAYMENT_TYPE)[keyof typeof EVENT_ACTION_AMEND_PAYMENT_TYPE];

const clickToPayEventAction = { event_action: EVENT_ACTION_CLICK_TO_PAY };

export const gaHoverViewDetailsParams: IPaymentGAParams = {
    event_action: EVENT_ACTION_HOVER_VIEW_FULL_DETAILS,
};

export const gaClickViewDetailsParams: IPaymentGAParams = {
    event_action: EVENT_ACTION_CLICKED_VIEW_FULL_DETAILS,
};

export const gaClickEditBillingAddress: IPaymentGAParams = {
    event_action: EVENT_ACTION_BILLING_ADDRESS_EDIT_CLICK,
};

export const gaUpdatedEditBillingAddress: IPaymentGAParams = {
    event_action: EVENT_ACTION_BILLING_ADDRESS_EDIT_UPDATED,
};

const resolveClickToPayMethod = (isDeposit?: boolean, usedCredit?: number): EventActionClickToPayType => {
    if (isDeposit && !usedCredit) return EventActionClickToPayType.Deposit;

    if (isDeposit && usedCredit !== 0) return EventActionClickToPayType.DepositCredit;

    if (!isDeposit && !usedCredit) return EventActionClickToPayType.Full;

    return EventActionClickToPayType.FullCredit;
};

const resolveClickToPayMethodForAmends = (
    paymentOption?: PaymentOption,
    usedCredit?: number,
): EventActionClickToPayType => {
    if (paymentOption === PaymentOption.Part && !usedCredit) return EventActionClickToPayType.Full;

    if (paymentOption === PaymentOption.Part && usedCredit !== 0) return EventActionClickToPayType.FullCredit;

    return EventActionClickToPayType.Deposit;
};

const resolveClickToPayMethodForBalance = (
    amount?: number,
    amountToPay?: number,
    usedCredit?: number,
): EventActionClickToPayType | undefined => {
    if (amount !== undefined && amountToPay !== undefined) {
        const amountToBePaid = Math.round((amountToPay + (usedCredit || 0)) * DECIMAL_SCALE) / DECIMAL_SCALE;

        if (amountToBePaid < amount && usedCredit) {
            return EventActionClickToPayType.DepositCredit;
        }

        if (amountToBePaid === amount && usedCredit) {
            return EventActionClickToPayType.FullCredit;
        }

        if (amountToBePaid < amount && !usedCredit) {
            return EventActionClickToPayType.Deposit;
        }

        if (amountToBePaid === amount && !usedCredit) {
            return EventActionClickToPayType.Full;
        }
    }

    return undefined;
};

export enum ButtonStateLabel {
    Active = 'Active',
    Inactive = 'Inactive',
}

const getButtonLabel = (buttonEnabled: boolean): ButtonStateLabel =>
    buttonEnabled ? ButtonStateLabel.Active : ButtonStateLabel.Inactive;

export const gaClickToPayPaymentPage = (
    buttonEnabled?: boolean,
    isDeposit?: boolean,
    usedCredit?: number,
): IPaymentGAParams => ({
    ...clickToPayEventAction,
    generic_value_1: getButtonLabel(!!buttonEnabled),
    generic_value_2: resolveClickToPayMethod(isDeposit, usedCredit),
});

export const gaApplePayDisplayedOnPage: IPaymentGAParams = {
    event_action: EventActions.ApplePay,
    event_label: EventLabels.Impression,
};

export const gaApplePayButtonClicked: IPaymentGAParams = {
    event_action: EventActions.ApplePay,
    event_label: EventLabels.ButtonClick,
};

export const gaApplePayButtonClickedWithoutAcceptingTermsAndConditions: IPaymentGAParams = {
    event_action: EventActions.ApplePay,
    event_label: EventLabels.Error,
    generic_value_1: 'T&C Not Accepted',
};
export const gaApplePayPaymentCancelled: IPaymentGAParams = {
    event_action: EventActions.ApplePay,
    event_label: EventLabels.PaymentCancelled,
};

export const gaApplePayPaymentOptionClicked: IPaymentGAParams = {
    event_action: EventActions.ApplePay,
    event_label: EventLabels.Selected,
};

export const gaCreditDebitCardPaymentOptionClicked: IPaymentGAParams = {
    event_action: EventActions.CreditDebitCard,
    event_label: EventLabels.Selected,
};

export const gaClickToAmendPaymentPage = (
    buttonEnabled?: boolean,
    paymentOption?: PaymentOption,
    usedCredit?: number,
): IPaymentGAParams => ({
    ...clickToPayEventAction,
    generic_value_1: getButtonLabel(!!buttonEnabled),
    generic_value_2: resolveClickToPayMethodForAmends(paymentOption, usedCredit),
});

export const gaClickPayBalancePage = (
    buttonEnabled?: boolean,
    amount?: number,
    amountToPay?: number,
    usedCredit?: number,
): IPaymentGAParams => ({
    ...clickToPayEventAction,
    generic_value_1: getButtonLabel(!!buttonEnabled),
    generic_value_2: resolveClickToPayMethodForBalance(amount, amountToPay, usedCredit),
});

export const gaClickShowPriceBreakdown = (currency: CurrencyCode): IPaymentGAParams => ({
    event_action: EVENT_ACTION_SHOW_PRICE_BREAKDOWN_CLICK,
    event_currency: currency,
});

export const gaPaymentError = (error: IPaymentFailureItem): IPaymentGAParams => ({
    event_action: EVENT_ACTION_PAYMENT_ERROR,
    event_label: getPaymentErrorMessage(error),
});

export const gaClickPayDeposit: IPaymentGAParams = {
    event_action: EVENT_ACTION_CLICK_TO_PAY_DEPOSIT,
};

export const gaClickPayFullAmount: IPaymentGAParams = {
    event_action: EVENT_ACTION_CLICK_TO_PAY_FULL_AMOUNT,
};

const gaClickAmendStep = (step: PaymentStep, eventType: TEventActionAmendPaymentType): IPaymentGAParams => {
    switch (step) {
        case PaymentStep.Entity:
            return {
                event_action: EVENT_ACTION_AMEND_PAYMENT_STEP_1,
                event_label: eventType,
            };
        case PaymentStep.Option:
            return {
                event_action: EVENT_ACTION_AMEND_PAYMENT_STEP_2,
                event_label: eventType,
            };
        case PaymentStep.Confirmation:
            return {
                event_action: EVENT_ACTION_AMEND_PAYMENT_STEP_3,
                event_label: eventType,
            };
        default:
            return {};
    }
};

export const gaClickAmendStepButton = (step: PaymentStep): IPaymentGAParams =>
    gaClickAmendStep(step, EVENT_ACTION_AMEND_PAYMENT_TYPE.CONTINUE);

export const gaClickAmendStepTile = (step: PaymentStep, isExpanded: boolean): IPaymentGAParams => {
    const eventType = isExpanded ? EVENT_ACTION_AMEND_PAYMENT_TYPE.EXPAND : EVENT_ACTION_AMEND_PAYMENT_TYPE.COLLAPSE;

    return gaClickAmendStep(step, eventType);
};

export const gaTriggerPriceJumpPopup: IPaymentGAParams = {
    event_action: EVENT_ACTION_PRICE_JUMP_POPUP,
};

export const gaRefundAmendmentsSuccess = (paymentMethod: RefundPaymentMethod): IPaymentGAParams => ({
    event_action: EVENT_ACTION_REFUND_AMENDMENTS,
    event_label: paymentMethod,
});

const getPaymentSuccessEventLabel = (paymentMethod: IPaymentMethod) => {
    if (paymentMethod.cash === 0) {
        return EVENT_ACTION_PAYMENT_SUCCESS_SOURCE_TYPE.CREDIT;
    }

    if (paymentMethod.credit === 0) {
        return EVENT_ACTION_PAYMENT_SUCCESS_SOURCE_TYPE.CARD;
    }

    return EVENT_ACTION_PAYMENT_SUCCESS_SOURCE_TYPE.CARD_CREDIT;
};

const DECIMAL_SCALE = 100;

export const gaPaymentSuccess = (
    payments: IPaymentHistoryItem[],
    currency: string,
    cardType?: string,
    isApplePay?: boolean,
): IPaymentGAParams => {
    const paymentMethod = getPaymentLabelForSuccess(payments);
    const cardNumber = payments?.[0]?.card?.number;
    const cardTypeInferred = cardType || (cardNumber && getCardType(cardNumber));

    const generic_value_1 = isApplePay ? `Apple Pay - ${cardTypeInferred}` : cardTypeInferred;

    return {
        event_action: EVENT_ACTION_PAYMENT_SUCCESS,
        event_label: getPaymentSuccessEventLabel(paymentMethod),
        event_value: Math.round((paymentMethod.cash + paymentMethod.credit) * DECIMAL_SCALE) / DECIMAL_SCALE,
        ...(generic_value_1 !== undefined && { generic_value_1 }),
        generic_value_2: currency,
    };
};

const checkPayFullDetails = (payDetails?: TPayDetails | IPayDetailsFullWithApplePay | IApplePayBookingPaymentInfo) =>
    payDetails && 'amount' in payDetails;

export const gaBalancePaymentSuccess = (
    payDetails?: TPayDetails | IPayDetailsFullWithApplePay | IApplePayBookingPaymentInfo,
    currency?: CurrencyCode,
    bookingReference?: string,
    isApplePay?: boolean,
): IPaymentGAParams => {
    const paymentMethod = getPaymentLabelForBalancePaymentSuccess(payDetails);

    const cardType = (payDetails as IPayDetailsFull)?.cardType;

    return {
        event_action: EVENT_ACTION_PAYMENT_SUCCESS,
        event_label: getPaymentSuccessEventLabel(paymentMethod),
        event_value: Math.round((paymentMethod.cash + paymentMethod.credit) * DECIMAL_SCALE) / DECIMAL_SCALE,
        ...(checkPayFullDetails(payDetails) && { generic_value_1: isApplePay ? `Apple Pay - ${cardType}` : cardType }),
        generic_value_2: currency,
        generic_value_3: bookingReference,
    };
};

export enum HolidaysUnavailableReason {
    GENERAL = 'general',
    BOARD = 'room and board',
    FLIGHT = 'flight',
    DATES = 'dates',
    TRANSFER = 'transfer',
    SEATS = 'seats',
}

export const getAmendUnavailabilityReasonFromProduct = (
    product: Nullable<AmendmentType>,
): HolidaysUnavailableReason => {
    switch (product) {
        case AmendmentType.Transfer:
            return HolidaysUnavailableReason.TRANSFER;
        case AmendmentType.Dates:
            return HolidaysUnavailableReason.DATES;
        case AmendmentType.Flight:
            return HolidaysUnavailableReason.FLIGHT;
        case AmendmentType.RoomAndBoard:
            return HolidaysUnavailableReason.BOARD;
        case AmendmentType.Seats:
            return HolidaysUnavailableReason.SEATS;
        default:
            return HolidaysUnavailableReason.GENERAL;
    }
};

export const gaHolidaysUnavailable = (reason: HolidaysUnavailableReason): IPaymentGAParams => ({
    event_action: EVENT_ACTION_HOLIDAY_UNAVAILABLE,
    event_label: reason,
});

export const gaLoginSuccess: IPaymentGAParams = {
    event_action: EVENT_ACTION_LOGIN_SUCCESSFUL,
};

export const gaClickPayAmend = (paymentOption: PaymentOption): IPaymentGAParams => {
    if (paymentOption === PaymentOption.Full || paymentOption === PaymentOption.Part) {
        return {
            event_action: EVENT_ACTION_PAY_FOR_CHANGE_NOW,
        };
    }

    return {
        event_action: EVENT_ACTION_PAY_FOR_CHANGE_LATER,
    };
};
