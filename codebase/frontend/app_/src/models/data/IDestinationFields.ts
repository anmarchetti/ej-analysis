import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface IDestinationFields extends IRegionsFields, IResortsFields {
    Code: ISitecoreField<string>;
    Image: ISitecoreField<ISitecoreImage>;
    Name: ISitecoreField<string>;
    PageCategory: ISitecoreField<string>;
    FeaturedHotelBookFromTitle?: ISitecoreField<string>;
    FeaturedHotelDate?: ISitecoreField<string>;
    FeaturedHotelDateText?: ISitecoreField<string>;
    GiataCode?: ISitecoreField<string>;
    StarRating?: ISitecoreField<string>;
}

export interface IRegionsFields {
    Regions?: ISitecoreCompositeField<IDestinationFields>[];
}

export interface IResortsFields {
    Resorts?: ISitecoreCompositeField<IDestinationFields>[];
}
