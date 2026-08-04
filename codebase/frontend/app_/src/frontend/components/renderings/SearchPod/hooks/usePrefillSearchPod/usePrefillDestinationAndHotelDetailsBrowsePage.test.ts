import { waitFor } from '@testing-library/dom';
import { renderHook } from '@testing-library/react';

import { destinationOffers } from 'frontend/__mocks__/inspireMeQuiz';
import { DestinationType } from 'models/enum/DestinationType';
import usePrefillDestinationAndHotelDetailsBrowsePage, {
    IUsePrefillDestinationAndHotelDetailsBrowsePageProps,
} from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillDestinationAndHotelDetailsBrowsePage';

const createMockProps = (): IUsePrefillDestinationAndHotelDetailsBrowsePageProps => ({
    shouldSkipEffect: false,
    clearSearchValues: jest.fn(),
    getValuesFromQueryParamsStore: jest.fn(),
    setAllAvailableOrigins: jest.fn(),
    updateAvailableOrigins: jest.fn(),
    getTypeAheadDestinations: jest.fn().mockResolvedValue({
        destinations: [
            {
                code: 'ESTF',
                type: DestinationType.Country,
                showOnSearchPod: true,
            },
        ],
    }),
    changeDestinations: jest.fn(),
    selectSingleDestination: jest.fn(),
    updateAvailableDstCodes: jest.fn(),
    updateAvailableDates: jest.fn(),
    isDestinationPage: true,
    destinationCode: 'ESTF',
    giataHotelCode: 'GIATACODE',
    prevGiataHotelCode: 'PREV_GIATACODE',
    isDestinationPagePrev: false,
    isEditMode: false,
    isHotelDetailsBrowsePage: false,
    allAccommodationCodes: [],
    pageName: 'pageName',
    prevDestinationCode: '',
    quizResults: null,
    isPromotingIframe: jest.fn().mockReturnValue(false),
    loadAllDestinations: jest.fn().mockResolvedValue({}),
    origins: [],
    prevTemplateId: undefined,
    grabSearchValuesFromSearchStore: jest.fn(),
    trackSearchPodMounting: jest.fn(),
    isDestinationsLoaded: true,
});

let mockProps;

