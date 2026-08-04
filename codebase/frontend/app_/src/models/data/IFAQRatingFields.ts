import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface IFAQRatingFields {
    IsRatingEnabled: ISitecoreField<string>;
    IsTextFieldEnabled: ISitecoreField<string>;
    NegativeActiveIcon: ISitecoreField<ISitecoreImage>;
    NegativeInactiveIcon: ISitecoreField<ISitecoreImage>;
    PositiveActiveIcon: ISitecoreField<ISitecoreImage>;
    PositiveInactiveIcon: ISitecoreField<ISitecoreImage>;
    RatingQuestion: ISitecoreField<string>;
    ThumbDownPlaceholder: ISitecoreField<string>;
    ThumbUpPlaceholder: ISitecoreField<string>;
}

export interface IFAQRatingById {
    id: string;
    rating: boolean;
}
