import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface IMediaContentCarouselFields {
    fields: {
        Image: ISitecoreField<ISitecoreImage>;
    };
}