describe('usePrefillOnDestinationPage', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should prefill country destination page', async () => {
        renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

        expect(mockProps.clearSearchValues).toHaveBeenCalledWith(true);
        expect(mockProps.getTypeAheadDestinations).toHaveBeenCalledWith(mockProps.pageName);
        await waitFor(() => {
            expect(mockProps.changeDestinations).toHaveBeenCalledWith(
                [{ code: 'ESTF', type: DestinationType.Country, showOnSearchPod: true }],
                false,
                false,
            );
        });

        expect(mockProps.updateAvailableOrigins).toHaveBeenCalled();
        expect(mockProps.setAllAvailableOrigins).toHaveBeenCalled();
        expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
    });

    it('should prefill hotel destination page', async () => {
        const hotelDestination = {
            code: 'ESTF',
            type: DestinationType.Hotel,
            showOnSearchPod: true,
        };
        mockProps.getTypeAheadDestinations.mockResolvedValue({
            destinations: [hotelDestination],
        });
        renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

        await waitFor(() => {
            expect(mockProps.selectSingleDestination).toHaveBeenCalledWith(hotelDestination, false, false);
            expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
        });
    });

    it('should prefill virtual resort destination', async () => {
        const virtualResortDestination = {
            code: 'ESTF',
            type: DestinationType.VirtualResort,
            showOnSearchPod: true,
        };
        mockProps.getTypeAheadDestinations.mockResolvedValue({
            destinations: [virtualResortDestination],
        });
        renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

        await waitFor(() => {
            expect(mockProps.selectSingleDestination).toHaveBeenCalledWith(virtualResortDestination, false, false);
            expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
        });
    });

    it('should prefill Resort destination page', async () => {
        const resortDestination = {
            code: 'ESTF',
            type: DestinationType.Resort,
            showOnSearchPod: true,
        };
        mockProps.getTypeAheadDestinations.mockResolvedValue({
            destinations: [resortDestination],
        });
        renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

        await waitFor(() => {
            expect(mockProps.selectSingleDestination).toHaveBeenCalledWith(resortDestination, false, false);
            expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
        });
    });

    it('should prefill destination page after finishing inspire me quiz', async () => {
        mockProps.quizResults = destinationOffers;
        renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

        expect(mockProps.clearSearchValues).toHaveBeenCalledWith(true);
        expect(mockProps.getTypeAheadDestinations).toHaveBeenCalledWith(mockProps.pageName);
        await waitFor(() => {
            expect(mockProps.changeDestinations).toHaveBeenCalledWith(
                [{ code: 'ESTF', type: DestinationType.Country, showOnSearchPod: true }],
                false,
                false,
            );
        });
        expect(mockProps.getValuesFromQueryParamsStore).toHaveBeenCalled();
        expect(mockProps.updateAvailableOrigins).toHaveBeenCalled();
        expect(mockProps.updateAvailableDstCodes).toHaveBeenCalled();
        expect(mockProps.updateAvailableDates).toHaveBeenCalled();
        expect(mockProps.setAllAvailableOrigins).not.toHaveBeenCalled();
        expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
    });

    describe('Prefill page during transition from from destination to destination page', () => {
        beforeEach(() => {
            mockProps.isDestinationPagePrev = true;
            mockProps.isDestinationPage = true;
        });

        it('should prefill HotelDetailsBrowsePage', async () => {
            mockProps.isHotelDetailsBrowsePage = true;

            renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

            expect(mockProps.getTypeAheadDestinations).toHaveBeenCalledWith(mockProps.pageName);
        });

        it('should NOT prefill HotelDetailsBrowsePage when no giataDestinationCode', async () => {
            mockProps.isHotelDetailsBrowsePage = true;
            mockProps.giataHotelCode = '';

            renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

            expect(mockProps.getTypeAheadDestinations).not.toHaveBeenCalled();
        });

        it('should prefill non HotelDetailsBrowsePage page', async () => {
            mockProps.isHotelDetailsBrowsePage = false;
            mockProps.prevDestinationCode = 'PREV_DEST_CODE';

            renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

            expect(mockProps.getTypeAheadDestinations).toHaveBeenCalledWith(mockProps.pageName);
        });

        it('should NOT prefill non HotelDetailsBrowsePage page when no destinationCode', async () => {
            mockProps.isHotelDetailsBrowsePage = false;
            mockProps.destinationCode = '';

            renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

            expect(mockProps.getTypeAheadDestinations).not.toHaveBeenCalled();
        });
    });

    it('should prefill HotelDetailsBrowsePage page', async () => {
        mockProps.isHotelDetailsBrowsePage = true;
        renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

        expect(mockProps.clearSearchValues).toHaveBeenCalledWith(true);
        expect(mockProps.getTypeAheadDestinations).toHaveBeenCalledWith(mockProps.pageName);
        await waitFor(() => {
            expect(mockProps.changeDestinations).toHaveBeenCalledWith(
                [{ code: 'ESTF', type: DestinationType.Country, showOnSearchPod: true }],
                false,
                false,
            );
        });
        expect(mockProps.getValuesFromQueryParamsStore).toHaveBeenCalled();
        expect(mockProps.updateAvailableOrigins).toHaveBeenCalled();
        expect(mockProps.setAllAvailableOrigins).toHaveBeenCalled();
        expect(mockProps.trackSearchPodMounting).toHaveBeenCalled();
    });

    it('should prefill HotelDetailsBrowsePage with all accommodation codes', async () => {
        mockProps.isHotelDetailsBrowsePage = true;
        mockProps.destinationCode = '';
        mockProps.allAccommodationCodes = ['HOTEL_1', 'HOTEL_2'];
        mockProps.getTypeAheadDestinations.mockResolvedValue({
            destinations: [
                { code: 'HOTEL_1', type: DestinationType.Hotel, showOnSearchPod: true },
                { code: 'HOTEL_2', type: DestinationType.Hotel, showOnSearchPod: true },
                { code: 'HIDDEN', type: DestinationType.Hotel, showOnSearchPod: false },
            ],
        });

        renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

        await waitFor(() => {
            expect(mockProps.changeDestinations).toHaveBeenCalledWith(
                [
                    { code: 'HOTEL_1', type: DestinationType.Hotel, showOnSearchPod: true },
                    { code: 'HOTEL_2', type: DestinationType.Hotel, showOnSearchPod: true },
                ],
                false,
                false,
            );
        });
        expect(mockProps.selectSingleDestination).not.toHaveBeenCalled();
    });

    it('should fallback to destination code when accommodation codes are empty', async () => {
        mockProps.isHotelDetailsBrowsePage = true;
        mockProps.destinationCode = 'ESTF';
        mockProps.allAccommodationCodes = [];

        renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

        await waitFor(() => {
            expect(mockProps.changeDestinations).toHaveBeenCalledWith(
                [{ code: 'ESTF', type: DestinationType.Country, showOnSearchPod: true }],
                false,
                false,
            );
        });
    });

    it('should not prefill when destination and accommodation codes are empty', () => {
        mockProps.isHotelDetailsBrowsePage = true;
        mockProps.destinationCode = '';
        mockProps.allAccommodationCodes = [];

        renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

        expect(mockProps.getTypeAheadDestinations).not.toHaveBeenCalled();
        expect(mockProps.changeDestinations).not.toHaveBeenCalled();
        expect(mockProps.selectSingleDestination).not.toHaveBeenCalled();
    });

    it('should getValuesFromQueryParamsStore without API calls on HotelDetailsBrowsePage when user came from airline iframe', () => {
        mockProps.isHotelDetailsBrowsePage = true;
        mockProps.isPromotingIframe.mockReturnValue(true);

        renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

        expect(mockProps.clearSearchValues).not.toHaveBeenCalled();
        expect(mockProps.getValuesFromQueryParamsStore).toHaveBeenCalled();
    });

    it('should not call changeDestinations before destinations are loaded', async () => {
        mockProps.isDestinationsLoaded = false;
        const { rerender } = renderHook(() => usePrefillDestinationAndHotelDetailsBrowsePage(mockProps));

        expect(mockProps.changeDestinations).not.toHaveBeenCalled();

        mockProps.isDestinationsLoaded = true;

        rerender();

        await waitFor(() => {
            expect(mockProps.changeDestinations).toHaveBeenCalled();
        });
    });
});
