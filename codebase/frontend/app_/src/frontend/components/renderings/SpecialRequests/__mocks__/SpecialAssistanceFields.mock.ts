import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ISpecialAssistanceFields } from 'frontend/components/renderings/SpecialRequests/components/SpecialAssistance/SpecialAssistance';

export const specialAssistanceFields: ISpecialAssistanceFields = {
    AddAssistanceDescription: mockSitecoreField('AddAssistanceDescription'),
    AddAssistanceExtra: mockSitecoreField('AddAssistanceExtra'),
    AddAssistancePhone: mockSitecoreField('AddAssistancePhone'),
    AddAssistanceTitle: mockSitecoreField('AddAssistanceTitle'),
    InfoCTA: mockSitecoreField('InfoCTA'),
    InfoDescription: mockSitecoreField('InfoDescription'),
    InfoIcon: mockSitecoreField(mockSitecoreImageField('InfoIcon')),
    InfoTitle: mockSitecoreField('InfoTitle'),
};
