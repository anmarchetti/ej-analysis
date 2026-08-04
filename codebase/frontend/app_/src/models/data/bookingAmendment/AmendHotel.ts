import { IAmendPaymentCharges, IAmendPaymentInfo } from 'models/data/IAmendBookingFlights';
import { TAmendTaxesAndFees } from 'models/data/IAmendTaxAndFeeItem';
import { IFilters } from 'models/data/IFilters';
import { IExtraLuggageInfo } from 'models/data/IFlightExtras';
import { IHotel } from 'models/data/IHotel';
import { IAccomData, IUnit } from 'models/data/IOffer';
import { IOffersStatus } from 'models/data/IOffersStatus';
import { ITransfer } from 'models/data/ITransfer';

export interface IAmendHotelOffer {
    accom: IAccomData<IUnit>;
    amendmentChargesInfo: IAmendPaymentCharges;
    amendmentPaymentInfo: IAmendPaymentInfo;
    extraLuggageInfo: IExtraLuggageInfo;
    hotel: IHotel;
    transfers: ITransfer[];
    taxesAndFees?: TAmendTaxesAndFees;
}

export interface IAmendHotelOfferResponce {
    amendHotelOffers: IAmendHotelOffer[];
    bookingRef: string;
    filters: IFilters[];
    status: IOffersStatus;
}
