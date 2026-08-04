import { CancelTokenSource } from 'axios';

import { TCmsLang } from 'code/cmsLang';
import { CurrencyCode } from 'code/currency';
import { ILateRoomCheckout } from 'models/data/IExtras';
import { IExcludingTouristTaxPrice } from 'models/data/ITouristTax';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import { SearchType } from 'models/enum/SearchType';
import { ShortlistType } from 'models/enum/ShortlistType';

import { IAirportParking } from './externalExtras/IAirportParking';
import { IExtraLuggageInfo } from './IFlightExtras';
import {
    IBoardType,
    IEcoFacility,
    IHotel,
    IRoomType,
    IShortenHotel,
    ITheme,
    IThemeType,
    IUnitOccupation,
    TRoomAlteration,
} from './IHotel';
import { ILivePrice } from './ILivePrice';
import { ISinglePromotionInfo } from './IPromocode';
import { IRoute } from './IRoute';
import { ISelectedSeat } from './ISeatMapStore';
import { ITouristTax } from './ITouristTax';
import { ITransfer } from './ITransfer';
import { MarketCode } from './MarketSettings';
import { IQueryRoom } from './URLQueryRooms';

export interface IBaseOffer extends ITouristTax {
    accom: IAccomData<IUnit>;
    date: string;
    extraLuggageInfo: IExtraLuggageInfo;
    hasDiscountedBoardUpgrade: boolean;
    hasDistressedFlights: boolean;
    id: string;
    price: number;
    pricePP: number;
    stay: number;
    transfers: ITransfer[];
    transport: ITransport;
    airportParking?: IAirportParking;
    altAcc?: IAltAccommodation[];
    currency?: { code: CurrencyCode };
    defaultTransferCode?: string;
    deposit?: number;
    discountAmount?: number;
    discountPercentage?: number;
    distanceToOriginalAirport?: number;
    ecoFacility?: IEcoFacility;
    errataInfo?: string[];
    giataCode?: string;
    hasFreeBoardUpdate?: boolean;
    isSponsored?: boolean;
    lateRoomCheckout?: Nullable<ILateRoomCheckout>;
    livePrice?: ILivePrice;
    otherRoutes?: string[];
    promoCollections?: OfferPromotionCodes[];
    promotion?: ISinglePromotionInfo;
    seatSelection?: ISelectedSeat[];
    seatsPrice?: number;
    shortlist?: IShortlist;
    totalPrice?: number;
    tracking?: {
        campaignInfo?: string[];
    };
    transferPrice?: number;
}

export interface IOfferWithoutAltBoards extends IOfferWithHotelData, IBaseOffer {}

export interface IOfferWithShortenHotelData extends IBaseOffer {
    hotel: Nullable<IShortenHotel>;
}

export interface IOffer extends IOfferWithoutAltBoards {
    altBoards: IAltBoard[];
}

export interface IOfferWithHotelData extends IBaseOffer {
    hotel: Nullable<IHotel>;
}

export interface IOfferInfo {
    offer: IOfferWithShortenHotelData;
}

export interface ITransferOffer extends IOffer {
    defaultTransferCode: string;
}

export interface IAccomData<T> {
    code: string;
    date: string;
    id: string;
    isExt: boolean;
    packageId: string;
    prom: string;
    stay: number;
    unit: T[];
    hotelName?: string;
    latitude?: number;
    longitude?: number;
    theme?: ITheme;
    type?: IThemeType;
}

export interface ITransport {
    routes: IRoute[];
    errataFlightInfo?: string[];
}

export interface IBaseUnit {
    board: string;
    code: string;
    occupation: IUnitOccupation;
    price: number;
    pricePP: number;
    avail?: number;
    boardDiscountPercentage?: number;
    currency?: CurrencyCode;
    discount?: number;
    discountPP?: number;
    freeNights?: IFreeNightsInfo;
    isFreeBoardUpgrade?: boolean;
    isFreeForKids?: boolean;
}

export interface IUnit extends IBaseUnit {
    boardType: IBoardType;
    roomType: IRoomType;
    accommodationId?: string;
    isExt?: boolean;
    isRefundable?: boolean;
    itemId?: string;
    originalCode?: string;
    packageId?: string;
    requireBoardAlteration?: string;
    requireMoreRoomAlteration?: boolean;
}

export interface IAltBoard extends IBoardType, IExcludingTouristTaxPrice {
    isExt: boolean; // for board alteration
    price: number;
    pricePP: number;
    roomAlterations: TRoomAlteration;
}

export type TAllBoards = Array<IAltBoard | IBoardType>;

export interface IFreeNightsInfo {
    freeNightsIncluded: number;
    freeNightsPromo: IFreeNightsPromoItem[];
}

export interface IFreeNightsPromoItem {
    currentFree: number;
    currentStay: number;
    minStay: number;
    travelEndDate: string;
    travelStartDate: string;
}

export interface IAltAccommodation {
    accomCode: string;
    packageId: string;
}

export interface IShortlist {
    id?: string;
    language?: TCmsLang;
    marketCode?: MarketCode;
    type?: ShortlistType;
}

export interface IFetchOffersParams {
    departure: string; // can be ALL or list of airport codes
    destinationCodesQuery: string;
    durations: string[];
    rooms: IQueryRoom[];
    startDate: Date;
    cancelSource?: CancelTokenSource;
    destination?: string;
    endDate?: Date;
    isMonthSearch?: boolean;
    offers?: string;
    page?: number;
    searchType?: SearchType;
    withoutDestinationFilters?: boolean;
}
