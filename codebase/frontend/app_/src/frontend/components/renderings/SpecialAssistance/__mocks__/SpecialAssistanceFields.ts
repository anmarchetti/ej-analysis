import { mockSitecoreCompositeField, mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IPopupFields } from 'models/data/BaseFields';
import { ISpecialAssistanceFields } from 'frontend/components/renderings/SpecialAssistance/SpecialAssistance';

export const specialAssistancePopupFields: IPopupFields = {
    Title: mockSitecoreField('Contact us'),
    Description: mockSitecoreField('If you need special assistance, please contact us.'),
    PrimaryButtonLabel: mockSitecoreField('Contact us'),
    PrimaryButtonScreenReaderText: mockSitecoreField('Contact us'),
    SecondaryButtonLabel: mockSitecoreField('Cancel'),
    SecondaryButtonScreenReaderText: mockSitecoreField('Cancel'),
    Icon: mockSitecoreField(mockSitecoreImageField('icon.png')),
};

export const specialAssistanceFields: ISpecialAssistanceFields = {
    ContactUsPopup: mockSitecoreCompositeField<IPopupFields>('1', specialAssistancePopupFields),
    Icon: mockSitecoreField(mockSitecoreImageField('special-assistance-icon.png')),
    SpecialAssistanceDescription: mockSitecoreField('If you need special assistance, please contact us.'),
    SpecialAssistanceTitle: mockSitecoreField('Special Assistance'),
    PrimaryButtonLabel: mockSitecoreField('Contact us'),
    PrimaryButtonScreenReaderText: mockSitecoreField('Contact us screen reader text'),
    SecondaryButtonLabel: mockSitecoreField('Cancel'),
    SecondaryButtonScreenReaderText: mockSitecoreField('Cancel screen reader text'),
    AssistedRequestedOnLabel: mockSitecoreField('Assisted requested on {date}'),
    ErrorTitle: mockSitecoreField('Error'),
    ErrorDescription: mockSitecoreField('Unable to load your assisted travel requests. Please try again later.'),
};
