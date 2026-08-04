import { createMockStores } from 'frontend/__mocks__';

import { useAmendHotelUnavailablePopup } from './useAmendHotelUnavailablePopup';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useAmendHotelUnavailablePopup', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendDatesStore: {
                onAmendDatesButtonClick: jest.fn(),
                isInitialDataLoading: false,
            },
            amendHotelStore: {
                isNoAvailabilityError: false,
                setIsNoAvailabilityError: jest.fn(),
            },
            layoutStore: {
                isAmendPaymentPage: false,
                isAmendHotelSummaryPage: false,
                isAmendHotelPage: false,
            },
            routerStore: {
                redirectToAmendHotelPage: jest.fn(),
                isRedirectionLoading: false,
            },
        });
    });

    describe('NOT isAmendPaymentPage', () => {
        it('should return data for NOT isAmendPaymentPage or isAmendHotelSummaryPage', () => {
            const data = useAmendHotelUnavailablePopup();

            expect(data.onClose).toStrictEqual(expect.any(Function));
            expect(data.onConfirm).toStrictEqual(expect.any(Function));
            expect(data.isLoading).toBe(false);
            expect(data.isShown).toBe(false);
        });

        it('should call onConfirm when NOT isAmendPaymentPage or isAmendHotelSummaryPage', async () => {
            const data = useAmendHotelUnavailablePopup();

            await data.onConfirm();

            expect(mockStores.amendDatesStore.onAmendDatesButtonClick).toHaveBeenCalled();
            expect(mockStores.routerStore.redirectToAmendHotelPage).not.toHaveBeenCalled();
            expect(mockStores.amendHotelStore.setIsNoAvailabilityError).toHaveBeenCalledWith(false);
        });

        it('should call onConfirm when isAmendPaymentPage is true, isAmendHotelSummaryPage is false', async () => {
            mockStores.layoutStore.isAmendPaymentPage = true;
            const data = useAmendHotelUnavailablePopup();

            await data.onConfirm();

            expect(mockStores.amendDatesStore.onAmendDatesButtonClick).not.toHaveBeenCalled();
            expect(mockStores.routerStore.redirectToAmendHotelPage).toHaveBeenCalled();
            expect(mockStores.amendHotelStore.setIsNoAvailabilityError).toHaveBeenCalledWith(false);
        });

        it('should call onConfirm when isAmendPaymentPage is false, isAmendHotelSummaryPage is true', async () => {
            mockStores.layoutStore.isAmendHotelSummaryPage = true;
            const data = useAmendHotelUnavailablePopup();

            await data.onConfirm();

            expect(mockStores.amendDatesStore.onAmendDatesButtonClick).not.toHaveBeenCalled();
            expect(mockStores.routerStore.redirectToAmendHotelPage).toHaveBeenCalled();
            expect(mockStores.amendHotelStore.setIsNoAvailabilityError).toHaveBeenCalledWith(false);
        });
    });

    it('should call only setIsNoAvailabilityError when onConfirm called when isAmendHotelPage is true', async () => {
        mockStores.layoutStore.isAmendHotelPage = true;
        const data = useAmendHotelUnavailablePopup();

        await data.onConfirm();

        expect(mockStores.amendDatesStore.onAmendDatesButtonClick).not.toHaveBeenCalled();
        expect(mockStores.routerStore.redirectToAmendHotelPage).not.toHaveBeenCalled();
        expect(mockStores.amendHotelStore.setIsNoAvailabilityError).toHaveBeenCalledWith(false);
    });

    it('should return isLoading true when isRedirectionLoading is true', () => {
        mockStores.routerStore.isRedirectionLoading = true;
        const data = useAmendHotelUnavailablePopup();

        expect(data.isLoading).toBe(true);
    });

    it('should return isLoading true when isInitialDataLoading is true', () => {
        mockStores.amendDatesStore.isInitialDataLoading = true;
        const data = useAmendHotelUnavailablePopup();

        expect(data.isLoading).toBe(true);
    });

    it('should call setIsNoAvailabilityError when call onClose', () => {
        const data = useAmendHotelUnavailablePopup();

        data.onClose();

        expect(mockStores.amendHotelStore.setIsNoAvailabilityError).toHaveBeenCalledWith(false);
    });
});
