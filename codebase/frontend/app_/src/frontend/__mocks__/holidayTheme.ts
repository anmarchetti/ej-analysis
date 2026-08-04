import { mockSitecoreField } from 'frontend/utils/tests.utils';

const getIconMock = (name: string) => ({
    id: 'f40eda8d-775b-4da2-aa0c-df8f729d9d0e',
    fields: {
        Type: mockSitecoreField(name),
        Icon: mockSitecoreField({
            src: '/holidays/cms/media/-/jssmedia/project/holidays/default/icons/hotel-themes/hotel_dark_orange.svg?h=24&iar=0&w=24&hash=501B3182D5689C538FE10006978F6D02',
            alt: 'hotel icon',
            width: '24',
            height: '24',
        }),
        Name: mockSitecoreField(name),
    },
});

export const holidayThemeMock = {
    id: '2d055cb3-1312-410e-b3e7-fb43b540b8f2',
    fields: {
        PackageIcons: [
            getIconMock('Hotel'),
            getIconMock('Flights'),
            getIconMock('Private transfer'),
            getIconMock('Shared transfer'),
            getIconMock('15kg bags'),
            getIconMock('23kg bags'),
            getIconMock('Small under seat bag'),
        ],
        Code: mockSitecoreField('B'),
        Name: mockSitecoreField('Beach'),
        Icon: mockSitecoreField({
            src: '/holidays/cms/media/-/jssmedia/project/holidays/default/icons/hotel-themes/hotel_dark_orange.svg?h=24&iar=0&w=24&hash=501B3182D5689C538FE10006978F6D02',
            alt: 'hotel icon',
            width: '24',
            height: '24',
        }),
        Description: mockSitecoreField('Best holiday ever'),
        DestinationGuideUrl: mockSitecoreField('Beach Holiday'),
        DestinationGuideTitle: mockSitecoreField('Beach Holiday'),
    },
};
