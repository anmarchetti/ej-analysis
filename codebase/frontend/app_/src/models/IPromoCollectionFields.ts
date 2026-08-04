import { ISitecoreField, ISitecoreImage } from './sitecore/generic/ISitecoreField';

export interface IPromoCollectionFields {
    Key: ISitecoreField<string>;
    PromotionCodes: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    Icon?: ISitecoreField<ISitecoreImage>;
    ShowNewLabel?: ISitecoreField<boolean>;
    TooltipText?: ISitecoreField<string>;
}
