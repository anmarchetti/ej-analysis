import { IAmendBookingPromoBreakDown, IAmendPaymentInfo } from 'models/data/IAmendBookingFlights';
import { TAmendTaxesAndFees } from 'models/data/IAmendTaxAndFeeItem';
import { IBookingInfoPayload } from 'models/data/IBookingInfo';
import { IOffer } from 'models/data/IOffer';
import { IBillingInfo } from 'models/data/payment/BillingInfo';
import { IQueryRoom } from 'models/data/URLQueryRooms';

export interface IRequestDatesResponseData {
    amendDates: {
        date: string;
        isAvailable: boolean;
    }[];
    availableHoliday: boolean;
}

export interface IRequestDatesQuery {
    accommodationId: string;
    departure: string;
    duration: string;
    endDate: string;
    startDate: string;
    rooms?: IQueryRoom[];
}

export interface ISubmitDatesQuery {
    accomId: string;
    boardType: string;
    bookingRef: string;
    duration: number;
    inboundDepTime: string;
    outboundDepTime: string;
    rooms: IQueryRoom[];
    selectedDate: string;
    transferCode: string;
}

export interface IRequestValidateDatesParams {
    accomId: string;
    boardType: string;
    duration: number;
    room: { adults: number; children: number; infants: number; roomCode: string }[];
    selectedDate: string;
    transferCode: string;
    childAges?: number[];
    inboundDepTime?: string;
    outboundDepTime?: string;
}

export interface IAmendDatesOfferPrices {
    amendmentDatesCharges: number;
    amendmentDatesFees: number;
    amendmentFlowCharges: number;
    bookingPrice: number;
    discountCode: string;
    offerPrice: number;
    amendmentPaymentInfo?: IAmendPaymentInfo;
    taxesAndFees?: TAmendTaxesAndFees;
}

export interface IAmendDatesResponseItem extends IAmendDatesOfferPrices {
    allowPayBalanceDueDate: string;
    bookingRef: string;
    isSeatsPriceChanged: boolean;
    isSeatsUnavailable: boolean;
    offer: IOffer;
    promoCodeBreakDown: IAmendBookingPromoBreakDown;
    seatsChangeEnabled: boolean;
    unhappyPathOffer: boolean;
}

export interface IAmendDatesSubmitPayload extends IBookingInfoPayload {
    amendDatesOffer: IAmendDatesResponseItem;
    billingInfo?: IBillingInfo;
}
