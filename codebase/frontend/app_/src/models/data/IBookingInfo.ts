import { CurrencyCode } from 'code/currency';
import { ILateRoomCheckout } from 'models/data/IExtras';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import { ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

import { IAirportParking } from './externalExtras/IAirportParking';
import { IAmendPaymentTrackingPayload } from './tracking/IProduct';
import { IExtraLuggageInfo } from './IFlightExtras';
import { IHotel, IRoom } from './IHotel';
import { IGuestPassenger, ILeadPassenger } from './ILeadPassenger';
import { IMemo } from './IMemo';
import { IPaymentInfo } from './IPaymentInfo';
import { IRoute } from './IRoute';
import { ISelectedSeat } from './ISeatMapStore';
import { IPackageTaxesAndFees } from './ITouristTax';
import { ITransfer } from './ITransfer';
import { IExtraPriceBreakdown, IGuest, IPriceBreakdownItem } from './IValidPackageInfo';

/**
 * Used when booking is not yet committed
 */
export interface IPreBookingInfo {
    bookingStatus: string;
    extraLuggageInfo: IExtraLuggageInfo;
    guests: IGuest[];
    isLoggedInAsLeadPassenger: boolean;
    package: IBookingPackage;
    transfers: ITransfer[];
    airportParking?: IAirportParking;
    hotel?: IHotel;
    isExternalAgency?: boolean;
    lateRoomCheckout?: ILateRoomCheckout;
    promoCollections?: OfferPromotionCodes[];
}

export interface IBookingInfo extends IPreBookingInfo {
    bookingReference: string;
    cancellationIsBlocked: boolean;
    extraLuggageInfo: IExtraLuggageInfo;
    guests: IGuestPassenger[];
    healthEntryRequirements: IHealthEntryRequirement[];
    leadPassenger: ILeadPassenger;
    marketCode: string;
    paymentInfo: IPaymentInfo;
    priceBreakdown: IPriceBreakdownItem[];
    prom: string;
    refund: IBookingRefund;
    requestId: string;
    sessionId: string;
    tradeAgentPriceBreakdown: IPriceBreakdownItem[];
    amendmentInfo?: IAmendmentInfo;
    b2BData?: { level: string };
    cancellationDate?: string;
    cancelledBookingSummary?: ICancelledBookingSummary;
    currency?: { code: CurrencyCode };
    discountCode?: string;
    disruptionInfo?: IViewBookingDisruptionInfo;
    errataInfo?: string[];
    extraPriceBreakdown?: IExtraPriceBreakdown[];
    isDestinationRulesApplied?: boolean;
    isPrivate?: boolean;
    seatSelection?: ISelectedSeat[];
    specialRequests?: IBookingSpecialRequest[];
    taxesAndFees?: IPackageTaxesAndFees[];
    wasCredited?: boolean;
    wasRefunded?: boolean;
}

export type TBookingPayloadAccom = Omit<IBookingAccom, 'hotel' | 'rooms'>;

export interface IBookingInfoPayload {
    bookingReference: string;
    date: string;
    lastName: string;
    package: Omit<IBookingPackage, 'accom'> & {
        accom: TBookingPayloadAccom;
    };
    paymentInfo: IBookingInfo['paymentInfo'];
    discountCode?: string;
    promoCollections?: OfferPromotionCodes[];
    trackingData?: IAmendPaymentTrackingPayload;
}

export interface ICancelledBookingSummary {
    cashRefundAmount: number;
    creditRefundAmount: number;
    currency: CurrencyCode;
    totalRefundAmount: number;
}

export interface IBookingAccom {
    code: string;
    endDate: string;
    hotel: IHotel;
    isExt: boolean;
    rooms: IRoom[];
    startDate: string;
    memos?: IMemo[];
    touristTax?: number;
}

export interface IBookingPackage {
    accom: IBookingAccom;
    location: {
        city: string;
        country: string;
        region: string;
    };
    transport: {
        routes: IRoute[];
        errataFlightInfo?: string[];
    };
}

export interface IBookingRefund {
    credit: {
        isEligible: boolean;
        cash?: number;
        credit?: number;
        lostCreditsIfCancelled?: string;
    };
    refund: {
        isEligible: boolean;
        cash?: number;
        credit?: number;
    };
}

export interface IBookingSpecialRequest {
    code: string;
    displayName: string;
    groupCode: string;
    name: string;
}

export interface IHealthEntryRequirement {
    description: string;
    title: string;
    trackingLabel: string;
    cta?: ISitecoreLink;
    icon?: string;
    image?: string;
}
export interface IAmendmentInfo {
    amendBookingStatus: Array<AmendBookingStatus>;
    booking: boolean;
    canBookingCancelled: boolean;
    changeDates: boolean;
    isHotelChangeEnabled: boolean;
    memo: boolean;
    pax: { amendAllow: boolean; amendNameOnly: boolean; nameChangedTimes: number };
    roomAndBoard: boolean;
    route: boolean;
    seats: boolean;
    specialRequest: boolean;
    transfer: {
        amendAllow: boolean;
        downgradeAllow: boolean;
    };
}

export interface ISpecialRequestAlert {
    description?: string;
    message?: string;
}

interface IViewBookingDisruptionInfo {
    itinerary: {
        carrierCode: string;
        disruptionLevel: DisruptionLevel;
        flightKey: string;
        flightNumber: string;
        paxIndex: number;
    }[];
}

export enum DisruptionLevel {
    One = '1',
    Two = '2',
    Three = '3',
}

export enum AmendmentType {
    Flight = 'Flight',
    Transfer = 'Transfer',
    Dates = 'Dates',
    Seats = 'Seats',
    RoomAndBoard = 'RoomAndBoard',
    Hotel = 'Hotel',
}

export enum BookingAllowanceRestrictions {
    ByOutOfSync = 'byOutOfSync',
    ByLeadPassenger = 'byLeadPassenger',
    ByAtcom = 'byAtcom',
    ByFlightManifested = 'byFlightManifested',
    ByTimeBound = 'byTimeBound',
    ByDisruption = 'byDisruption',
    ByMultipleRooms = 'byMultipleRooms',
    ByExternalAgency = 'byExternalAgency',
    ByAirportParking = 'byAirportParking',
    BySportEquipment = 'bySportEquipment',
    ByDisabledOnSite = 'byDisabledOnSite',
}

export type TAmendTransferRestrictions = {
    [BookingAllowanceRestrictions.ByTimeBound]: boolean;
};

export type TAmendPassengerRestrictions = {
    [BookingAllowanceRestrictions.ByOutOfSync]: boolean;
    [BookingAllowanceRestrictions.ByDisruption]: boolean;
    [BookingAllowanceRestrictions.ByAirportParking]: boolean;
};

export type TAmendFlightsRestrictions = {
    [BookingAllowanceRestrictions.ByOutOfSync]: boolean;
    [BookingAllowanceRestrictions.ByAtcom]: boolean;
    [BookingAllowanceRestrictions.ByFlightManifested]: boolean;
    [BookingAllowanceRestrictions.ByTimeBound]: boolean;
    [BookingAllowanceRestrictions.ByDisruption]: boolean;
    [BookingAllowanceRestrictions.ByAirportParking]: boolean;
};

export type TAmendDatesRestrictions = {
    [BookingAllowanceRestrictions.ByOutOfSync]: boolean;
    [BookingAllowanceRestrictions.ByDisruption]: boolean;
    [BookingAllowanceRestrictions.ByTimeBound]: boolean;
    [BookingAllowanceRestrictions.ByAirportParking]: boolean;
};

export type TAmendRoomAndBoardRestrictions = {
    [BookingAllowanceRestrictions.ByAtcom]: boolean;
    [BookingAllowanceRestrictions.ByTimeBound]: boolean;
    [BookingAllowanceRestrictions.ByMultipleRooms]: boolean;
    [BookingAllowanceRestrictions.ByDisruption]: boolean;
};

export type TAmendHotelRestrictions = {
    [BookingAllowanceRestrictions.ByMultipleRooms]: boolean;
    [BookingAllowanceRestrictions.BySportEquipment]: boolean;
    [BookingAllowanceRestrictions.ByTimeBound]: boolean;
    [BookingAllowanceRestrictions.ByDisabledOnSite]: boolean;
};

export type TViewBookingRestrictions = {
    [BookingAllowanceRestrictions.ByLeadPassenger]: boolean;
    [BookingAllowanceRestrictions.ByExternalAgency]: boolean;
};

export interface IWeatherData {
    rainyDays: number[];
    region: string;
    averageTemp?: number[];
}

export interface IChatbotDataLayerPayload {
    bookingDepDate: string;
    bookingGuestLastName: string;
    bookingReference: string;
}
