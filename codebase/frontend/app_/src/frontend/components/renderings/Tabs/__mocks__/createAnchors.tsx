import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { TAnchorFields } from 'frontend/components/renderings/Tabs/components/Anchor';

const createAnchorMock = (
    anchor: string,
    title: string,
    image: string,
    icon: string,
): ISitecoreChildren<TAnchorFields> => ({
    fields: {
        Anchor: mockSitecoreField(anchor),
        Title: mockSitecoreField(title),
        Image: mockSitecoreField(mockSitecoreImageField(image)),
        Icon: mockSitecoreField(icon),
    },
    displayName: title,
    id: '',
    name: '',
});

export const generateAnchorMocksArray = (length: number): ISitecoreChildren<TAnchorFields>[] => {
    const res: ISitecoreChildren<TAnchorFields>[] = [];

    for (let i = 0; i < length; i++) {
        const mock = createAnchorMock(`anchor-${i}`, `title-${i}`, `image-${i}.jpg`, `icon-${i}`);
        res.push(mock);
    }

    return res;
};
