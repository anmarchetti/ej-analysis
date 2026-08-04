import BannerBrightnessType from 'models/enum/banners/BrightnessType';
import BannerCTAType from 'models/enum/banners/CTAType';
import BannerTextColor from 'models/enum/banners/TextColor';
import CountdownBannerVariant from 'models/enum/CountdownBannerVariant';
import GenericHeroBannerVariant from 'models/enum/GenericHeroBannerVariant';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ICreditAnchorFields } from 'frontend/components/common/CreditAnchor/CreditAnchor';

export interface IHeroBannerFields extends IBannerFields {
    BottomLinedText: ISitecoreField<string>;
    BottomText: ISitecoreField<string>;
    CTA2: ISitecoreField<ISitecoreLink>;
    CTA3: ISitecoreField<ISitecoreLink>;
    ExtraContent2: ISitecoreField<string>;
    ExtraContent3: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    NumberValue: ISitecoreField<string>;
    NumberValue2: ISitecoreField<string>;
    NumberValue3: ISitecoreField<string>;
    Subtitle2: ISitecoreField<string>;
    Subtitle3: ISitecoreField<string>;
    TextAfterNumber: ISitecoreField<string>;
    TextAfterNumber2: ISitecoreField<string>;
    TextAfterNumber3: ISitecoreField<string>;
    TextBeforeNumber: ISitecoreField<string>;
    TextBeforeNumber2: ISitecoreField<string>;
    TextBeforeNumber3: ISitecoreField<string>;
    Variant: ISitecoreField<GenericHeroBannerVariant>;
    PromoLogo?: ISitecoreField<ISitecoreImage>;
    TopText?: ISitecoreField<string>;
}

export interface ICountdownBannerFields extends IBannerFields {
    AdditionalInfo: ISitecoreField<string>;
    CountdownLabel: ISitecoreField<string>;
    CountdownVariant: ISitecoreField<CountdownBannerVariant>;
    DateTime: ISitecoreField<string>;
    HideAfterTimeElapsed: ISitecoreField<string>;
    IntroTitle: ISitecoreField<string>;
    UseCode: ISitecoreField<string>;
    UseCodeLabel: ISitecoreField<string>;
}

interface IBannerFields extends ICreditAnchorFields {
    Brightness: ISitecoreField<BannerBrightnessType>;
    CTA: ISitecoreField<ISitecoreLink>;
    CTAType: ISitecoreField<BannerCTAType>;
    Image: ISitecoreField<ISitecoreImage>;
    MobileOnlyImage: ISitecoreField<ISitecoreImage>;
    TextColor: ISitecoreField<BannerTextColor>;
    Subtitle?: ISitecoreField<string>;
    Title?: ISitecoreField<string>;
}

export interface IHeroBannerItem {
    fields: IHeroBannerFields | ICountdownBannerFields;
}
