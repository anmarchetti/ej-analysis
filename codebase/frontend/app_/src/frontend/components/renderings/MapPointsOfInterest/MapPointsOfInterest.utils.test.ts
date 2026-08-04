import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IHotel } from 'models/data/IHotel';
import { ILocationHierarchy } from 'models/data/ILocationHierarchy';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';

import { IHotelPointsOfInterest, IMapPointsOfInterestCategory } from './IMapPointsOfInterest';
import {
    formatCategoriesWithNumberOfItems,
    formatDistance,
    getCategoriesWithItems,
    getHotelPointsOfInterestProps,
} from './MapPointsOfInterest.utils';

const mockHotel = {
    latitude: '10',
    longitude: '20',
    resort: { code: 'test-code' },
    theme: { code: 'test-theme' },
} as IHotel;

const mockLayout = {
    sitecore: { route: { fields: { Latitude: { value: 100 }, Longitude: { value: 200 } } } },
} as ISitecoreLayout;

const mockLocationHierarchy = { resort: { code: 'test-code-2' } } as ILocationHierarchy;
const mockCategories = [
    {
        fields: {
            Key: { value: 'cat1' },
            Name: mockSitecoreField('Category 1'),
            Icon: mockSitecoreField(mockSitecoreImageField('icon1')),
            MaxNumberOfItems: mockSitecoreField(5),
        },
    },
    {
        fields: {
            Key: { value: 'cat2' },
            Name: mockSitecoreField('Category 2'),
            Icon: mockSitecoreField(mockSitecoreImageField('icon2')),
            MaxNumberOfItems: mockSitecoreField(7),
        },
    },
] as ISitecoreCompositeField<IMapPointsOfInterestCategory>[];

const mockPoints: IHotelPointsOfInterest[] = [
    {
        category: 'cat1',
        items: [
            {
                distance: '1km',
                name: 'Point 1',
                categoryName: 'Category1',
            },
            {
                distance: '3km',
                name: 'Point 3',
                categoryName: 'Category2',
            },
        ],
    },
    {
        category: 'cat2',
        items: [],
    },
];

