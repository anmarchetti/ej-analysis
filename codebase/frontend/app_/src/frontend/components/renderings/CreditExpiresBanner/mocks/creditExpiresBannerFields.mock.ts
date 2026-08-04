import {
    mockSitecoreCompositeField,
    mockSitecoreField,
    mockSitecoreImageField,
    mockSitecoreLinkField,
} from 'frontend/utils/tests.utils';
import {
    CreditExpiresBannerContentType,
    ICreditExpiresBannerFields,
} from 'frontend/components/renderings/CreditExpiresBanner/interfaces';

export const mockCreditExpiresBannerFields: ICreditExpiresBannerFields = {
    BookHolidayCTA: mockSitecoreField(mockSitecoreLinkField('https://www.example.com/book', 'Book Now')),
    Children: [
        mockSitecoreCompositeField('1', {
            ContentType: mockSitecoreField(CreditExpiresBannerContentType.CreditExpiresCurrentMarket),
            Subtitle: mockSitecoreField('CreditExpiresCurrentMarket Subtitle'),
            Title: mockSitecoreField('CreditExpiresCurrentMarket Title'),
        }),
        mockSitecoreCompositeField('2', {
            ContentType: mockSitecoreField(CreditExpiresBannerContentType.CreditExpiresOnMultipleMarkets),
            Subtitle: mockSitecoreField('CreditExpiresOnMultipleMarkets Subtitle'),
            Title: mockSitecoreField('CreditExpiresOnMultipleMarkets Title'),
        }),
        mockSitecoreCompositeField('3', {
            ContentType: mockSitecoreField(CreditExpiresBannerContentType.CreditExpiresOnOtherMarkets),
            Subtitle: mockSitecoreField('CreditExpiresOnOtherMarkets Subtitle'),
            Title: mockSitecoreField('CreditExpiresOnOtherMarkets Title'),
        }),
    ],
    Icon: mockSitecoreField(mockSitecoreImageField('https://www.example.com/icon.png', 'Expiring Credits Icon')),
};
