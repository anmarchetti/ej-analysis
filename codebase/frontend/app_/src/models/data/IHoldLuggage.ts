import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import { ISitecoreChildren } from './ISitecoreChildren';

export interface ICheapestLuggage {
    name: string;
    price: number;
}

export interface IHoldLuggageLists {
    HoldLuggageItems: ISitecoreChildren<IHoldLuggageItemFields>[];
    SportEquipmentRestrictedSeasons: ISitecoreCompositeField<ISportEquipmentRestrictedSeasonsFields>;
    SportsEquipmentItems: ISitecoreChildren<IHoldLuggageItemFields>[];
    SportsEquipmentSubtitle: ISitecoreField<string>;
}

export interface IHoldLuggageItemFields {
    Code: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    IsLuggageItemEnabled: ISitecoreField<boolean>;
    Name: ISitecoreField<string>;
}

export interface ISportEquipmentRestrictedSeasonsFields {
    RestrictionSeasonsList: ISitecoreChildren<ISportEquipmentRestrictionSeasonFields>[];
}

export interface ISportEquipmentRestrictionSeasonFields {
    EndDate: ISitecoreField<string>;
    StartDate: ISitecoreField<string>;
}

export interface IHoldLuggagePaymentFields {
    IncludedLuggageName: ISitecoreField<string>;
    LuggageInfoTitle: ISitecoreField<string>;
    PramName: ISitecoreField<string>;
    SportEquipmentsLabel: ISitecoreField<string>;
}

export interface IHoldLuggageInfo {
    [key: string]: number;
}
