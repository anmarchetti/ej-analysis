import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
export const promoBlockItemsMocks: IPromoBlockFields[] = [
    {
        fields: {
            Description: mockSitecoreField('#1 Description'),
            Image: mockSitecoreField(mockSitecoreImageField('image1.jpg', 'Image 1')),
            Link: mockSitecoreField(mockSitecoreLinkField('/modal-link-1', 'Open Modal')),
            ModalContent: {
                fields: {
                    ModalButtonText: mockSitecoreField('Open Modal'),
                    ModalDescription: mockSitecoreField('This is the modal description'),
                    ModalTitle: mockSitecoreField('Modal Title 1'),
                },
            },
            Title: mockSitecoreField('Title 1'),
        },
        id: '1',
    },
    {
        fields: {
            Description: mockSitecoreField('2 Description'),
            Image: mockSitecoreField(mockSitecoreImageField('image1.jpg', 'Image 2')),
            Link: mockSitecoreField(mockSitecoreLinkField('/modal-link-2', 'Open Modal')),
            ModalContent: {
                fields: {
                    ModalButtonText: mockSitecoreField('Open Modal'),
                    ModalDescription: mockSitecoreField('This is the modal description'),
                    ModalTitle: mockSitecoreField('Modal Title 2'),
                },
            },
            Title: mockSitecoreField('Title 2'),
        },
        id: '2',
    },
];
