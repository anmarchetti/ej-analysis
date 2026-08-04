import {
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
    TSitecoreMultiList,
} from 'models/sitecore/generic/ISitecoreField';

export enum CreditExpiresBannerContentType {
    CreditExpiresCurrentMarket = 'Credit Expires Current Market',
    CreditExpiresOnMultipleMarkets = 'Credit Expires On Multiple Markets',
    CreditExpiresOnOtherMarkets = 'Credit Expires On Other Markets',
}
export interface ICreditExpiresContentFields {
    ContentType: ISitecoreField<CreditExpiresBannerContentType>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export interface ICreditExpiresBannerFields {
    BookHolidayCTA: ISitecoreField<ISitecoreLink>;
    Children: TSitecoreMultiList<ICreditExpiresContentFields>;
    Icon: ISitecoreField<ISitecoreImage>;
}
