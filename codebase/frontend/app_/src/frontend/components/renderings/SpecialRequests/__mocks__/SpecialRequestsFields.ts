import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ISpecialRequestsFields } from 'frontend/components/renderings/SpecialRequests/SpecialRequests';

export const specialRequestsFields: ISpecialRequestsFields = {
    AddAssistanceDescription: mockSitecoreField('AddAssistanceDescription'),
    AddAssistanceExtra: mockSitecoreField('AddAssistanceExtra'),
    AddAssistancePhone: mockSitecoreField('AddAssistancePhone'),
    AddAssistanceTitle: mockSitecoreField('AddAssistanceTitle'),

    AddRequestDescription: mockSitecoreField('AddRequestDescription'),
    AddRequestTitle: mockSitecoreField('AddRequestTitle'),
    AddRequestsCTA: mockSitecoreField('AddRequestsCTA'),
    AmendRequestIcon: mockSitecoreField(mockSitecoreImageField('AmendRequestIcon')),

    AmendmentPopupDescription: mockSitecoreField('AmendmentPopupDescription'),
    AmendmentPopupTitle: mockSitecoreField('AmendmentPopupTitle'),
    ContradictoryNewSelectionTitle: mockSitecoreField('ContradictoryNewSelectionTitle'),
    ContradictoryOriginalSelectionTitle: mockSitecoreField('ContradictoryOriginalSelectionTitle'),
    ContradictoryPopupDescription: mockSitecoreField('ContradictoryPopupDescription'),

    ContradictoryPopupTitle: mockSitecoreField('ContradictoryPopupTitle'),
    Description: mockSitecoreField('Description'),

    EditRequestsCTA: mockSitecoreField('EditRequestsCTA'),
    InfoCTA: mockSitecoreField('InfoCTA'),
    InfoDescription: mockSitecoreField('InfoDescription'),
    InfoDescriptionViewBooking: mockSitecoreField('InfoDescriptionViewBooking'),
    InfoIcon: mockSitecoreField(mockSitecoreImageField('InfoIcon')),

    InfoTitle: mockSitecoreField('InfoTitle'),
    SpecialRequestsContradictoryGroups: [],
    SpecialRequestsTypes: [],
    Title: mockSitecoreField('Title'),

    ViewBookingContentRequestSubtitle: mockSitecoreField('ViewBookingContentRequestSubtitle'),
    ViewBookingContentRequestTitle: mockSitecoreField('ViewBookingContentRequestTitle'),
};
