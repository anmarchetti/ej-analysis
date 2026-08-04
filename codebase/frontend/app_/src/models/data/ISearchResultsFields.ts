import { TAlternativeFlightsSortOrderItem } from 'models/enum/AlternativeFlightsSortBy';
import { ISortOrderItem } from 'models/sitecore/ISortOrderItem';

import { ILuggageInformationFields } from './IRecommendedHotels';

export interface ISearchResultsFields extends ILuggageInformationFields {
    AlternativeFlightsDefaultSort: Nullable<TAlternativeFlightsSortOrderItem>;
    AlternativeFlightsSortOrders: Nullable<TAlternativeFlightsSortOrderItem[]>;
    SortOrders: ISortOrderItem[];
}
