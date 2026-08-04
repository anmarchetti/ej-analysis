import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

export const getMockedPromoBlockItem = (index?: number): IPromoBlockFields => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Description: mockSitecoreField('Description'),
        Image: mockSitecoreField(mockSitecoreImageField('Image')),
        Link: mockSitecoreField({
            href: 'linkHref',
            text: 'linkText',
            linktype: SitecoreLinkType.External,
        }),
        ModalContent: {
            fields: {
                ModalTitle: mockSitecoreField('ModalTitle'),
                ModalDescription: mockSitecoreField('ModalDescription'),
                ModalButtonText: mockSitecoreField('ModalButtonText'),
            },
        },
    },
    id: `test-id${!!index ? `-${index}` : ''}`,
});
