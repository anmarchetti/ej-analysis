import { renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import * as mediaQueryUtils from 'frontend/hooks/useMediaQuery';
import offersService from 'frontend/services/offers.service';
import * as hierarchyUtils from 'frontend/utils/getLocationHierarchy';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ILocationHierarchy } from 'models/data/ILocationHierarchy';

import { IMapPointsOfInterestFields } from './IMapPointsOfInterest';
import * as mapPOIUtils from './MapPointsOfInterest.utils';
import { useMapPointsOfInterest } from './useMapPointsOfInterest';

const createProps = (): IMapPointsOfInterestFields => ({
    Categories: [],
    DisclaimerText: mockSitecoreField('Disclaimer text'),
    DisclaimerTooltip: mockSitecoreField('Disclaimer tooltip'),
    MobileDrawerTitle: mockSitecoreField('Mobile drawer title'),
    ShowMoreButtonText: mockSitecoreField('Show more button text'),
    Title: mockSitecoreField('Title {hotelName}'),
    Distance: mockSitecoreField('Distance text'),
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockGetLocationHierarchy = jest.spyOn(hierarchyUtils, 'getLocationHierarchy').mockReturnValue({
    hotel: {
        name: 'Hierarchy Hotel Name',
    },
} as ILocationHierarchy);

const mockUseXSMobileViewport = jest.spyOn(mediaQueryUtils, 'useXSMobileViewport').mockReturnValue(true);
const mockGetCategoriesWithItems = jest.spyOn(mapPOIUtils, 'getCategoriesWithItems').mockReturnValue([
    {
        name: mockSitecoreField('test'),
        icon: mockSitecoreField(mockSitecoreImageField('test-icon')),
        key: 'item1',
        items: [
            {
                name: 'item1',
                distance: '10km',
                categoryName: 'category1',
            },
        ],
    },
]);

const mockGetHotelPointsOfInterest = jest.spyOn(mapPOIUtils, 'getHotelPointsOfInterestProps');

describe('useMapPointsOfInterest', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            bookingStore: { hotel: { name: 'Hotel Name' }, outboundFlight: { arrPt: 'XYZ' } },
            layoutStore: {
                layout: { sitecore: { route: { fields: { Latitude: 10, Longitude: 20 } } } },
                lang: 'en',
                isHotelDetailsBookPage: true,
            },
            trackingStore: { trackMapPointsOfInterestInteraction: jest.fn() },
        });
        mockGetHotelPointsOfInterest.mockReturnValue({
            lat: 10,
            lon: 20,
            resortId: '123',
            categories: 'test,test2',
        });
        offersService.getHotelPointsOfInterest = jest.fn().mockResolvedValue([]);
    });

    describe('title', () => {
        it('should return title with hotel name from hotel when hotel info is provided and isHotelDetailsBookPage is true', () => {
            const { result } = renderHook(() => useMapPointsOfInterest(mockProps));

            expect(result.current.title).toBe('Title Hotel Name');
        });

        it('should return title with hotel name from layout when isHotelDetailsBookPage is false', () => {
            mockStores.layoutStore.isHotelDetailsBookPage = false;

            const { result } = renderHook(() => useMapPointsOfInterest(mockProps));

            expect(mockGetLocationHierarchy).toHaveBeenCalledWith(mockStores.layoutStore.layout);
            expect(result.current.title).toBe('Title Hierarchy Hotel Name');
        });

        it('should return title without hotel name when isHotelDetailsBookPage is true and hotel name is NOT provided', () => {
            mockStores.bookingStore.hotel = null;

            const { result } = renderHook(() => useMapPointsOfInterest(mockProps));

            expect(result.current.title).toBe('Title ');
        });

        it('should return title without hotel name when isHotelDetailsBookPage is false and location hierarchy is NOT provided', () => {
            mockStores.layoutStore.isHotelDetailsBookPage = false;
            mockGetLocationHierarchy.mockReturnValue(null);

            const { result } = renderHook(() => useMapPointsOfInterest(mockProps));

            expect(result.current.title).toBe('Title ');
        });

        it('should return empty title when fields are NOT provided', () => {
            mockProps = undefined;

            const { result } = renderHook(() => useMapPointsOfInterest(mockProps));

            expect(result.current.title).toBe('');
        });
    });

    describe('isMobile', () => {
        it('should return isMobile from useXSMobileViewport', () => {
            const { result } = renderHook(() => useMapPointsOfInterest(mockProps));

            expect(mockUseXSMobileViewport).toHaveBeenCalled();
            expect(result.current.isMobile).toBe(true);
        });
    });

    describe('handleCategoryClick', () => {
        it('should call trackMapPointsOfInterestInteraction on handleCategoryClick', () => {
            const { result } = renderHook(() => useMapPointsOfInterest(mockProps));

            result.current.handleCategoryClick('category1');

            expect(mockStores.trackingStore.trackMapPointsOfInterestInteraction).toHaveBeenCalledWith('category1');
        });
    });

    describe('categoriesWithItems', () => {
        it('should return categoriesWithItems from getCategoriesWithItems', () => {
            const { result } = renderHook(() => useMapPointsOfInterest(mockProps));

            expect(mockGetCategoriesWithItems).toHaveBeenCalled();
            expect(result.current.categoriesWithItems).toStrictEqual([
                {
                    name: mockSitecoreField('test'),
                    icon: mockSitecoreField(mockSitecoreImageField('test-icon')),
                    key: 'item1',
                    items: [
                        {
                            name: 'item1',
                            distance: '10km',
                            categoryName: 'category1',
                        },
                    ],
                },
            ]);
        });
    });

    describe('useEffect', () => {
        it('should call getHotelPointsOfInterest when all props are provided', () => {
            renderHook(() => useMapPointsOfInterest(mockProps));

            expect(offersService.getHotelPointsOfInterest).toHaveBeenCalled();
        });

        it('should NOT call getHotelPointsOfInterest when resortId is NOT provided', () => {
            mockGetHotelPointsOfInterest.mockReturnValue({
                lat: 10,
                lon: 20,
                resortId: '',
                categories: 'test,test2',
            });

            renderHook(() => useMapPointsOfInterest(mockProps));

            expect(offersService.getHotelPointsOfInterest).not.toHaveBeenCalled();
        });

        it('should NOT call getHotelPointsOfInterest when categories are NOT provided', () => {
            mockGetHotelPointsOfInterest.mockReturnValue({
                lat: 10,
                lon: 20,
                resortId: '123',
                categories: '',
            });

            renderHook(() => useMapPointsOfInterest(mockProps));

            expect(offersService.getHotelPointsOfInterest).not.toHaveBeenCalled();
        });

        it('should NOT call getHotelPointsOfInterest when lat is NOT provided', () => {
            mockGetHotelPointsOfInterest.mockReturnValue({
                lat: NaN,
                lon: 20,
                resortId: '123',
                categories: 'test,test2',
            });

            renderHook(() => useMapPointsOfInterest(mockProps));

            expect(offersService.getHotelPointsOfInterest).not.toHaveBeenCalled();
        });

        it('should NOT call getHotelPointsOfInterest when lon is NOT provided', () => {
            mockGetHotelPointsOfInterest.mockReturnValue({
                lat: 10,
                lon: NaN,
                resortId: '123',
                categories: 'test,test2',
            });

            renderHook(() => useMapPointsOfInterest(mockProps));

            expect(offersService.getHotelPointsOfInterest).not.toHaveBeenCalled();
        });

        it('should call getHotelPointsOfInterest on re-render when POIs exist', () => {
            offersService.getHotelPointsOfInterest = jest.fn().mockResolvedValue([{}, {}]);

            const { rerender } = renderHook(() => useMapPointsOfInterest(mockProps));

            expect(offersService.getHotelPointsOfInterest).toHaveBeenCalled();

            mockGetHotelPointsOfInterest.mockReturnValue({
                lat: 150,
                lon: 20,
                resortId: '123',
                categories: 'test,test2',
            });

            rerender();

            expect(offersService.getHotelPointsOfInterest).toHaveBeenCalledTimes(2);
        });
    });

    describe('active index', () => {
        it('should return activeIndex and setActiveIndex', () => {
            const { result } = renderHook(() => useMapPointsOfInterest(mockProps));

            expect(result.current.activeIndex).toBe(0);
            expect(result.current.setActiveIndex).toStrictEqual(expect.any(Function));
        });
    });
});
