import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface IDestinationCarouselCard {
    Code: ISitecoreField<string>;
    Image: ISitecoreField<ISitecoreImage>;
    KSPs: ISitecoreCompositeField<IKSPs>[];
    Name: ISitecoreField<string>;
    PageCategory: ISitecoreField<string>;
}

export interface IKSPs {
    Icon: ISitecoreField<ISitecoreImage>;
    KSP: ISitecoreField<string>;
}
