import { waitFor } from '@testing-library/dom';
import { renderHook } from '@testing-library/react';

import { mockMonthsAvailability } from 'frontend/__mocks__/monthsAvailability';
import { DataStatus } from 'models/enum/DataStatus';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import usePrefillSearchResultsPage, {
    IUsePrefillSearchResultsPageProps,
} from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillSearchResultsPage';

const createMockProps = (): IUsePrefillSearchResultsPageProps => ({
    shouldSkipEffect: false,
    getValuesFromQueryParamsStore: jest.fn(),
    loadAllDestinations: jest.fn(),
    isSearchResultsPage: true,
    prevTemplateId: undefined,
    updateAvailableOrigins: jest.fn(),
    updateAvailableDates: jest.fn(),
    updateAvailableDstCodes: jest.fn(),
    from: null,
    to: null,
    setIsMonthSearch: jest.fn(),
    origins: [],
    grabSearchValuesFromSearchStore: jest.fn(),
    updateSearchDates: jest.fn(),
    parseBrowserQuery: jest.fn(),
    syncUrlParamsWithStores: jest.fn(),
    syncDestinationItems: jest.fn(),
    fetchOffers: jest.fn(),
    monthsAvailability: mockMonthsAvailability,
    updateOriginsDisplayValue: jest.fn(),
    updateDestinationsDisplayValue: jest.fn(),
    updateOffersDataStatus: jest.fn(),
    trackSearchPodMounting: jest.fn(),
});
let mockProps: IUsePrefillSearchResultsPageProps;

describe('usePrefillSearchResultsPage', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('Should set loading property to loading status on search result page', () => {
        renderHook(() => usePrefillSearchResultsPage(mockProps));

        expect(mockProps.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.Loading);
    });

    it('should do nothing if shouldSkipEffect is true', () => {
        mockProps.shouldSkipEffect = true;
        renderHook(() => usePrefillSearchResultsPage(mockProps));

        expect(mockProps.loadAllDestinations).not.toHaveBeenCalled();
        expect(mockProps.trackSearchPodMounting).not.toHaveBeenCalled();
    });

    it('should do nothing if isSearchResultsPage is false', () => {
        mockProps.isSearchResultsPage = false;
        renderHook(() => usePrefillSearchResultsPage(mockProps));

        expect(mockProps.loadAllDestinations).not.toHaveBeenCalled();
        expect(mockProps.trackSearchPodMounting).not.toHaveBeenCalled();
    });

    it('should call getValuesFromQueryParamsStore when DESTINATION_TEMPLATES includes prevTemplateId', async () => {
        mockProps.prevTemplateId = SitecoreTemplateId.RegionBrowsePage;
        renderHook(() => usePrefillSearchResultsPage(mockProps));

        await waitFor(() => {
            expect(mockProps.getValuesFromQueryParamsStore).toHaveBeenCalled();
        });
    });

    it('should set isMonthSearch to false when from/to are null', async () => {
        renderHook(() => usePrefillSearchResultsPage(mockProps));

        await waitFor(() => {
            expect(mockProps.setIsMonthSearch).toHaveBeenCalledWith(false);
        });
    });

    it('should call updateSearchDates if prevTemplateId when coming from HotelDetailsBook page', async () => {
        mockProps.prevTemplateId = SitecoreTemplateId.HotelDetailsBook;

        renderHook(() => usePrefillSearchResultsPage(mockProps));

        await waitFor(() => {
            expect(mockProps.updateSearchDates).toHaveBeenCalled();
            expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
        });
    });

    it('should call fetchOffers, parseBrowserQuery, and syncUrlParamsWithStores', async () => {
        mockProps.prevTemplateId = SitecoreTemplateId.DealsPage; // not a promo or destination template

        renderHook(() => usePrefillSearchResultsPage(mockProps));

        await waitFor(() => {
            expect(mockProps.parseBrowserQuery).toHaveBeenCalled();
            expect(mockProps.syncUrlParamsWithStores).toHaveBeenCalled();
            expect(mockProps.fetchOffers).toHaveBeenCalledWith(true);
            expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
        });
    });

    it('should call syncDestinationItems and grabSearchValuesFromSearchStore when coming from promo page', async () => {
        mockProps.prevTemplateId = SitecoreTemplateId.PromoPage;

        renderHook(() => usePrefillSearchResultsPage(mockProps));

        await waitFor(() => {
            expect(mockProps.syncDestinationItems).toHaveBeenCalled();
            expect(mockProps.grabSearchValuesFromSearchStore).toHaveBeenCalled();
            expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
        });
    });

    it('should call updateSearchDates with from/to if coming from HotelDetailsBook page', async () => {
        mockProps.prevTemplateId = SitecoreTemplateId.HotelDetailsBook;
        mockProps.from = new Date('2025-09-10');
        mockProps.to = new Date('2025-09-10');

        renderHook(() => usePrefillSearchResultsPage(mockProps));

        await waitFor(() => {
            expect(mockProps.updateSearchDates).toHaveBeenCalledWith(mockProps.from, mockProps.to);
            expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
        });
    });
});
