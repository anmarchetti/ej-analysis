import {
    ISitecoreCompositeField,
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
} from 'models/sitecore/generic/ISitecoreField';
import { IAncillariesFields } from 'frontend/components/common/Ancillaries/Ancillaries';

import { IAncillariesContentItem } from './IAncillariesContentItem';
import { IPassengerFields } from './ISeatsAndBagsFields';
import { ISitecoreChildren } from './ISitecoreChildren';

interface ICabinBagsBannerFields {
    ButtonLabel: ISitecoreField<string>;
    Link: ISitecoreField<ISitecoreLink>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export interface ICabinBagsFields extends IAncillariesFields {
    AddButtonLabel: ISitecoreField<string>;
    AddCabinBagLabel: ISitecoreField<string>;
    AddLCBLabel: ISitecoreField<string>;
    AddMaxCabinBagsButton: ISitecoreField<string>;
    CabinBagPriceLabel: ISitecoreField<string>;
    Children: ISitecoreChildren<IPassengerFields>[];
    CollapseClose: ISitecoreField<string>;
    CollapseOpen: ISitecoreField<string>;
    CollapseOpenViewOnly: ISitecoreField<string>;
    DescriptionWithoutPrice: ISitecoreField<string>;
    IncludedBagsLabel: ISitecoreField<string>;
    IncludedIcon: ISitecoreField<ISitecoreImage>;
    IncludedLabel: ISitecoreField<string>;
    IncludedWithInfantLabel: ISitecoreField<string>;
    NoMoreLCBCapacityLabel: ISitecoreField<string>;
    OutlineBannerTextContent: ISitecoreField<string>;
    OverheadAddedIcon: ISitecoreField<ISitecoreImage>;
    OverheadBagAddedDropdownLabel: ISitecoreField<string>;
    OverheadBagAddedLabel: ISitecoreField<string>;
    OverheadBagDropdownLabel: ISitecoreField<string>;
    OverheadBagLabel: ISitecoreField<string>;
    OverheadIcon: ISitecoreField<ISitecoreImage>;
    SmallBagDropdownLabel: ISitecoreField<string>;
    SmallBagDropdownWithInfantLabel: ISitecoreField<string>;
    SpeedyBoardingIcon: ISitecoreField<ISitecoreImage>;
    SpeedyBoardingLabel: ISitecoreField<string>;
    UrgencyMessageCabinBagsThreshold: ISitecoreField<number>;
    UrgencyMessageText: ISitecoreField<string>;
    UrgencyMessageTooltipText: ISitecoreField<string>;
    // the same as UrgencyMessageText but in english, for analytic non-english markets
    itemUrgencyMessageText: ISitecoreField<string>;
    CabinBagsAlmostFullBanner?: ISitecoreCompositeField<ICabinBagsBannerFields>;
    CabinBagsFullBanner?: ISitecoreCompositeField<ICabinBagsBannerFields>;
    CabinBagsFullWithHLBanner?: ISitecoreCompositeField<ICabinBagsBannerFields>;
    CabinBagsUnavailableCTAContent?: ISitecoreCompositeField<ICabinBagsBannerFields>;
    CabinBagsUnavailableContent?: ISitecoreCompositeField<ICabinBagsBannerFields>;
    DefaultContent?: ISitecoreCompositeField<IAncillariesContentItem>;
    InternalFlightBanner?: ISitecoreCompositeField<ICabinBagsBannerFields>;
    LuxuryContent?: ISitecoreCompositeField<IAncillariesContentItem>;
    OutOfSyncBanner?: ISitecoreCompositeField<ICabinBagsBannerFields>;
    RequestFailureBanner?: ISitecoreCompositeField<ICabinBagsBannerFields>;
    UnavailableLCBContent?: ISitecoreCompositeField<IAncillariesContentItem>;
    UnavailablePostBookContent?: ISitecoreCompositeField<ICabinBagsBannerFields>;
}
