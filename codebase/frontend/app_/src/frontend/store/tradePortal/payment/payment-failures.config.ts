import { ApiErrors } from 'models/enum/ApiErrors';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export const commitBookingErrorCode = '0x1';
export const priceChangeToleranceError = 'E1369';

export interface ITradePortalPaymentFailureItem {
    code: string;
    descriptionKey: string;
    isFatal: boolean;
    messageKey: string;
    correlationId?: string;
}

export const cancelPaymentError = {
    messageKey: SitecoreDictionary.PaymentFailureMessagesCancelPayment,
    descriptionKey: SitecoreDictionary.PaymentFailureMessagesCancelPaymentDescriptionHTML,
    isFatal: true,
    code: '105',
};

export const bookingTransfersError = {
    messageKey: SitecoreDictionary.PaymentFailureMessagesNoTransferOption,
    descriptionKey: SitecoreDictionary.PaymentFailureMessagesNoTransferOptionDescriptionHTML,
    isFatal: false,
    code: ApiErrors.BookingTransferIsNotAvailable,
};

export const commitBookingError = {
    code: commitBookingErrorCode,
    descriptionKey: SitecoreDictionary.PaymentFailureMessagesAtcomErrorDescriptionHTML,
    isFatal: true,
    messageKey: SitecoreDictionary.PaymentFailureMessagesAtcomError,
};

export const failuresConfig = [
    /** Authorizations Failure */
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidCardNumber,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidCardNumberDescriptionHTML,
        isFatal: false,
        code: '201',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidExpiryDate,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidExpiryDateDescriptionHTML,
        isFatal: false,
        code: '202',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesCardExpired,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesCardExpiredDescriptionHTML,
        isFatal: false,
        code: '203',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidIssueNumber,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidIssueNumberDescriptionHTML,
        isFatal: false,
        code: '204',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidCvv,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidCvvDescriptionHTML,
        isFatal: false,
        code: '205',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidNameOnCard,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidNameOnCardDescriptionHTML,
        isFatal: false,
        code: '254',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesRefused,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesRefusedDescriptionHTML,
        isFatal: false,
        code: '1000',
    },

    /** Cannot Cancel Payment */
    cancelPaymentError,

    /** Fraud payment */
    {
        messageKey: '',
        descriptionKey: '',
        isFatal: true,
        code: ApiErrors.DenyPayment,
    },

    /** Wrong / Expired / Disabled  Discount */
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesWrongDiscount,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesWrongDiscountDescriptionHTML,
        isFatal: true,
        code: ApiErrors.WrongDiscount,
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesWrongDiscountNotFound,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesWrongDiscountNotFoundDescription,
        isFatal: true,
        code: ApiErrors.WrongDiscountNotFound,
    },

    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesWrongDiscountExceeded,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesWrongDiscountExceededDescription,
        isFatal: true,
        code: ApiErrors.WrongDiscountExceeded,
    },

    /** Complete Payment Error */
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesPaymentGatewayUnavailable,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesPaymentGatewayUnavailableDescriptionHTML,
        isFatal: true,
        code: '998',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesOfflineNotAccepted,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesOfflineNotAcceptedDescriptionHTML,
        isFatal: true,
        code: '19',
    },

    /** General Payment Error */
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidPaymentId,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidPaymentIdDescriptionHTML,
        isFatal: true,
        code: '10',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesPaymentNotFound,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesPaymentNotFoundDescriptionHTML,
        isFatal: true,
        code: '11',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidCurrency,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidCurrencyDescriptionHTML,
        isFatal: true,
        code: '12',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidAmount,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidAmountDescriptionHTML,
        isFatal: true,
        code: '13',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidRequest,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidRequestDescriptionHTML,
        isFatal: true,
        code: '14',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidPaymentMethod,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidPaymentMethodDescriptionHTML,
        isFatal: true,
        code: '15',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidReference,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidReferenceDescriptionHTML,
        isFatal: true,
        code: '16',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidMarket,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidMarketDescriptionHTML,
        isFatal: true,
        code: '17',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidDepartureDate,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidDepartureDateDescriptionHTML,
        isFatal: true,
        code: '18',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInternalError,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInternalErrorDescriptionHTML,
        isFatal: true,
        code: '999',
    },
    {
        messageKey: SitecoreDictionary.PaymentFailureMessagesInvalidPayerRequest,
        descriptionKey: SitecoreDictionary.PaymentFailureMessagesInvalidPayerRequestDescriptionHTML,
        isFatal: true,
        code: '261',
    },
] as ITradePortalPaymentFailureItem[];

export const defaultFailure = {
    messageKey: SitecoreDictionary.PaymentFailureMessagesNotLoggedInGateway,
    descriptionKey: SitecoreDictionary.PaymentFailureMessagesNotLoggedInGatewayDescriptionHTML,
    isFatal: false,
    code: 'N/A',
} as ITradePortalPaymentFailureItem;
