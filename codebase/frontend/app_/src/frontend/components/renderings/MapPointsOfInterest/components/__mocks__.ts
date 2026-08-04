import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

export const contentProps = {
    categoriesWithItems: [
        {
            name: mockSitecoreField('Category 1'),
            items: [
                {
                    distance: '1 km',
                    name: 'point 1',
                    categoryName: 'category1',
                },
                {
                    distance: '2 km',
                    name: 'point 2',
                    categoryName: 'category1',
                },
                {
                    distance: '3 km',
                    name: 'point 3',
                    categoryName: 'category1',
                },
                {
                    distance: '4 km',
                    name: 'point 4',
                    categoryName: 'category1',
                },
            ],
            icon: mockSitecoreField(mockSitecoreImageField('test1')),
            key: 'category1-key',
        },
        {
            name: mockSitecoreField('Category 2'),
            items: [
                {
                    distance: '1 km',
                    name: 'point 1',
                    categoryName: 'category2',
                },
                {
                    distance: '2 km',
                    name: 'point 2',
                    categoryName: 'category2',
                },
                {
                    distance: '1 km',
                    name: 'point 3',
                    categoryName: 'category2',
                },
                {
                    distance: '2 km',
                    name: 'point 4',
                    categoryName: 'category2',
                },
                {
                    distance: '1 km',
                    name: 'point 5',
                    categoryName: 'category2',
                },
                {
                    distance: '2 km',
                    name: 'point 6',
                    categoryName: 'category2',
                },
            ],
            icon: mockSitecoreField(mockSitecoreImageField('test2')),
            key: 'category2-key',
        },
    ],
    disclaimerText: 'disclaimer text',
    disclaimerTooltip: 'disclaimer tooltip',
    handleCategoryClick: jest.fn(),
};

export const desktopContentProps = { ...contentProps, activeIndex: 0, setActiveIndex: jest.fn() };
