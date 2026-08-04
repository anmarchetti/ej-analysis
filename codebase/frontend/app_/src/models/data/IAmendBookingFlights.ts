import { IApiInnerError } from 'models/data/ApiErrorData';

import { ITransport } from './IOffer';
import { TPromoCodeStatusesType } from './IPromocode';
import { ISelectedSeat } from './ISeatMapStore';

export interface IFeePerPerson {
    feesCount: number;
    feesPerPersonAmount: number;
}

export interface IAmendPaymentCharges {
    amendmentCharges: number;
    bookingPrice: number;
    extraLuggagePrice: number;
    fullAmendmentCharges: number;
    fullOfferPpPrice: number;
    fullOfferPrice: number;
    offerPpPrice: number;
    offerPrice: number;
    promoCodeBreakDown: IAmendBookingPromoBreakDown;
    seatsPrice: number;
}

export interface IAmendPaymentInfo {
    amendmentCharges: number;
    amendmentChargesWithoutFees: number;
    feesPerPersons: IFeePerPerson[];
    packagePriceWithFees: number;
    packagePriceWithoutFees: number;
    totalFeesAmount: number;
}

export interface IAmendTransport extends ITransport {
    packagePrice: number;
    packagePricePP: number;
    promoCodeBreakDown: IAmendBookingPromoBreakDown;
    amendmentCharges?: number;
    amendmentPaymentInfo?: IAmendPaymentInfo;
    notAvailable?: boolean;
    seatSelection?: ISelectedSeat[];
}

export interface IAmendBookingFlightsResponse {
    transports: IAmendTransport[];
}

export interface IAmendBookingPromoBreakDown {
    due: number;
    promoCodeStatus: TPromoCodeStatusesType;
    errors?: IApiInnerError[];
    promoCode?: string;
}

export interface IAmendBookingFlightPromoDataResponse {
    transports: IAmendTransport[];
}
