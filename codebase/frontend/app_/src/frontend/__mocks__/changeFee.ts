import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IChangeFeeInfoFields } from 'frontend/components/renderings/ChangeFeeInfo/ChangeFeeInfo';

export const mockChangeFeeFields: IChangeFeeInfoFields = {
    BucketTwoDescription: mockSitecoreField('BucketTwoDescription'),
    Description: mockSitecoreField('Description'),
    Icon: mockSitecoreField(mockSitecoreImageField('Icon')),
    Title: mockSitecoreField('Title'),
    ViewLessCTA: mockSitecoreField('ViewLessCTA'),
    ViewMoreCTA: mockSitecoreField('ViewMoreCTA'),
    FeeValue: mockSitecoreField(20),
    TooltipIconAriaLabelMobile: mockSitecoreField('TooltipIconAriaLabelMobile'),
};
