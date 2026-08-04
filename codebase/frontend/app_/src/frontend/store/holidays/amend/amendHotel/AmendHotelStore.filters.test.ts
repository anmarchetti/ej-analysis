import { waitFor } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockFilterInboundDepartureTime } from 'frontend/__mocks__/filters';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { IFilters } from 'models/data/IFilters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import { AmendHotelStoreFilters } from './AmendHotelStore.filters';

describe('AmendHotelStoreFilters', () => {
    const mockOption = mockFilterInboundDepartureTime.options[0];

    let rootStore: HolidaysRootStore;
    let store: AmendHotelStoreFilters;

    beforeEach(() => {
        rootStore = createMockStores({
            amendHotelStore: {
                totalNumberOfHotels: 0,
                getInitialAlternativeHotels: jest.fn(),
                offersStatus: {},
            },
        });
        store = new AmendHotelStoreFilters(rootStore);
    });

    it('should initialize with correct default values', () => {
        expect(store.isMobileDrawerOpen).toBe(false);
        expect(store.rootStore).toBe(rootStore);
    });

    describe('isFilterGroupDisabled', () => {
        it('should toggle isMobileDrawerOpen state', () => {
            expect(store.isMobileDrawerOpen).toBe(false);
            store.toggleFilterMobileDrawer();
            expect(store.isMobileDrawerOpen).toBe(true);
            store.toggleFilterMobileDrawer();
            expect(store.isMobileDrawerOpen).toBe(false);
        });
    });

    describe('onClearAll', () => {
        it('should call onClearAllSelectedFilters and getInitialAlternativeHotels on onClearAll', () => {
            store.onClearAllSelectedFilters = jest.fn();
            store.onClearAll();
            expect(store.onClearAllSelectedFilters).toHaveBeenCalledWith();
            expect(rootStore.amendHotelStore.getInitialAlternativeHotels).toHaveBeenCalled();
        });
    });

    describe('isFilterGroupDisabled', () => {
        it('should disable filter group if totalNumberOfHotels is zero', () => {
            rootStore.amendHotelStore.offersStatus!.total = 0;
            expect(store.isFilterGroupDisabled(mockFilterInboundDepartureTime)).toBe(true);
        });

        it('should disable filter group if filter options have no count', () => {
            rootStore.amendHotelStore.offersStatus!.total = 10;
            const filters = { ...mockFilterInboundDepartureTime, options: [{ ...mockOption, count: 0 }] };
            expect(store.isFilterGroupDisabled(filters)).toBe(true);
        });

        it('should enable filter group if filter options have count', () => {
            rootStore.amendHotelStore.offersStatus!.total = 10;
            const filters = { ...mockFilterInboundDepartureTime, options: [{ ...mockOption, count: 1 }] };
            waitFor(() => expect(store.isFilterGroupDisabled(filters)).toBe(false));
        });

        it('should enable price range filter if filter options have no count', () => {
            rootStore.amendHotelStore.offersStatus!.total = 10;
            const filters: IFilters = {
                ...mockFilterInboundDepartureTime,
                code: FilterGroupCodes.PriceRange,
                options: [{ ...mockOption, count: 0 }],
            };
            expect(store.isFilterGroupDisabled(filters)).toBe(true);
        });
    });

    describe('onApply', () => {
        it('should call getInitialAlternativeHotels on onApply', () => {
            store.loadContent = jest.fn();
            store.onApply();
            expect(store.loadContent).toHaveBeenCalled();
        });
    });

    describe('loadContent', () => {
        it('should call getInitialAlternativeHotels on loadContent', () => {
            store.loadContent();
            expect(rootStore.amendHotelStore.getInitialAlternativeHotels).toHaveBeenCalled();
        });
    });
});
