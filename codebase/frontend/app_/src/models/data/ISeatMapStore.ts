import { CurrencyCode } from 'code/currency';
import { IPaymentInfo } from 'models/data/IPaymentInfo';
import { IPriceBreakdownItem } from 'models/data/IValidPackageInfo';
import { GuestType } from 'models/enum/GuestType';
import { QueryParamName } from 'models/enum/QueryParamName';
import { SeatType } from 'models/enum/SeatType';

import { IGuestPassenger } from './ILeadPassenger';

export interface ISeatMapStore {
    rows: ISeatMapRow[];
}

export interface ISeatMapRow {
    blocks: ISeat[];
    isExitRow: boolean;
    isOverWing: boolean;
    priceBandName: string;
    rowNumber: number;
}

export interface ISeat {
    seats: ISingleSeat[];
}

export interface ISingleSeat {
    currency: string;
    isAisleSeat: boolean;
    isAvailable: boolean;
    isAvailableForChild: boolean;
    isAvailableForInfant: boolean;
    isExitRow: boolean;
    isMiddleSeat: boolean;
    isPremiumSeat: boolean;
    isWindowSeat: boolean;
    number: string;
    price: number;
    priceBand: SeatType;
    priceBandId: number;
    priceWithCreditCardFee: number;
    products: ISeatProduct[];
    seatAccess: string;
}

export interface ISeatProduct {
    id: string;
    icon?: string;
    name?: string;
}

export interface IPassengerSeat {
    price: number;
    priceBand: SeatType;
    products: ISeatProduct[];
    seatNumber: string;
    hasSecondaryStyle?: boolean;
}

export interface IPassengerSeats {
    inboundSeats: IPassengerSeat[];
    outboundSeats: IPassengerSeat[];
}

export interface ISelectedSeat {
    sectorId: string;
    flightNumber?: string;
    isSeatReservationPossible?: boolean;
    seats?: ISelectedSeatDetails[];
}

export interface ISelectedSeatDetails {
    paxIndex: number;
    seatNumber: string;
    price?: number;
    priceBand?: SeatType;
    priceDiff?: number;
    products?: ISeatProduct[];
}

export interface IFlightInitialSelection {
    flightDate: string;
    flightNumber: string;
    seats: {
        passengerId: number;
        price: Nullable<number>;
        products: Nullable<ISeatProduct[]>;
        seatNumber: string;
        type: GuestType;
        name?: string;
        withInfant?: boolean;
    }[];
}

export interface IFlightSeatsResponse {
    aircraftType: IAircraftType;
    currencyCode: CurrencyCode;
    isWrapped: string;
    rows: ISeatMapRow[];
    visibleProducts: ISeatProduct[];
}

export interface IAircraftType {
    code: string;
    name: string;
}

export type TSelectedSeatsFromQuery = Record<`${QueryParamName.SeatsSectorIdPrefix}${number}`, string>;

export interface IAmendSeatsResponse {
    amendmentCharges: number;
    newSeatSelection: ISelectedSeat[];
    paymentInfo?: IPaymentInfo;
    priceBreakdown?: IPriceBreakdownItem[];
    tradeAgentPriceBreakdown?: IPriceBreakdownItem[];
}

export interface IAmendSeatsPayload extends IAmendSeatsResponse {
    guests: IGuestPassenger[];
    inboundFlightNum: string;
    outboundFlightNum: string;
    prevSeatSelection: ISelectedSeat[];
    validatedSeatsWithPrices: ISelectedSeat[];
}
