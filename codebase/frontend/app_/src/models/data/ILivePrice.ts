import { CurrencyCode } from 'code/currency';
import { IDestinationFields } from 'models/data/IDestinationFields';
import { HolidayThemesTypesCodes } from 'models/enum/HolidayThemes';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import { ISitecoreCompositeField, ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import { IExtraLuggageInfo } from './IFlightExtras';
import { ISinglePromotionInfo } from './IPromocode';
import { ITouristTax } from './ITouristTax';
import { ITransfer } from './ITransfer';
import { IQueryRoom } from './URLQueryRooms';

export interface ILivePrice extends ITouristTax {
    accomCode: string;
    currency: CurrencyCode;
    extraLuggageInfo: IExtraLuggageInfo;
    geog: string;
    price: number;
    pricePP: number;
    promotion: ISinglePromotionInfo;
    searchCriteria: {
        adults: number;
        childAges: number[];
        children: number;
        date: string;
        depPt: string;
        duration: number;
        id: string;
        infants: number;
        range: {
            end: string;
            start: string;
        };
        themeTypesCodes: HolidayThemesTypesCodes[];
    };
    transfers: ITransfer[];
    promoCollections?: OfferPromotionCodes[];
}

export interface ILivePriceCriteria {
    destinationCode: string;
    relatedRegions?: string[];
    searchName?: string;
}

export interface ILivePriceOptionFields {
    LinkedDestination?: ISitecoreCompositeField<IDestinationFields>[];
    LivePriceNamedSearches?: ISitecoreCompositeField<ILivePriceNamedSearchesFields>;
}

export interface ILivePriceNamedSearchesFields {
    Name: ISitecoreField<string>;
}

export interface ISearchQueryParams {
    accomCode: string;
    endDate: Nullable<Date>;
    geog: string;
    rooms: Partial<IQueryRoom>[];
    startDate: Nullable<Date>;
}
