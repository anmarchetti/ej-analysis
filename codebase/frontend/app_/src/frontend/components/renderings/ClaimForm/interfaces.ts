import {
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
    TSitecoreMultiList,
} from 'models/sitecore/generic/ISitecoreField';

export interface IClaimFormFields {
    EligibleItems: TSitecoreMultiList<IClaimFormItemFields>;
    EligibleItemsDescription: ISitecoreField<string>;
    EligibleItemsSectionTitle: ISitecoreField<string>;
    EnableFullOverviewPopup: ISitecoreField<boolean>;
    FormIcon: ISitecoreField<ISitecoreImage>;
    FormTitle: ISitecoreField<string>;
    FullOverviewPopupDescription: ISitecoreField<string>;
    FullOverviewPopupIcon: ISitecoreField<ISitecoreImage>;
    FullOverviewPopupTitle: ISitecoreField<string>;
    InstructionsSectionAdditionalDescription: ISitecoreField<string>;
    InstructionsSectionDescription: ISitecoreField<string>;
    InstructionsSectionTitle: ISitecoreField<string>;
    NotEligibleItems: TSitecoreMultiList<IClaimFormItemFields>;
    NotEligibleItemsDescription: ISitecoreField<string>;
    NotEligibleItemsSectionTitle: ISitecoreField<string>;
    OpenFormButtonLabel: ISitecoreField<string>;
    OpenFormButtonLink: ISitecoreField<ISitecoreLink>;
    SeeFullOverviewButtonLabel: ISitecoreField<string>;
}

export interface IClaimFormItemFields {
    ItemText: ISitecoreField<string>;
    ItemTooltip: ISitecoreField<string>;
}
