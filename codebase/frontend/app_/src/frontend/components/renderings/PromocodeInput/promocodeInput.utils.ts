import { CurrencyCode } from 'code/currency';
import { MarketStore } from 'frontend/store/base';
import { getFormattedValidationErrors } from 'frontend/utils/formattingAPIErrors.utils';
import { ApiError } from 'models/data/ApiError';
import { IValidationError } from 'models/data/validation/IValidationError';
import { ApiErrors } from 'models/enum/ApiErrors';
import HttpsStatusCodes from 'models/enum/HttpStatusCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ValidationType } from 'models/enum/ValidationType';

export const getPromocodeErrors = (
    { errorCode, innerErrors, response }: ApiError,
    currency: CurrencyCode | undefined,
    formatMoney: MarketStore['formatMoney'],
    getPhrase: (key: string) => string,
): IValidationError[] => {
    if (errorCode === ApiErrors.PromocodeValidation) {
        return getFormattedValidationErrors(innerErrors, formatMoney, currency).map(({ message }) => ({
            errorMessage: message,
            rawErrorMessage: message,
            trigger: ValidationType.OnType,
        }));
    }

    let errorMessage = SitecoreDictionary.PaymentFailureMessagesWrongDiscount;
    let rawErrorMessage = innerErrors?.length > 0 ? innerErrors[0].message : undefined;

    if (errorCode === ApiErrors.OfferNotAvailable) {
        errorMessage = SitecoreDictionary.PaymentFailureMessagesOfferUnavailable;
        rawErrorMessage = getPhrase(SitecoreDictionary.PaymentFailureMessagesOfferUnavailable);
    }

    if (errorCode === ApiErrors.WrongDiscountNotFound) {
        errorMessage = SitecoreDictionary.PaymentFailureMessagesWrongDiscountNotFound;
        rawErrorMessage = undefined;
    }

    if (errorCode === ApiErrors.WrongDiscountExceeded) {
        errorMessage = SitecoreDictionary.PaymentFailureMessagesWrongDiscountExceeded;
        rawErrorMessage = undefined;
    }

    if (errorCode === ApiErrors.VoucherExpired) {
        errorMessage = SitecoreDictionary.RedeemVoucherErrorMessagesVoucherExpiredHTML;
        rawErrorMessage = undefined;
    }

    if (errorCode === ApiErrors.VoucherWasRedeemedBySomeoneElse) {
        errorMessage = SitecoreDictionary.RedeemVoucherErrorMessagesRedeemedBySomeoneHTML;
        rawErrorMessage = undefined;
    }

    if (errorCode === ApiErrors.VoucherWasRedeemedByYou) {
        errorMessage = SitecoreDictionary.RedeemVoucherErrorMessagesRedeemedByYouHTML;
        rawErrorMessage = undefined;
    }

    if (response?.status === HttpsStatusCodes.Unauthorized || errorCode === ApiErrors.PromocodeIsRequired) {
        errorMessage = SitecoreDictionary.RedeemVoucherErrorMessagesDefaultErrorHTML;
        rawErrorMessage = undefined;
    }

    return [
        {
            errorMessage: errorMessage,
            rawErrorMessage: rawErrorMessage,
            trigger: ValidationType.OnType,
        },
    ];
};
