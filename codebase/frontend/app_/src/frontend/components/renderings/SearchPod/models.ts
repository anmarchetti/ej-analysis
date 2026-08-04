import SearchPodAlternativeView from 'models/enum/SearchPodAlternativeView';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import { IAirportCountry } from 'models/sitecore/IAirportsData';

export interface ISearchPodSitecoreParameters {
    IsSticky: boolean;
    RedirectToSearchResults: boolean;
    ShowTitle: TSitecoreCheckboxValue;
    AlternativeView?: SearchPodAlternativeView;
}

export interface ISearchPodFields<T = {} | null> {
    airportsGroups: IAirportCountry[];
    data: T;
}

export interface ISearchPodDataFields {
    BackToSearchButtonText: ISitecoreField<string>;
    CheapestMonthDescriptionLabel: ISitecoreField<string>;
    CheapestMonthIcon: ISitecoreField<ISitecoreImage>;
    CheapestMonthLabel: ISitecoreField<string>;
    CheapestMonthUnavailableLabel: ISitecoreField<string>;
    ClearRecentSearches: ISitecoreField<string>;
    CloseRecentSearches: ISitecoreField<string>;
    CloseSearchCriteria: ISitecoreField<string>;
    CloseSearchCriteriaMobile: ISitecoreField<string>;
    DateTabLabel: ISitecoreField<string>;
    DisableRouteErrorTitle: ISitecoreField<string>;
    DurationLabel: ISitecoreField<string>;
    EditSearch: ISitecoreField<string>;
    EditSearchMobile: ISitecoreField<string>;
    // From field
    FromDropdownLabel: ISitecoreField<string>;
    FromDropdownStatusResultsCount: ISitecoreField<string>;
    FromFieldAriaDescription: ISitecoreField<string>;
    FromFieldDropdownToggle: ISitecoreField<string>;
    FromFieldPlaceholder: ISitecoreField<string>;
    InspirationCalloutHolidaysText: ISitecoreField<string>;
    InspirationCalloutHolidaysTitle: ISitecoreField<string>;
    InspirationCalloutTradePortalText: ISitecoreField<string>;
    InspirationCalloutTradePortalTitle: ISitecoreField<string>;
    LoadingLabel: ISitecoreField<string>;
    MonthTabLabel: ISitecoreField<string>;
    NewSearchLabel: ISitecoreField<string>;
    NewSearchLabelMobile: ISitecoreField<string>;
    NoResultFoundDescription: ISitecoreField<string>;
    NoResultFoundTitle: ISitecoreField<string>;
    PerfectHolidayTitle: ISitecoreField<string>;
    RecentSearchesLabel: ISitecoreField<string>;
    ResetToDefaultLabel: ISitecoreField<string>;
    ResultLabel: ISitecoreField<string>;
    ResultsLabel: ISitecoreField<string>;
    SearchToHotelMessageIcon: ISitecoreField<ISitecoreImage>;
    SearchToHotelMessageText: ISitecoreField<string>;
    SearchToHotelMessageTitle: ISitecoreField<string>;
    // To field
    ToAllGroupCheckboxLabel: ISitecoreField<string>;
    ToDropdownLabel: ISitecoreField<string>;
    ToFieldAriaDescription: ISitecoreField<string>;
    ToFieldDropdownToggle: ISitecoreField<string>;
    ToFieldLabel: ISitecoreField<string>;
    ToFieldPlaceholder: ISitecoreField<string>;
    TryAdjustDatesErrorMessage: ISitecoreField<string>;
    ViewRecentSearchesPlural: ISitecoreField<string>;
    ViewRecentSearchesSingular: ISitecoreField<string>;
    // When field
    WhenDropdownTitle: ISitecoreField<string>;
    WhenFieldAriaDescription: ISitecoreField<string>;
    WhenFieldLabel: ISitecoreField<string>;
    WhenFieldPlaceholder: ISitecoreField<string>;
    // Who field
    WhoDropdownGuestsLabel: ISitecoreField<string>;
    WhoDropdownGuestsLimitLabel: ISitecoreField<string>;
    WhoDropdownRoomsLabel: ISitecoreField<string>;
    WhoFieldDropdownLabel: ISitecoreField<string>;
    WhoFieldLabel: ISitecoreField<string>;
    WhoFieldPlaceholder: ISitecoreField<string>;
}
