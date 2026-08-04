import { getCMSLang } from 'code/cmsLang';
import { PayStore } from 'frontend/store/holidays/payment/PayStore';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IBookingPaymentInfo, ICommitBookingRequestBody } from 'models/data/ICommitBookingRequestBody';
import { ILoginInfo } from 'models/data/ILoginInfo';
import { IPaymentInfo } from 'models/data/IPaymentInfo';
import { CardType } from 'models/enum/CardType';
import { IPaymentAuthorizationCode } from 'models/enum/IPaymentAuthorizationCode';
import SitePath from 'models/enum/SitePath';
import { SubmitPayload } from 'models/enum/SubmitPayload';

import { startNewTransaction } from './paymentTransaction';
import { submitForm } from './submitForm';
import { getBookingPayload } from './viewBooking.utils';

export function getCardType(cNumber: string) {
    const cardNumber = cNumber.replace(/ |-/g, '');

    if (cardNumber.startsWith('34') || cardNumber.startsWith('37')) {
        return CardType.AmericanExpress;
    }

    if (isInCardNUmberRange(cardNumber, 0, 4, 2221, 2720) || isInCardNUmberRange(cardNumber, 0, 2, 51, 55)) {
        return CardType.Mastercard;
    }

    if (isInCardNUmberRange(cardNumber, 0, 2, 56, 69) || cardNumber.startsWith('50')) {
        return CardType.Maestro;
    }

    if (cardNumber.startsWith('4')) {
        return CardType.Visa;
    }

    return CardType.InvalidType;
}

function isInCardNUmberRange(value: string, start: number, end: number, rangeMin: number, rangeMax: number) {
    const cardNumber = parseInt(value.substring(start, end));

    return cardNumber >= rangeMin && cardNumber <= rangeMax;
}

export function getBrowserInfo(language: string) {
    return {
        acceptHeader: 'application/json',
        userAgent: navigator.userAgent,
        colourDepth: screen.colorDepth,
        javaEnabled: navigator.javaEnabled(),
        javaScriptEnabled: true,
        language: getCMSLang(language),
        screenHeight: screen.height,
        screenWidth: screen.width,
        timeZoneOffset: new Date().getTimezoneOffset(),
    };
}

export function goPayRemainingBalance(booking: IBookingInfo, userData: Nullable<ILoginInfo>, basePath: string = '') {
    const bookingPayload = getBookingPayload(booking);

    startNewTransaction(booking.bookingReference);

    submitForm(`${basePath}${SitePath.PayBalance}`, SubmitPayload.PayBalanceInfo, {
        ...bookingPayload,
        billingInfo: !!userData
            ? {
                  fullName: `${userData.firstName} ${userData.lastName}`,
                  address: userData.address1,
                  address2: userData.address2,
                  city: userData.city,
                  postCode: userData.postalCode,
              }
            : undefined,
    });
}

export function getTotalPaidAmount(
    paymentInfo: Nullable<IPaymentInfo>,
    canBeGreaterThanTotal: boolean = false,
): number {
    const totalCost = paymentInfo?.totalPrice ?? 0;
    const totalPaid = paymentInfo?.paymentHistory?.reduce((sum, h) => (sum += h.amount), 0) ?? 0;

    // If customer paid more than booking costs, return total price
    if (!canBeGreaterThanTotal && totalPaid > totalCost) {
        return totalCost;
    }

    return totalPaid;
}

/** Calculates the amount paid using credit */
export function getCreditPaidAmount(paymentInfo: Nullable<IPaymentInfo>): number | null {
    if (paymentInfo?.paymentHistory && paymentInfo.paymentHistory.length > 0) {
        return paymentInfo.paymentHistory.reduce((sum, h) => (sum += h.isCredit ? h.amount : 0), 0);
    }

    return null;
}

/**
 * 3DS2: remove card number from 2nd and 3rd request
 *
 * @param payStore PayStore instance
 * @param bookingBody Booking model to update
 */
export function removeCardNumberFor3DS2(
    payStore: PayStore,
    bookingBody: ICommitBookingRequestBody,
): ICommitBookingRequestBody {
    const { paymentAuthorization } = payStore;
    const bookingBodyPaymentInfo = bookingBody.paymentInfo as IBookingPaymentInfo;

    if (
        paymentAuthorization &&
        (paymentAuthorization?.resultCode == IPaymentAuthorizationCode.Identify ||
            paymentAuthorization?.resultCode == IPaymentAuthorizationCode.Challenge)
    ) {
        bookingBodyPaymentInfo.cardNumber = '';
    }

    return bookingBody;
}

/**
 * 3DS1: use MD from first response if it's empty in bank postback response
 *
 * @param payStore Pay store instance
 * @param bookingBody Booking model to update
 */
export function fillMDFor3DS1(payStore: PayStore, bookingBody: ICommitBookingRequestBody) {
    const { paymentAuthorization, md } = payStore;
    const boookingBodyPaymentInfo = bookingBody.paymentInfo as IBookingPaymentInfo;

    if (paymentAuthorization && paymentAuthorization?.resultCode === IPaymentAuthorizationCode.Redirect) {
        if (!boookingBodyPaymentInfo.md) {
            boookingBodyPaymentInfo.md = md ?? '';
        }
    }

    return bookingBody;
}
