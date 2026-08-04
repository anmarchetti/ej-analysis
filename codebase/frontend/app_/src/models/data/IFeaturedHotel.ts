import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import { ILivePrice } from './ILivePrice';

export interface IFeaturedHotel {
    BookFrom: string;
    BookFromText: string;
    BookFromTitle: string;
    Country: string;
    GiataCode: string;
    Image: ISitecoreField<ISitecoreImage>;
    Name: string;
    Region: string;
    StarRating: string;
    Url: string;
}
export interface IFeaturedHotelsWithPrice extends IFeaturedHotel {
    isPriceValid: boolean;
    livePrice: Nullable<ILivePrice>;
}

export enum FeaturedHotelsMaxItems {
    Big = 4,
    Small = 2,
}
