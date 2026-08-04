import { Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';

export interface IRecommendedHotelsParams {
    DisplaySponsoredLabel: TSitecoreCheckboxValue;
    IsLeftAligned: TSitecoreCheckboxValue;
    IsNarrowContainer: TSitecoreCheckboxValue;
    IsWhiteBackground: string;
    MaximumNumberSlider: string;
    MinimumNumberSlider: string;
    OpenLinksInNewTab: TSitecoreCheckboxValue;
    ShowSponsoredHotelsOnly: TSitecoreCheckboxValue;
}
export interface ILuggageInformationFields {
    DefaultText: ISitecoreField<string>;
    HoldBagText: ISitecoreField<string>;
}

export interface IRecommendedHotelsFields extends IRecommendedHotelsGrid, ILuggageInformationFields {
    Title: ISitecoreField<string>;
    BD4PlacementId?: ISitecoreField<Bd4TravelPlacementId>;
}

interface IRecommendedHotelsGrid {
    InitialNumberOfHotelsDesktop: ISitecoreField<number>;
    InitialNumberOfHotelsMobile: ISitecoreField<number>;
    MinNumberOfHotelsToShowComponent: ISitecoreField<number>;
    NumberOfRequestedHotelBD4: ISitecoreField<number>;
}

export type TRecommendedHotelsComponent = ISitecoreComponent<IRecommendedHotelsFields, IRecommendedHotelsParams>;
