import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

export const mockFAQRatingFields = {
    RatingQuestion: mockSitecoreField('RatingQuestion'),
    PositiveActiveIcon: mockSitecoreField(mockSitecoreImageField('img1')),
    PositiveInactiveIcon: mockSitecoreField(mockSitecoreImageField('img2')),
    NegativeActiveIcon: mockSitecoreField(mockSitecoreImageField('img3')),
    NegativeInactiveIcon: mockSitecoreField(mockSitecoreImageField('img4')),
    IsRatingEnabled: mockSitecoreField('1'),
    IsTextFieldEnabled: mockSitecoreField('1'),
    ThumbDownPlaceholder: mockSitecoreField('ThumbDownPlaceholder'),
    ThumbUpPlaceholder: mockSitecoreField('ThumbUpPlaceholder'),
};
