import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IHeroBannerFields } from 'models/data/IHeroBannerFields';
import BannerBrightnessType from 'models/enum/banners/BrightnessType';
import BannerCTAType from 'models/enum/banners/CTAType';
import BannerTextColor from 'models/enum/banners/TextColor';
import GenericHeroBannerVariant from 'models/enum/GenericHeroBannerVariant';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

export const ctaMock = mockSitecoreField(
    mockSitecoreLinkField('https://web.holidays.easyjet.com{cta}', 'have first good holiday', SitecoreLinkType.Anchor),
);

export const cta2Mock = mockSitecoreField(
    mockSitecoreLinkField(
        'https://web.holidays.easyjet.com{cta}2',
        'have second great holiday',
        SitecoreLinkType.Internal,
    ),
);

export const cta3Mock = mockSitecoreField(
    mockSitecoreLinkField(
        'https://web.holidays.easyjet.com{cta}3',
        'have third great holiday',
        SitecoreLinkType.Internal,
    ),
);

export const getMockedBannerFields = (): IHeroBannerFields => ({
    Icon: mockSitecoreField(mockSitecoreImageField('Icon')),
    Image: mockSitecoreField(mockSitecoreImageField('image')),
    MobileOnlyImage: mockSitecoreField(mockSitecoreImageField('MobileOnlyImage')),
    Title: mockSitecoreField('Title'),
    Subtitle: mockSitecoreField('Subtitle'),
    Subtitle2: mockSitecoreField(''),
    Subtitle3: mockSitecoreField(''),
    ExtraContent2: mockSitecoreField(''),
    ExtraContent3: mockSitecoreField(''),
    TopText: mockSitecoreField('TopText'),
    TextBeforeNumber: mockSitecoreField('$'),
    TextBeforeNumber2: mockSitecoreField(''),
    TextBeforeNumber3: mockSitecoreField(''),
    NumberValue: mockSitecoreField('60'),
    NumberValue2: mockSitecoreField('10'),
    NumberValue3: mockSitecoreField('20'),
    TextAfterNumber: mockSitecoreField('pp'),
    TextAfterNumber2: mockSitecoreField(''),
    TextAfterNumber3: mockSitecoreField(''),
    BottomText: mockSitecoreField('BottomText'),
    BottomLinedText: mockSitecoreField('BottomLinedText'),
    PromoLogo: mockSitecoreField(mockSitecoreImageField('logo')),
    CTA: ctaMock,
    CTA2: cta2Mock,
    CTA3: cta3Mock,
    Variant: mockSitecoreField('' as GenericHeroBannerVariant),
    CreditText: mockSitecoreField('text'),
    CreditLink: mockSitecoreField(mockSitecoreLinkField('link', 'link', SitecoreLinkType.Anchor)),
    CreditIcon: mockSitecoreField(mockSitecoreImageField('image ')),
    Brightness: mockSitecoreField(BannerBrightnessType.Light),
    CTAType: mockSitecoreField(BannerCTAType.Orange),
    TextColor: mockSitecoreField(BannerTextColor.Black),
});
