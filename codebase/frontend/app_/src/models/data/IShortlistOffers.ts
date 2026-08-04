import { TCmsLang } from 'code/cmsLang';
import { ShortlistType } from 'models/enum/ShortlistType';

import { IOffer } from './IOffer';
import { MarketCode } from './MarketSettings';
import { IQueryRoom } from './URLQueryRooms';

export interface IShortlistOffers {
    offers: IOffer[];
    status: {
        hasDiscont: boolean;
        maxPrice: number;
        maxPricePP: number;
        minPrice: number;
        minPricePP: number;
        total: number;
    };
}

export interface IShortlistOfferReqBody {
    accommodationId: string;
    boardType: string;
    childAges: string;
    departure: string;
    duration: number[];
    flexDays: number;
    geography: string;
    iArrAirport: string;
    iDepAirport: string;
    iTheme: string;
    inboundRouteId: string;
    isExt: boolean;
    outboundRouteId: string;
    packageId: string;
    room: Omit<IQueryRoom, 'childrenAges'>[];
    startDate: string;
    transfer: string;
}

export interface IShortlistStatus {
    savedOffersCount: number;
    createdID?: string;
}

export interface IRecentShortlistedItem {
    accomCode: string | undefined;
    packageId: string | undefined;
    shortListId: string | undefined;
    shortListLang: TCmsLang | undefined;
    shortListMarketCode: MarketCode | undefined;
    shortListType: ShortlistType;
}
