import { Guid } from 'guid-typescript';

import { DATE_FORMATS } from 'code/dates';
import { webApiUrls } from 'code/endpoints';
import { Tokens } from 'code/tokens';
import { IAssistedTravelRequest, IGuestWithAssistedTravelRequest } from 'models/data/assistedTravelRequest';
import {
    IBookingAccom,
    IBookingInfo,
    IBookingInfoPayload,
    IBookingRefund,
    TBookingPayloadAccom,
} from 'models/data/IBookingInfo';
import { IGuestPassenger } from 'models/data/ILeadPassenger';
import { IRoute } from 'models/data/IRoute';
import { RouteDirection } from 'models/enum/RouteDirection';
import SiteSettings from 'models/enum/SiteSettings';
import { BookingTypeForFeedback } from 'models/enum/tracking/BookingType';
import { GenericValue } from 'models/enum/tracking/GenericValues';
import { TViewBookingRedirectsPaths, ViewBookingPageStates } from 'models/enum/ViewBookingPageStates';

import { getRouteByDirection } from './airports.utils';
import { formatDateL10n, formatDateToQuery, getDaysDifferenceRoundedFloor } from './date.utils';
import { containsFAndHPromoCode, containsLuxuryPromoCode } from './offer.utils';
import { getFullPassengerName } from './passenger.utils';
import { Tokenizer } from './tokenizer';

export const getBookingPayload = (booking: IBookingInfo): IBookingInfoPayload => {
    const bookingPackage: IBookingInfoPayload['package'] = { ...booking?.package };
    const accom: Partial<IBookingAccom> = { ...bookingPackage?.accom };

    //Removing excessive information to prevent "payload too large" error
    delete accom?.hotel;
    delete accom?.rooms;
    delete accom?.memos;

    bookingPackage.accom = accom as TBookingPayloadAccom;
    const { outbound } = getRouteByDirection(booking.package?.transport?.routes);
    const departureDate = outbound ? formatDateToQuery(outbound.depDate) : '';

    return {
        bookingReference: booking.bookingReference,
        lastName: getLeadGuestLastName(booking),
        date: departureDate,
        package: bookingPackage,
        discountCode: booking.discountCode,
        paymentInfo: booking.paymentInfo,
        promoCollections: booking.promoCollections,
    };
};

export const getBookingRoute = (booking: IBookingInfo, direction: RouteDirection): Nullable<IRoute> =>
    booking.package?.transport?.routes?.find(r => r.direction === direction) || null;

export const getPdfLinks = (booking: IBookingInfo, type: 'booking' | 'paymentReceipt' = 'booking'): string => {
    if (booking) {
        const { date, bookingReference, lastName } = getBookingPayload(booking);

        if (date && bookingReference && lastName) {
            return type === 'booking'
                ? webApiUrls.pdfBooking()
                : webApiUrls.pdfPaymentReceipt(date, bookingReference, lastName);
        }
    }

    return '';
};

export interface IBookingPdfRequest {
    bookingReference: string;
    date: string;
    lastName: string;
}

/**
 * Build the request body for the booking confirmation PDF POST endpoint.
 * Sensitive values are sent in the body instead of URL query params (WP-921).
 */
export const getPdfRequestBody = (booking: IBookingInfo): IBookingPdfRequest | undefined => {
    if (booking) {
        const { date, bookingReference, lastName } = getBookingPayload(booking);

        if (date && bookingReference && lastName) {
            return { bookingReference, lastName, date };
        }
    }

    return undefined;
};

export const getBookingPdfFileName = (): string => `${Guid.create().toString()}.pdf`;

export const getTotalBookingRefund = (isCreditOnly: boolean, refund?: IBookingRefund): number => {
    if (!refund) return 0;

    if (isCreditOnly) {
        return refund.credit.credit || 0;
    }

    return (refund.refund.credit || 0) + (refund.refund.cash || 0);
};

export const getBookingDestination = (booking: IBookingInfo): string => {
    const accomHotel = booking?.package?.accom?.hotel;
    const region = accomHotel?.location?.name || booking?.hotel?.location?.name || '';
    const country = accomHotel?.country?.name || booking?.hotel?.country?.name || '';
    const destination = (region ? `${region},` : '') + country;

    return destination;
};

export const getBookingDestinationForTracking = (booking: Nullable<IBookingInfo>): string => {
    if (!booking) {
        return GenericValue.Generic;
    }

    const accomHotel = booking?.package?.accom?.hotel;
    const region = accomHotel?.location?.name || booking?.hotel?.location?.name || '';
    const country = accomHotel?.country?.name || booking?.hotel?.country?.name || '';
    const resort = accomHotel?.resort?.name || booking?.hotel?.resort?.name || '';

    return (
        [country, region, resort].filter(Boolean).join('-').replaceAll(/\s/g, '-').toLowerCase() || GenericValue.Generic
    );
};

