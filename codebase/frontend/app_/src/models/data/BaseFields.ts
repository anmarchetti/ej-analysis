import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface IPopupFields extends IPrimaryButtonFields, ISecondaryButtonFields {
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
}

export interface IPrimaryButtonFields {
    PrimaryButtonLabel: ISitecoreField<string>;
    PrimaryButtonScreenReaderText: ISitecoreField<string>;
}

export interface ISecondaryButtonFields {
    SecondaryButtonLabel: ISitecoreField<string>;
    SecondaryButtonScreenReaderText: ISitecoreField<string>;
}