describe('MapPointsOfInterest utils', () => {
    describe('formatCategoriesWithNumberOfItems', () => {
        it('should return formatted categories string', () => {
            const results = formatCategoriesWithNumberOfItems(mockCategories);

            expect(results).toBe('cat1:5,cat2:7');
        });

        it('should return formatted categories string with default values when MaxNumberOfItems is NOT provided', () => {
            const results = formatCategoriesWithNumberOfItems([
                {
                    fields: {
                        Key: { value: 'cat1' },
                        Name: mockSitecoreField('Category 1'),
                        Icon: mockSitecoreField(mockSitecoreImageField('icon1')),
                    },
                },
                {
                    fields: {
                        Key: { value: 'cat2' },
                        Name: mockSitecoreField('Category 2'),
                        Icon: mockSitecoreField(mockSitecoreImageField('icon2')),
                        MaxNumberOfItems: mockSitecoreField(0),
                    },
                },
            ] as ISitecoreCompositeField<IMapPointsOfInterestCategory>[]);

            expect(results).toBe('cat1:20,cat2:20');
        });

        it('should return empty string when categories do NOT have keys', () => {
            const results = formatCategoriesWithNumberOfItems([
                {
                    fields: {
                        Name: mockSitecoreField('Category 1'),
                        Icon: mockSitecoreField(mockSitecoreImageField('icon1')),
                        MaxNumberOfItems: mockSitecoreField(5),
                    },
                },
                {
                    fields: {
                        Name: mockSitecoreField('Category 2'),
                        Icon: mockSitecoreField(mockSitecoreImageField('icon2')),
                        MaxNumberOfItems: mockSitecoreField(7),
                    },
                },
            ] as ISitecoreCompositeField<IMapPointsOfInterestCategory>[]);

            expect(results).toBe('');
        });
    });

    describe('getHotelPointsOfInterestProps', () => {
        it('should return props from hotel when isHotelDetailsBookPage is true', () => {
            const results = getHotelPointsOfInterestProps(
                true,
                mockHotel,
                mockLayout,
                mockLocationHierarchy,
                mockCategories,
                'test',
            );

            expect(results).toStrictEqual({
                lat: 10,
                lon: 20,
                resortId: 'test-code',
                categories: 'cat1:5,cat2:7',
                airport: 'test',
                theme: 'test-theme',
            });
        });

        it('should return props from layout when isHotelDetailsBookPage is false', () => {
            mockLayout.sitecore.route.fields = {
                Latitude: { value: 100 },
                Longitude: { value: 200 },
                Airports: [{ fields: { Code: { value: 'XYZ' } } }],
                HotelTheme: { fields: { Code: { value: 'layout-theme' } } },
            };

            const results = getHotelPointsOfInterestProps(
                false,
                mockHotel,
                mockLayout,
                mockLocationHierarchy,
                mockCategories,
            );

            expect(results).toStrictEqual({
                lat: 100,
                lon: 200,
                resortId: 'test-code-2',
                categories: 'cat1:5,cat2:7',
                airport: 'XYZ',
                theme: 'layout-theme',
            });
        });

        it('should return empty props when isHotelDetailsBookPage is true and hotel is empty', () => {
            const results = getHotelPointsOfInterestProps(true, undefined, mockLayout, undefined, []);

            expect(results).toStrictEqual({
                lat: NaN,
                lon: NaN,
                resortId: undefined,
                categories: '',
                airport: undefined,
                theme: undefined,
            });
        });

        it('should return empty props when isHotelDetailsBookPage is false and layout is empty', () => {
            const results = getHotelPointsOfInterestProps(
                false,
                mockHotel,
                { sitecore: { route: { fields: undefined } } } as ISitecoreLayout,
                undefined,
                [],
            );

            expect(results).toStrictEqual({
                lat: NaN,
                lon: NaN,
                resortId: undefined,
                categories: '',
                airport: undefined,
                theme: undefined,
            });
        });
    });

    describe('getCategoriesWithItems', () => {
        let mockProps;

        beforeEach(() => {
            mockProps = {
                categories: mockCategories,
                points: mockPoints,
                language: 'en',
                distanceText: '{distance}',
                getPhrase: jest.fn(key => key),
            };
        });

        it('should return empty array when points are NOT provided', () => {
            const results = getCategoriesWithItems({ ...mockProps, points: undefined });

            expect(results).toStrictEqual([]);
        });

        it('should return empty array when categories do NOT match points', () => {
            const results = getCategoriesWithItems({
                ...mockProps,
                categories: [
                    {
                        fields: {
                            Key: { value: 'cat3' },
                            Name: mockSitecoreField('Category 3'),
                            Icon: mockSitecoreField(mockSitecoreImageField('icon3')),
                        },
                    },
                ] as ISitecoreCompositeField<IMapPointsOfInterestCategory>[],
            });

            expect(results).toStrictEqual([]);
        });

        it('should return combined categories and points', () => {
            const results = getCategoriesWithItems(mockProps);

            expect(results).toStrictEqual([
                {
                    icon: { value: { src: 'icon1' } },
                    items: [
                        { distance: '1km', name: 'Point 1', categoryName: 'Map.PointsOfInterestCategories.Category1' },
                        { distance: '3km', name: 'Point 3', categoryName: 'Map.PointsOfInterestCategories.Category2' },
                    ],
                    name: { value: 'Category 1' },
                    key: 'cat1',
                },
            ]);
        });
    });

    describe('formatDistance', () => {
        it('should return empty string when distance is NOT provided', () => {
            const results = formatDistance('en', '', '{distance} km');

            expect(results).toStrictEqual('');
        });

        it('should return distance with dot when language is en', () => {
            const results = formatDistance('en', '1.5', '{distance} km');

            expect(results).toStrictEqual('1.5 km');
        });

        it('should return distance with comma when language is NOT en', () => {
            const results = formatDistance('fr', '1,5', '{distance} km');

            expect(results).toStrictEqual('1,5 km');
        });
    });
});
