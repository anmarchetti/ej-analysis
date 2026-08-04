import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface IPromotionalMessageItem {
    displayName: string;
    id: string;
    name: string;
    fields?: {
        Color: ISitecoreField<string>;
        Description: ISitecoreField<string>;
        DescriptionAB: ISitecoreField<string>; // AB-TEST: EHD-67 SP: Search Card Redesign
        Icon: ISitecoreField<ISitecoreImage>;
        Title: ISitecoreField<string>;
        TitleAB: ISitecoreField<string>; // AB-TEST: EHD-67 SP: Search Card Redesign
        Tooltip: ISitecoreField<string>;
        Type: ISitecoreField<string>;
    };
}
