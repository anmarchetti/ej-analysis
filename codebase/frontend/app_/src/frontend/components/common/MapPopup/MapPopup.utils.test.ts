import React from 'react';
import { renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { TSelectedMapCardData } from 'models/data/map/IMap';
import { DataStatus } from 'models/enum/DataStatus';

import useMapPopup, { IMapPopupProps } from './MapPopup.utils';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockProps: IMapPopupProps = {
    onCloseMapPopup: jest.fn(),
};
let mockStores;

describe('useMapPopup', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            hotelsStore: {
                hotels: [
                    {
                        properties: { id: '123' },
                        geometry: {
                            coordinates: [0, 0],
                        },
                    },
                ],
                cleanUpHotels: jest.fn(),
                defaultLoadResults: jest.fn(),
                status: DataStatus.Loading,
            },
            searchStore: {
                setSeachPerformWithNewParams: jest.fn(),
            },
            searchFiltersStore: {
                countableFilters: [{}, {}],
                areFiltersCollapsed: true,
                onChangeSearchFilterStore: jest.fn(),
            },
            queryParamStore: {
                mapPopupState: null,
                updateMapInQuery: jest.fn(),
                updateMapStateInQuery: jest.fn(),
            },
        });
    });

    it('should return correct data', () => {
        const { result } = renderHook(() => useMapPopup(mockProps));

        expect(result.current.onClose).toEqual(expect.any(Function));
        expect(result.current.onOpen).toEqual(expect.any(Function));
        expect(result.current.getPhrase).toEqual(expect.any(Function));
        expect(result.current.map).toEqual({
            hotels: mockStores.hotelsStore.hotels,
            zoomControlPosition: 9,
            defaultZoom: 4,
            minZoom: 2,
            gestureHandling: 'greedy',
            onSaveState: expect.any(Function),
            restoreState: expect.any(Function),
        });
        expect(result.current.leftHandFilters).toEqual({
            isCollapsed: true,
            isOnMapPopup: true,
        });
        expect(result.current.amount).toBe(mockStores.searchFiltersStore.countableFilters.length);
        expect(result.current.isLoading).toBe(true);
        expect(result.current.mobileFilterModal).toEqual({
            onClose: expect.any(Function),
            map: true,
            isMobileFilterModalShown: false,
        });
    });

    it('should call onCloseMapPopup on onClose', () => {
        const { result } = renderHook(() => useMapPopup(mockProps));

        result.current.onClose();

        expect(mockProps.onCloseMapPopup).toHaveBeenCalledTimes(1);
    });

    it('should call setIsShown on onOpen', () => {
        const setIsShown = jest.fn();
        jest.spyOn(React, 'useState').mockReturnValue([false, setIsShown]);

        const { result } = renderHook(() => useMapPopup(mockProps));

        result.current.onOpen();

        expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
            key: 'selectedFilterGroups',
            value: new Set(),
        });
        expect(setIsShown).toHaveBeenCalledWith(true);
    });

    it('should call onChangeSearchFilterStore and setIsShown on mobileFilterModal close', () => {
        const setIsShown = jest.fn();
        jest.spyOn(React, 'useState').mockReturnValue([false, setIsShown]);

        const { result } = renderHook(() => useMapPopup(mockProps));

        result.current.mobileFilterModal.onClose();

        expect(setIsShown).toHaveBeenCalledWith(false);
        expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
            key: 'selectedFilterGroups',
            value: new Set(),
        });
    });

    describe('leftHandFilters', () => {
        it('should return isCollapsed equal to areFiltersCollapsed when polyOffers are undefined', () => {
            mockStores.hotelsStore.polyOffers = undefined;

            const { result } = renderHook(() => useMapPopup(mockProps));

            expect(result.current.leftHandFilters.isCollapsed).toBe(mockStores.searchFiltersStore.areFiltersCollapsed);
        });

        it('should return isCollapsed equal to true when polyOffers.length < MIN_TOTAL_ITEMS', () => {
            mockStores.hotelsStore.polyOffers = [{}];

            const { result } = renderHook(() => useMapPopup(mockProps));

            expect(result.current.leftHandFilters.isCollapsed).toBe(true);
        });

        it('should return isCollapsed equal to false when polyOffers.length > MIN_TOTAL_ITEMS', () => {
            mockStores.hotelsStore.hotels = [{}, {}, {}, {}, {}, {}, {}, {}];

            const { result } = renderHook(() => useMapPopup(mockProps));

            expect(result.current.leftHandFilters.isCollapsed).toBe(false);
        });
    });

    describe('mapPopupState', () => {
        it('should save state on onSaveState call', () => {
            const { result } = renderHook(() => useMapPopup(mockProps));

            const zoomLevel = 5;
            const selected = { hotel: { properties: { id: '123' } } } as TSelectedMapCardData;
            result.current.map.onSaveState(zoomLevel, selected);

            expect(mockStores.queryParamStore.updateMapStateInQuery).toHaveBeenCalledWith('123', zoomLevel);
        });

        it('should save state with m=1 when no hotel is selected on onSaveState call', () => {
            const { result } = renderHook(() => useMapPopup(mockProps));

            const zoomLevel = 5;
            const selected = {} as TSelectedMapCardData;
            result.current.map.onSaveState(zoomLevel, selected);

            expect(mockStores.queryParamStore.updateMapInQuery).toHaveBeenCalledWith(true);
        });

        it('should restore state on restoreState call', () => {
            const zoomLevel = 5;
            const hotel = { properties: { id: '123' }, geometry: { coordinates: [2, 1] } };
            const selected = { hotel } as TSelectedMapCardData;
            mockStores.queryParamStore.mapPopupState = { accomId: '123', zoomLevel };
            mockStores.hotelsStore.hotels = [hotel];

            const { result } = renderHook(() => useMapPopup(mockProps));

            const restoredState = result.current.map.restoreState();

            expect(restoredState).toEqual({
                zoomLevel,
                selected,
            });
        });

        it('should return null on restoreState call if mapPopupState is not set', () => {
            const { result } = renderHook(() => useMapPopup(mockProps));

            const restoredState = result.current.map.restoreState();

            expect(restoredState).toBeNull();
        });

        it('should return null on restoreState call if hotel is not found', () => {
            // Set the mapPopupState with an accomId that doesn't exist
            mockStores.queryParamStore.mapPopupState = { accomId: 'nonexistent', zoomLevel: 5 };

            const { result } = renderHook(() => useMapPopup(mockProps));

            const restoredState = result.current.map.restoreState();

            expect(restoredState).toBeNull();
        });
    });
});
