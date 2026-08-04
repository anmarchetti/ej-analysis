import { waitFor } from '@testing-library/dom';
import { renderHook } from '@testing-library/react';

import { mockMonthsAvailability } from 'frontend/__mocks__/monthsAvailability';
import usePrefillOtherPages, {
    IUsePrefillOtherPagesProps,
} from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillOtherPages';

const mockHandlePrefillSearchPodWithRecentSearch = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillSearchPod.utils', () => ({
    handlePrefillSearchPodWithRecentSearch: jest.fn(props => mockHandlePrefillSearchPodWithRecentSearch(props)),
}));

const createMockProps = (): IUsePrefillOtherPagesProps => ({
    shouldSkipEffect: false,
    loadAllDestinations: jest.fn(),
    isAllDestinationsPage: true,
    isAllHolidayTypesPage: false,
    isGenericPage: false,
    isMonthSearchEnabled: true,
    isHolidayTypePage: false,
    updateAvailableOrigins: jest.fn(),
    updateAvailableDates: jest.fn(),
    updateAvailableDstCodes: jest.fn(),
    setIsMonthSearch: jest.fn(),
    monthsAvailability: mockMonthsAvailability,
    updateOriginsDisplayValue: jest.fn(),
    updateDestinationsDisplayValue: jest.fn(),
    from: null,
    to: null,
    getSearchParamsFromLocalStorage: jest.fn(),
    prefillSearchParams: jest.fn(),
    clearSearchValues: jest.fn(),
    trackSearchPodMounting: jest.fn(),
});
let mockProps: IUsePrefillOtherPagesProps;

describe('usePrefillOtherPages', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should do nothing if shouldSkipEffect is true', async () => {
        mockProps.shouldSkipEffect = true;
        renderHook(() => usePrefillOtherPages(mockProps));

        await waitFor(() => {
            expect(mockProps.loadAllDestinations).not.toHaveBeenCalled();
            expect(mockProps.trackSearchPodMounting).not.toHaveBeenCalled();
        });
    });

    it('should do nothing if not on AllDestinations Page', async () => {
        mockProps.isAllDestinationsPage = false;
        renderHook(() => usePrefillOtherPages(mockProps));

        await waitFor(() => {
            expect(mockProps.loadAllDestinations).not.toHaveBeenCalled();
            expect(mockProps.trackSearchPodMounting).not.toHaveBeenCalled();
        });
    });

    it('should call methods on init', async () => {
        renderHook(() => usePrefillOtherPages(mockProps));

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
            });
        });
        expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
    });
});
