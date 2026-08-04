import { renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { useSubmitSearchParameters } from 'frontend/hooks/useSubmitSearchParameters/useSubmitSearchParameters';
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useSubmitSearchParameters', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            layoutStore: {
                isSearchResultsPage: false,
            },
            searchStore: {
                setPageNumber: jest.fn(),
                setSelectedOfferIndex: jest.fn(),
                clearOldSearchParam: jest.fn(),
                trackUserSearch: jest.fn(),
            },
            searchFiltersStore: {
                onClearAllFilters: jest.fn(),
                onCloseFilters: jest.fn(),
            },
            routerStore: {
                redirectToSearchResultsPage: jest.fn(),
                clearIsClickBackToSearch: jest.fn(),
            },
            queryParamStore: {
                buildSearchQuery: jest.fn(),
            },
            bookingStore: {
                clearBookingFlow: jest.fn(),
            },
            paymentStore: {
                clearPaymentStore: jest.fn(),
            },
            trackingStore: {
                searchEditTrigger: jest.fn(),
            },
            engageStore: {
                sendSearchEvent: jest.fn(),
            },
            hotelsStore: {
                fetchOffers: jest.fn(),
                hasOffers: false,
                saveOffers: jest.fn(),
            },
        });
    });

    it('should redirect to search result page AND do not fetch offers if isSearchResultsPage is false', () => {
        const { result } = renderHook(() => useSubmitSearchParameters());

        result.current.onSubmitSearchParameters();

        expect(mockStores.searchStore.trackUserSearch).toHaveBeenCalled();
        expect(mockStores.searchFiltersStore.onClearAllFilters).toHaveBeenCalled();
        expect(mockStores.routerStore.redirectToSearchResultsPage).toHaveBeenCalled();
        expect(mockStores.hotelsStore.saveOffers).not.toHaveBeenCalled();
        expect(mockStores.hotelsStore.fetchOffers).not.toHaveBeenCalled();
        expect(mockStores.searchStore.clearOldSearchParam).not.toHaveBeenCalled();
    });

    it('should clear old offers before searching if isSearchResultsPage is false', () => {
        mockStores.hotelsStore.hasOffers = true;
        const { result } = renderHook(() => useSubmitSearchParameters());

        result.current.onSubmitSearchParameters();

        expect(mockStores.searchStore.trackUserSearch).toHaveBeenCalled();
        expect(mockStores.routerStore.redirectToSearchResultsPage).toHaveBeenCalled();
        expect(mockStores.hotelsStore.saveOffers).toHaveBeenCalled();
        expect(mockStores.hotelsStore.fetchOffers).not.toHaveBeenCalled();
        expect(mockStores.searchStore.clearOldSearchParam).not.toHaveBeenCalled();
    });

    it('should redirectToSearchResultsPage be called with buildSearchParamsQuery, fetch offers and update data layer if isSearchResultsPage is true', () => {
        const paramString = 'PARAM_STRING';
        mockStores.layoutStore.isSearchResultsPage = true;
        mockStores.queryParamStore.buildSearchQuery = jest.fn().mockReturnValue(paramString);

        const { result } = renderHook(() => useSubmitSearchParameters());

        result.current.onSubmitSearchParameters();

        expect(mockStores.searchStore.trackUserSearch).toHaveBeenCalled();
        expect(mockStores.routerStore.redirectToSearchResultsPage).toHaveBeenCalledWith(paramString);
        expect(mockStores.hotelsStore.saveOffers).not.toHaveBeenCalled();
        expect(mockStores.hotelsStore.fetchOffers).toHaveBeenCalled();
        expect(mockStores.searchStore.clearOldSearchParam).toHaveBeenCalled();
        expect(mockStores.engageStore.sendSearchEvent).toHaveBeenCalled();
        expect(mockStores.trackingStore.searchEditTrigger).toHaveBeenCalled();
    });

    it('should execute onClear before submitting a new search params', () => {
        const { result } = renderHook(() => useSubmitSearchParameters());

        result.current.onSubmitSearchParameters();

        expect(mockStores.searchFiltersStore.onClearAllFilters).toHaveBeenCalled();
        expect(mockStores.searchFiltersStore.onCloseFilters).toHaveBeenCalled();
        expect(mockStores.searchStore.setPageNumber).toHaveBeenCalledWith(1);
        expect(mockStores.bookingStore.clearBookingFlow).toHaveBeenCalled();
        expect(mockStores.paymentStore.clearPaymentStore).toHaveBeenCalled();
        expect(mockStores.routerStore.clearIsClickBackToSearch).toHaveBeenCalled();
        expect(mockStores.searchStore.setSelectedOfferIndex).toHaveBeenCalledWith(-1);
    });
});
