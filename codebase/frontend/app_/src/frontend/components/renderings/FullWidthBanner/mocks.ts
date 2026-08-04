import {
    mockSitecoreCompositeField,
    mockSitecoreField,
    mockSitecoreImageField,
    mockSitecoreLinkField,
} from 'frontend/utils/tests.utils';
import {
    ComponentVersion,
    CTAThemeType,
    IFullWidthBannerFields,
    PillColourVariant,
    TextAlignmentVariant,
    TFullWidthBannerProps,
} from 'models/data/IFullWithBanner';
import { TitleFontSizeMobileAndDesktop, TitleFontStyle } from 'models/enum/CustomisableComponentsParameters';

export const getMockFullWidthBannerProps = (): TFullWidthBannerProps => ({
    fields: mockFullWidthBannerMockFields(),
    params: {
        CTATheme: CTAThemeType.Filled,
        PillColour: PillColourVariant.Green,
        TextAlignment: TextAlignmentVariant.Right,
        TitleFontStyle: TitleFontStyle.Rounded,
        Version: ComponentVersion.NonSlimWithoutShard,
        TitleFontSize: TitleFontSizeMobileAndDesktop.Mobile24Desktop36,
    },
    rendering: {},
});

export const mockFullWidthBannerMockFields = (): IFullWidthBannerFields => ({
    Title: mockSitecoreField('Title'),
    TrackingTitle: mockSitecoreField('TitleEN'),
    Description: mockSitecoreField('Description'),
    Image: mockSitecoreField(mockSitecoreImageField('image ')),
    CTA: mockSitecoreField(mockSitecoreLinkField('href', 'CTA')),
    PillText: mockSitecoreField('PillText'),
    IsLuxuryBadge: mockSitecoreField(false),
    KeySellingPoints: mockSitecoreCompositeField('id', { Items: [] }),
});
