import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export type TLanguageSelectorOption = ISitecoreCompositeField<{
    Code: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    IconCircle: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
}>;
