import { waitFor } from '@testing-library/dom';
import { renderHook } from '@testing-library/react';

import { mockMonthsAvailability } from 'frontend/__mocks__/monthsAvailability';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import usePrefillHomePage, {
    IUsePrefillHomePageProps,
} from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillHomePage';

const mockHandlePrefillSearchPodWithRecentSearch = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillSearchPod.utils', () => ({
    handlePrefillSearchPodWithRecentSearch: jest.fn(props => mockHandlePrefillSearchPodWithRecentSearch(props)),
}));

const createMockProps = (): IUsePrefillHomePageProps => ({
    shouldSkipEffect: false,
    loadAllDestinations: jest.fn(),
    prevTemplateId: undefined,
    getSearchParamsFromLocalStorage: jest.fn(),
    isHomePage: true,
    isMonthSearchEnabled: true,
    prefillSearchParams: jest.fn(),
    updateAvailableOrigins: jest.fn(),
    updateAvailableDates: jest.fn(),
    updateAvailableDstCodes: jest.fn(),
    from: null,
    to: null,
    setIsMonthSearch: jest.fn(),
    origins: [],
    grabSearchValuesFromSearchStore: jest.fn(),
    monthsAvailability: mockMonthsAvailability,
    updateOriginsDisplayValue: jest.fn(),
    updateDestinationsDisplayValue: jest.fn(),
    clearSearchValues: jest.fn(),
    isReferer: false,
    trackSearchPodMounting: jest.fn(),
});
let mockProps: IUsePrefillHomePageProps;

describe('usePrefillHomePage', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should do nothing if shouldSkipEffect is true', () => {
        mockProps.shouldSkipEffect = true;
        renderHook(() => usePrefillHomePage(mockProps));

        expect(mockProps.loadAllDestinations).not.toHaveBeenCalled();
    });

    it('should do nothing if not on home page', () => {
        mockProps.isHomePage = false;
        renderHook(() => usePrefillHomePage(mockProps));

        expect(mockProps.loadAllDestinations).not.toHaveBeenCalled();
    });

    it('should call all methods by default', async () => {
        renderHook(() => usePrefillHomePage(mockProps));

        expect(mockProps.loadAllDestinations).toHaveBeenCalled();
        await waitFor(() => {
            expect(mockHandlePrefillSearchPodWithRecentSearch).toHaveBeenCalledWith({
                updateAvailableOrigins: mockProps.updateAvailableOrigins,
                updateAvailableDates: mockProps.updateAvailableDates,
                monthsAvailability: mockProps.monthsAvailability,
                updateAvailableDstCodes: mockProps.updateAvailableDstCodes,
                updateOriginsDisplayValue: mockProps.updateOriginsDisplayValue,
                updateDestinationsDisplayValue: mockProps.updateDestinationsDisplayValue,
                from: mockProps.from,
                to: mockProps.to,
                setIsMonthSearch: mockProps.setIsMonthSearch,
                getSearchParamsFromLocalStorage: mockProps.getSearchParamsFromLocalStorage,
                prefillSearchParams: mockProps.prefillSearchParams,
                clearSearchValues: mockProps.clearSearchValues,
                isReferer: mockProps.isReferer,
            });
        });
        expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
    });

    it('should call grabSearchValuesFromSearchStore when opened via direct link', async () => {
        renderHook(() => usePrefillHomePage(mockProps));

        await waitFor(() => {
            expect(mockProps.grabSearchValuesFromSearchStore).toHaveBeenCalled();
        });
    });

    it('should NOT call grabSearchValuesFromSearchStore when prevTemplateId is set', async () => {
        mockProps.prevTemplateId = SitecoreTemplateId.HotelDetailsBrowse;
        renderHook(() => usePrefillHomePage(mockProps));

        await waitFor(() => {
            expect(mockProps.grabSearchValuesFromSearchStore).not.toHaveBeenCalled();
        });
    });

    it('should NOT call grabSearchValuesFromSearchStore when origins are set', async () => {
        mockProps.origins = ['mocked-origin'];
        renderHook(() => usePrefillHomePage(mockProps));

        await waitFor(() => {
            expect(mockProps.grabSearchValuesFromSearchStore).not.toHaveBeenCalled();
        });
    });
});
