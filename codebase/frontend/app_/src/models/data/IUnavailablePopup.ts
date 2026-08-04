import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

export interface IUnavailablePopupFields {
    Title: ISitecoreField<string>;
    CTA?: ISitecoreField<string>;
    CTALink?: ISitecoreField<ISitecoreLink>;
    Description?: ISitecoreField<string>;
    Icon?: ISitecoreField<ISitecoreImage>;
    NoOptionsCTA?: ISitecoreField<string>;
}