export const getCheckInLink = (
    booking: IBookingInfo,
    getSetting: (setting: SiteSettings) => string,
): Nullable<string> => {
    const { guests, bookingReference } = booking;
    const leadPassenger = guests.find(guest => guest.isLead);

    if (!bookingReference || !leadPassenger?.lastName) {
        return null;
    }

    return Tokenizer.replaceTokens(getSetting(SiteSettings.CheckInLink), {
        [Tokens.ReferenceNumber]: bookingReference,
        [Tokens.Surname]: leadPassenger.lastName,
    });
};

/**SER-333 Fix for the case when Atcom return wrong format of date and as a result API sent to us 01.01.0001 as a date.
 * This is the fix till atcom make their fix
 */
export const getValidBalanceDueDate = (balanceDueDate: string, startDate: string, daysBeforeDep: number): string => {
    const INVALID_ATCOM_DATE = '0001-01-01T00:00:00+00:00';

    if (balanceDueDate === INVALID_ATCOM_DATE) {
        const result = new Date(startDate);
        result.setDate(result.getDate() - daysBeforeDep);

        return result.toISOString();
    }

    return balanceDueDate;
};

export const getLeadGuestLastName = (booking: IBookingInfo): string =>
    booking.guests.find((g: IGuestPassenger) => g.isLead)?.lastName || '';

export const getDaysBeforeDeparture = (booking: IBookingInfo): number | undefined => {
    const outboundRoute = getBookingRoute(booking, RouteDirection.Outbound);
    const departureDate = outboundRoute?.depDate;

    if (!departureDate) {
        return undefined;
    }

    const currentDate = new Date();

    const depDate = new Date(departureDate);
    const daysBeforeDeparture = getDaysDifferenceRoundedFloor(depDate, currentDate);

    return daysBeforeDeparture;
};

export const isFlightDeparted = (booking: IBookingInfo): boolean => {
    const departureDate = getBookingRoute(booking, RouteDirection.Outbound)?.depDate;

    return departureDate ? new Date(departureDate) < new Date() : false;
};

export const getViewBookingRedirectLink = (
    pageName: ViewBookingPageStates,
    viewBookingLinks: TViewBookingRedirectsPaths,
): string => {
    let redirectLink: string;
    switch (pageName) {
        case ViewBookingPageStates.PreTravel:
            redirectLink = viewBookingLinks.preTravel;

            break;

        case ViewBookingPageStates.InDestination:
            redirectLink = viewBookingLinks.inDestination;

            break;

        case ViewBookingPageStates.ViewBooking:
            redirectLink = viewBookingLinks.viewBooking;

            break;

        case ViewBookingPageStates.PostTravel:
            redirectLink = viewBookingLinks.postTravel;

            break;

        default:
            redirectLink = viewBookingLinks.viewBooking;
    }

    return redirectLink;
};

export const matchGuestsToAssistedTravelRequest = (
    guests: IGuestPassenger[],
    assistedTravelRequests: IAssistedTravelRequest,
    getPhrase: (key: string) => string,
): IGuestWithAssistedTravelRequest[] => {
    if (guests.length === 0) {
        return [];
    }

    return guests.map(guest => {
        const passengerName = `${guest.firstName} ${guest.lastName}`;
        const assistedTravelRequest = assistedTravelRequests?.passengers.find(
            passenger => passenger.passengerName === passengerName,
        );

        return {
            passenger: guest,
            passengerName: getFullPassengerName(guest, getPhrase),
            requestedAt: assistedTravelRequest?.hasRequest
                ? formatDateL10n(assistedTravelRequest.requestedAt, DATE_FORMATS.dateWithAbbrMonthName)
                : '',
        };
    });
};

export const callChatBot = (e: MouseEvent): void => {
    e.preventDefault();

    const shadowRoot = document.getElementById('gct-chatbot')?.shadowRoot;

    if (shadowRoot) {
        const chatbotDiv = shadowRoot.getElementById('chatbotContainer');

        const computedStyle = chatbotDiv && globalThis.getComputedStyle(chatbotDiv);

        if (computedStyle?.display === 'none') {
            window['toggleChatbot']?.();
        }
    }
};

export const getBookingType = (booking: IBookingInfo): string => {
    if (booking.isExternalAgency) {
        return BookingTypeForFeedback.ExternalAgency;
    }

    if (containsLuxuryPromoCode(booking?.promoCollections || [])) {
        return BookingTypeForFeedback.Luxury;
    }

    if (containsFAndHPromoCode(booking?.promoCollections || [])) {
        return BookingTypeForFeedback.FlightAndHotel;
    }

    return BookingTypeForFeedback.HolidaysBooking;
};
