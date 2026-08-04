import { PriceMathFunction } from 'models/enum/PriceMathFunction';
import { ISitecoreCompositeField, ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { ISortOrderItem } from 'models/sitecore/ISortOrderItem';

export interface IRequestedPriceFields {
    IsRequestedPriceEnabled: ISitecoreField<boolean>;
    IsRequestedPricePP: ISitecoreField<boolean>;
    IsRequestedPriceRounded: ISitecoreField<boolean>;
    PriceMathFunction: ISitecoreCompositeField<{
        Code: ISitecoreField<PriceMathFunction>;
        Name: ISitecoreField<string>;
    }>;
    SortOrder: ISortOrderItem;

    RequestedSearch?: {
        Destinations: string[];
        Name: string;
        Url: string;
    };
}
