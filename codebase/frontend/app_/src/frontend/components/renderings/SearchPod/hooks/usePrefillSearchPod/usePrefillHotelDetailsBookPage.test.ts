import { renderHook, waitFor } from '@testing-library/react';

import { mockMonthsAvailability } from 'frontend/__mocks__/monthsAvailability';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import usePrefillHotelDetailsBookPage, {
    IUsePrefillHotelDetailsBookPage,
} from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillHotelDetailsBookPage';

const mockHandlePrefillSearchPod = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillSearchPod.utils', () => ({
    handlePrefillSearchPod: jest.fn(props => mockHandlePrefillSearchPod(props)),
}));

const createMockProps = (): IUsePrefillHotelDetailsBookPage => ({
    currentPath: '/',
    shouldSkipEffect: false,
    isHotelDetailsBookPage: true,
    isHotelDetailsBookPagePrev: false,
    isPromoPagePrev: false,
    prevPath: '/',
    syncDestinationItems: jest.fn(),
    updateOriginsDisplayValue: jest.fn(),
    getValuesFromQueryParamsStore: jest.fn(),
    loadAllDestinations: jest.fn(),
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
    hasPromo: false,
    updateSearchOrigins: jest.fn(),
    monthsAvailability: mockMonthsAvailability,
    updateDestinationsDisplayValue: jest.fn(),
    trackSearchPodMounting: jest.fn(),
});
let mockProps: IUsePrefillHotelDetailsBookPage;

describe('usePrefillOnHotelDetailsBookPage', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should call getValuesFromQueryParamsStore when PROMO_TEMPLATES includes prevTemplateId', async () => {
        mockProps.prevTemplateId = SitecoreTemplateId.PromoPage;
        renderHook(() => usePrefillHotelDetailsBookPage(mockProps));

        await waitFor(() => {
            expect(mockProps.getValuesFromQueryParamsStore).toHaveBeenCalled();
        });
    });

    it('should call prefill methods when navigating between hotel detail book pages', async () => {
        mockProps.currentPath = '/spain/majorca/hotel-a';
        mockProps.prevPath = '/spain/majorca/hotel-b';
        mockProps.isHotelDetailsBookPagePrev = true;
        renderHook(() => usePrefillHotelDetailsBookPage(mockProps));

        await waitFor(() => {
            expect(mockHandlePrefillSearchPod).toHaveBeenCalledTimes(2);
            expect(mockProps.syncDestinationItems).toHaveBeenCalledTimes(1);
            expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
        });
    });

    it('should call prefill methods when navigating from PromoPage to HotelDetailsBookPage', async () => {
        mockProps.isPromoPagePrev = true;
        renderHook(() => usePrefillHotelDetailsBookPage(mockProps));

        await waitFor(() => {
            expect(mockHandlePrefillSearchPod).toHaveBeenCalledTimes(2);
            expect(mockProps.syncDestinationItems).toHaveBeenCalledTimes(1);
            expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
        });
    });

    it('should not call prefill methods when currentPath and prevPath are equal', async () => {
        mockProps.currentPath = '/spain/majorca/hotel-a';
        mockProps.prevPath = mockProps.currentPath;
        mockProps.isHotelDetailsBookPagePrev = true;
        renderHook(() => usePrefillHotelDetailsBookPage(mockProps));

        await waitFor(() => {
            expect(mockHandlePrefillSearchPod).not.toHaveBeenCalled();
            expect(mockProps.syncDestinationItems).not.toHaveBeenCalled();
            expect(mockProps.trackSearchPodMounting).not.toHaveBeenCalled();
        });
    });

    it('should not call prefill methods if shouldSkipEffect is true', async () => {
        mockProps.shouldSkipEffect = true;
        renderHook(() => usePrefillHotelDetailsBookPage(mockProps));

        await waitFor(() => {
            expect(mockHandlePrefillSearchPod).not.toHaveBeenCalled();
            expect(mockProps.syncDestinationItems).not.toHaveBeenCalled();
            expect(mockProps.trackSearchPodMounting).not.toHaveBeenCalled();
        });
    });

    it('should not call prefill methods if isHotelDetailsBookPage is false', async () => {
        mockProps.isHotelDetailsBookPage = false;
        renderHook(() => usePrefillHotelDetailsBookPage(mockProps));

        await waitFor(() => {
            expect(mockHandlePrefillSearchPod).not.toHaveBeenCalled();
            expect(mockProps.syncDestinationItems).not.toHaveBeenCalled();
            expect(mockProps.trackSearchPodMounting).not.toHaveBeenCalled();
        });
    });
});
