import { IFilterOrderSetting, ITimeFilterOptionSetting } from 'models/data/IFilters';
import { TAlternativeFlightsSortOrderItem } from 'models/enum/AlternativeFlightsSortBy';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface IAmendPromoFields {
    DowngradePromoText: ISitecoreField<string>;
    ErrorPromoText: ISitecoreField<string>;
    NotValidPromoText: ISitecoreField<string>;
    UpgradePromoText: ISitecoreField<string>;
}

export interface IAmendFlightsFields extends IAmendPromoFields {
    AlternativeFlightsTitle: ISitecoreField<string>;
    FeePriceLabel: ISitecoreField<string>;
    FiltersOrder: IFilterOrderSetting[];
    IsShowPreFilteredMessage: ISitecoreField<boolean>;
    NoFlightsAvailableText: ISitecoreField<string>;
    NoFlightsAvailableTitle: ISitecoreField<string>;
    PopupCancelCTA: ISitecoreField<string>;
    PopupText: ISitecoreField<string>;
    PopupTitle: ISitecoreField<string>;
    PriceTooltipPromoSeatsText: ISitecoreField<string>;
    PriceTooltipText: ISitecoreField<string>;
    SignpostIcon: ISitecoreField<ISitecoreImage>;
    SignpostText: ISitecoreField<string>;
    SignpostTitle: ISitecoreField<string>;
    SortDefault: TAlternativeFlightsSortOrderItem;
    SortOrder: TAlternativeFlightsSortOrderItem[];
    TimeFilters: ITimeFilterOptionSetting[];
    Title: ISitecoreField<string>;
}
