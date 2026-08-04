import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { IHelpLinks } from 'frontend/components/renderings/HelpLinks/HelpLinks';

export const helpLink1: IHelpLinks = {
    fields: {
        Description: mockSitecoreField('Description1'),
        Icon: mockSitecoreField(mockSitecoreImageField('Icon1')),
        Link: mockSitecoreField(mockSitecoreLinkField('Href1', 'LinkText1', SitecoreLinkType.External)),
        OpenChatBot: { value: true },
        Title: mockSitecoreField('Title1'),
        TrackingLabel: mockSitecoreField('TrackingLabel1'),
    },
    params: {},
    rendering: {},
    id: '3d40d60a-5082-4b1e-af47-2f59a553a46c',
};
export const helpLink2: IHelpLinks = {
    fields: {
        Description: mockSitecoreField('Description2'),
        Icon: mockSitecoreField(mockSitecoreImageField('Icon2')),
        Link: mockSitecoreField(mockSitecoreLinkField('Href2', 'LinkText2', SitecoreLinkType.External)),
        OpenChatBot: { value: true },
        Title: mockSitecoreField('Title2'),
        TrackingLabel: mockSitecoreField('TrackingLabel2'),
    },
    params: {},
    rendering: {},
    id: '3d40d60a-5082-4b1e-af47-2f59a553a46k',
};
