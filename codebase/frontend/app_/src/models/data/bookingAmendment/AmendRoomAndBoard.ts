import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IAmendBookingPromoBreakDown, IAmendPaymentInfo } from 'models/data/IAmendBookingFlights';
import { TAmendTaxesAndFees } from 'models/data/IAmendTaxAndFeeItem';
import { IUnit } from 'models/data/IOffer';
import { IBillingInfo } from 'models/data/payment/BillingInfo';

export interface IRoomVariant {
    amendmentCharges: number; // The price between room variants
    amendmentPaymentInfo: IAmendPaymentInfo;
    boardType: string;
    bookingPrice: number; // Booking's price
    fullAmendmentCharges: number; // How much a customer pay for this changes
    offerPrice: number; // Offer's price
    roomType: string;
    units: IUnit[];
    offerPricePp?: number;
    promoCodeBreakDown?: IAmendBookingPromoBreakDown;
    seatsPrice?: number;
    taxesAndFees?: TAmendTaxesAndFees;
}

export interface IAmendRoomAndBoardInfoResponse {
    roomVariants: IRoomVariant[];
    upsellAmount: number;
}

export interface IAmendHotelRoomAndBoardOffer {
    amendHotelOffer: IAmendHotelOffer;
    bookingReference: string;
}
export interface IAmendHotelRoomAndBoardInfoResponse {
    amendHotelOffers: IAmendHotelRoomAndBoardOffer[];
    upsellAmount: number;
}

export interface IAmendRoomAndBoardOffer {
    selectedRoomVariant: IRoomVariant;
}

export interface IAmendRoomAndBoardSubmitPayload {
    amendRoomAndBoardOffer: IAmendRoomAndBoardOffer;
    billingInfo?: IBillingInfo;
    isMultiroom?: boolean;
}
