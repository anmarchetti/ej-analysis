import {
    ISitecoreCompositeField,
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
} from 'models/sitecore/generic/ISitecoreField';

export interface IHolidayWithConfidenceFields {
    After: ISitecoreCompositeField<IConfidenceModuleFields>;
    Before: ISitecoreCompositeField<IConfidenceModuleFields>;
    DaysSeparator: ISitecoreField<number>;
}

export interface IConfidenceModuleFields {
    ModuleIcon: ISitecoreField<ISitecoreImage>;
    ModuleLinkLabel: ISitecoreField<string>;
    ModuleText: ISitecoreField<string>;
    ModuleTitle: ISitecoreField<string>;
    PopupEndText: ISitecoreField<string>;
    PopupLink: ISitecoreField<ISitecoreLink>;
    PopupList: ISitecoreCompositeField<IPopupListItemFields>[];
    PopupSubtitle: ISitecoreField<string>;
    PopupTitle: ISitecoreField<string>;
}

export interface IPopupListItemFields {
    Icon: ISitecoreField<ISitecoreImage>;
    Text: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}
