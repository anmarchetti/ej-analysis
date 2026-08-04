import { CurrencyCode } from 'code/currency';
import { ApiError } from 'models/data/ApiError';
import { ApiErrors } from 'models/enum/ApiErrors';
import HttpsStatusCodes from 'models/enum/HttpStatusCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ValidationType } from 'models/enum/ValidationType';

import { innerErrorMock } from './__mocks__/promocodeInput.mocks';
import { getPromocodeErrors } from './promocodeInput.utils';

const formatMoneyMock = jest.fn();
const getPhraseMock = jest.fn(p => p);

describe('promocodeInput.utils', () => {
    describe('getPromocodeErrors', () => {
        it('should errors for the PromocodeValidation error', () => {
            expect(
                getPromocodeErrors(
                    {
                        errorCode: ApiErrors.PromocodeValidation,
                        innerErrors: [innerErrorMock],
                        response: { status: HttpsStatusCodes.Unauthorized },
                    } as ApiError,
                    CurrencyCode.GBP,
                    formatMoneyMock,
                    getPhraseMock,
                ),
            ).toEqual([
                {
                    errorMessage: innerErrorMock.message,
                    rawErrorMessage: innerErrorMock.message,
                    trigger: ValidationType.OnType,
                },
            ]);
        });

        it('should errors for the WrongDiscount error', () => {
            expect(
                getPromocodeErrors(
                    {
                        errorCode: ApiErrors.WrongDiscount,
                        innerErrors: [innerErrorMock],
                        response: { status: HttpsStatusCodes.OK },
                    } as ApiError,
                    CurrencyCode.GBP,
                    formatMoneyMock,
                    getPhraseMock,
                )[0],
            ).toEqual({
                errorMessage: SitecoreDictionary.PaymentFailureMessagesWrongDiscount,
                rawErrorMessage: innerErrorMock.message,
                trigger: ValidationType.OnType,
            });
        });

        it('should errors for the OfferNotAvailable error', () => {
            expect(
                getPromocodeErrors(
                    {
                        errorCode: ApiErrors.OfferNotAvailable,
                        innerErrors: [innerErrorMock],
                        response: { status: HttpsStatusCodes.OK },
                    } as ApiError,
                    CurrencyCode.GBP,
                    formatMoneyMock,
                    getPhraseMock,
                )[0],
            ).toEqual({
                errorMessage: SitecoreDictionary.PaymentFailureMessagesOfferUnavailable,
                rawErrorMessage: SitecoreDictionary.PaymentFailureMessagesOfferUnavailable,
                trigger: ValidationType.OnType,
            });
        });

        it('should errors for the WrongDiscountNotFound error', () => {
            expect(
                getPromocodeErrors(
                    {
                        errorCode: ApiErrors.WrongDiscountNotFound,
                        innerErrors: [innerErrorMock],
                        response: { status: HttpsStatusCodes.OK },
                    } as ApiError,
                    CurrencyCode.GBP,
                    formatMoneyMock,
                    getPhraseMock,
                )[0],
            ).toEqual({
                errorMessage: SitecoreDictionary.PaymentFailureMessagesWrongDiscountNotFound,
                rawErrorMessage: undefined,
                trigger: ValidationType.OnType,
            });
        });

        it('should errors for the WrongDiscountExceeded error', () => {
            expect(
                getPromocodeErrors(
                    {
                        errorCode: ApiErrors.WrongDiscountExceeded,
                        innerErrors: [innerErrorMock],
                        response: { status: HttpsStatusCodes.OK },
                    } as ApiError,
                    CurrencyCode.GBP,
                    formatMoneyMock,
                    getPhraseMock,
                )[0],
            ).toEqual({
                errorMessage: SitecoreDictionary.PaymentFailureMessagesWrongDiscountExceeded,
                rawErrorMessage: undefined,
                trigger: ValidationType.OnType,
            });
        });

        it('should errors for the VoucherExpired error', () => {
            expect(
                getPromocodeErrors(
                    {
                        errorCode: ApiErrors.VoucherExpired,
                        innerErrors: [innerErrorMock],
                        response: { status: HttpsStatusCodes.OK },
                    } as ApiError,
                    CurrencyCode.GBP,
                    formatMoneyMock,
                    getPhraseMock,
                )[0],
            ).toEqual({
                errorMessage: SitecoreDictionary.RedeemVoucherErrorMessagesVoucherExpiredHTML,
                rawErrorMessage: undefined,
                trigger: ValidationType.OnType,
            });
        });

        it('should errors for the VoucherWasRedeemedBySomeoneElse error', () => {
            expect(
                getPromocodeErrors(
                    {
                        errorCode: ApiErrors.VoucherWasRedeemedBySomeoneElse,
                        innerErrors: [innerErrorMock],
                        response: { status: HttpsStatusCodes.OK },
                    } as ApiError,
                    CurrencyCode.GBP,
                    formatMoneyMock,
                    getPhraseMock,
                )[0],
            ).toEqual({
                errorMessage: SitecoreDictionary.RedeemVoucherErrorMessagesRedeemedBySomeoneHTML,
                rawErrorMessage: undefined,
                trigger: ValidationType.OnType,
            });
        });

        it('should errors for the VoucherWasRedeemedByYou error', () => {
            expect(
                getPromocodeErrors(
                    {
                        errorCode: ApiErrors.VoucherWasRedeemedByYou,
                        innerErrors: [innerErrorMock],
                        response: { status: HttpsStatusCodes.OK },
                    } as ApiError,
                    CurrencyCode.GBP,
                    formatMoneyMock,
                    getPhraseMock,
                )[0],
            ).toEqual({
                errorMessage: SitecoreDictionary.RedeemVoucherErrorMessagesRedeemedByYouHTML,
                rawErrorMessage: undefined,
                trigger: ValidationType.OnType,
            });
        });

        it('should errors for the PromocodeIsRequired error', () => {
            expect(
                getPromocodeErrors(
                    {
                        errorCode: ApiErrors.PromocodeIsRequired,
                        innerErrors: [innerErrorMock],
                        response: { status: HttpsStatusCodes.OK },
                    } as ApiError,
                    CurrencyCode.GBP,
                    formatMoneyMock,
                    getPhraseMock,
                )[0],
            ).toEqual({
                errorMessage: SitecoreDictionary.RedeemVoucherErrorMessagesDefaultErrorHTML,
                rawErrorMessage: undefined,
                trigger: ValidationType.OnType,
            });
        });

        it('should errors for the Unauthorized response status code', () => {
            expect(
                getPromocodeErrors(
                    {
                        errorCode: ApiErrors.OfferNotAvailable,
                        innerErrors: [innerErrorMock],
                        response: { status: HttpsStatusCodes.Unauthorized },
                    } as ApiError,
                    CurrencyCode.GBP,
                    formatMoneyMock,
                    getPhraseMock,
                )[0],
            ).toEqual({
                errorMessage: SitecoreDictionary.RedeemVoucherErrorMessagesDefaultErrorHTML,
                rawErrorMessage: undefined,
                trigger: ValidationType.OnType,
            });
        });
    });
});
