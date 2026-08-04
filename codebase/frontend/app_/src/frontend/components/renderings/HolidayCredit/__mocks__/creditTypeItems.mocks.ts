import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { TCreditTypeItem } from 'models/data/IBalanceHistory';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';

export const mockCreditTypeItems: ISitecoreChildren<TCreditTypeItem>[] = [
    {
        displayName: 'Tesco',
        id: '1',
        name: 'Tesco',
        fields: {
            Key: mockSitecoreField('Promotion - Tesco Clubcard'),
            Title: mockSitecoreField('Tesco Clubcard'),
            LogoImage: mockSitecoreField(mockSitecoreImageField('tesco-image')),
        },
    },
    {
        displayName: 'default',
        id: '2',
        name: 'default',
        fields: {
            Key: mockSitecoreField(''),
            Title: mockSitecoreField('Credit'),
            LogoImage: mockSitecoreField(mockSitecoreImageField('default-image')),
        },
    },
];
