import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IUnavailablePopupFields } from 'models/data/IUnavailablePopup';

export const mockUnavailablePopupFields: IUnavailablePopupFields = {
    Title: mockSitecoreField('Title'),
    CTA: mockSitecoreField('CTA'),
    CTALink: mockSitecoreField(mockSitecoreLinkField('CTALink')),
    Description: mockSitecoreField('Description'),
    Icon: mockSitecoreField(mockSitecoreImageField('Icon')),
    NoOptionsCTA: mockSitecoreField('NoOptionsCTA'),
};
