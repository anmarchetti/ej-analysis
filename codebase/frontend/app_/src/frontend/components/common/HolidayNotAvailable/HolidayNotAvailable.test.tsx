import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { FlightPlusHotelSitePath } from 'models/enum/SitePath';

import { HolidayNotAvailable } from './HolidayNotAvailable';

jest.mock('frontend/utils/route.utils');

jest.mock('frontend/components/common/RichTextDictionary', () => ({ dictionaryKey }) => (
    <div data-tid='rich-text'>{dictionaryKey}</div>
));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, title }) => (
        <div>
            Popup
            <span> {title}</span>
            {children}
        </div>
    ),
}));

const resetMocks = () =>
    createMockStores({
        layoutStore: { isFullMaintenance: false },
        bookingStore: {
            isPackageValid: false,
            failedToLoadData: true,
            selectedOffer: null,
            resetBookingStore: jest.fn(),
            isNotEnoughLCBForLuxBooking: false,
        },
        appStore: { isCookiesPopupWasShown: true },
        routerStore: {
            redirectToHomePage: jest.fn(),
            onClickBackButton: jest.fn(),
            backToSearchUrl: jest.fn(),
            hasPromo: false,
            listenToPopState: jest.fn().mockImplementation(callback => () => callback && callback()),
        },
        searchStore: { searchTo: { selectedDestinationCodes: ['ITSA0007'] } }, // 8 symbols length ia a Hotel destination type
        seatMapStore: {
            isSelectedSeatsUnavailableError: false,
        },
        trackingStore: { trackUnavailablePopup: jest.fn() },
        queryParamStore: { isFlightPlusHotelFunnel: false, buildFlightPlusHotelUrl: jest.fn() },
    });

let mockStores = resetMocks();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HolidayNotAvailable/>', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = resetMocks();
    });

    it('should render standard', () => {
        render(<HolidayNotAvailable />);

        expect(screen.getByTestId('rich-text')).toHaveTextContent(SitecoreDictionary.GlobalsTitlesWeAreSorryNoOffers);
        expect(screen.getByTestId('holiday-not-available-button')).toHaveTextContent(
            SitecoreDictionary.GlobalsButtonsHomePage,
        );
        expect(screen.getByText('Popup')).toHaveTextContent(SitecoreDictionary.GlobalsTitlesHolidayNotAvailable);
    });

    it('should render search again button when it is direct hotel search', () => {
        mockStores.searchStore.searchTo.selectedDestinationCodes = ['GRCR']; // 4 symbols length is not Hotel destination type
        render(<HolidayNotAvailable />);

        expect(screen.getByTestId('holiday-not-available-button')).toHaveTextContent(
            SitecoreDictionary.GlobalsButtonsSearchAgain,
        );
    });

    it('should render popup when isNotEnoughLCBForLuxBooking is true', () => {
        mockStores.bookingStore.isNotEnoughLCBForLuxBooking = true;
        render(<HolidayNotAvailable />);

        expect(screen.getByText('Popup')).toHaveTextContent(SitecoreDictionary.GlobalsTitlesHolidayNotAvailable);
    });

    describe('empty render', () => {
        beforeEach(() => {
            mockStores.bookingStore.selectedOffer = null;
        });

        it('should NOT render when it is full maintenance mode', () => {
            mockStores.layoutStore.isFullMaintenance = true;
            const { container } = render(<HolidayNotAvailable />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should NOT render when cookie popup was not shown', () => {
            mockStores.appStore.isCookiesPopupWasShown = false;
            const { container } = render(<HolidayNotAvailable />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should NOT render when package is not valid and isSelectedSeatsUnavailableError is true', () => {
            mockStores.bookingStore.failedToLoadData = false;
            mockStores.bookingStore.selectedOffer = { hotel: { resort: { name: 'testName' } } } as Nullable<IOffer>;
            mockStores.seatMapStore.isSelectedSeatsUnavailableError = true;
            const { container } = render(<HolidayNotAvailable />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should NOT render when package is valid but isSelectedSeatsUnavailableError is false', () => {
            mockStores.bookingStore.failedToLoadData = false;
            mockStores.bookingStore.selectedOffer = { hotel: { resort: { name: 'testName' } } } as Nullable<IOffer>;
            mockStores.bookingStore.isPackageValid = true;
            const { container } = render(<HolidayNotAvailable />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    describe('button click', () => {
        it('should call resetBookingStore and onSearchAgain when go-back button is clicked', async () => {
            mockStores.searchStore.searchTo.selectedDestinationCodes = ['GRCR']; // 4 symbols length is not a Hotel destination type
            render(<HolidayNotAvailable />);

            await userEvent.click(screen.getByTestId('holiday-not-available-button'));

            expect(mockStores.bookingStore.resetBookingStore).toHaveBeenCalled();
            expect(mockStores.routerStore.onClickBackButton).toHaveBeenCalledWith(
                mockStores.routerStore.backToSearchUrl,
                {
                    BackToPromoFromHotelDetails: mockStores.routerStore.hasPromo,
                },
            );
        });

        it('should call resetBookingStore and redirectToHomePage when go-back button is clicked and it is direct hotel search', async () => {
            render(<HolidayNotAvailable />);

            await userEvent.click(screen.getByTestId('holiday-not-available-button'));

            expect(mockStores.bookingStore.resetBookingStore).toHaveBeenCalled();
            expect(mockStores.routerStore.redirectToHomePage).toHaveBeenCalled();
        });
    });

    describe('FlightPlusHotel funnel', () => {
        beforeEach(() => {
            mockStores.queryParamStore.isFlightPlusHotelFunnel = true;
        });

        it('should render FlightPlusHotel trip not available text', () => {
            render(<HolidayNotAvailable />);

            expect(screen.getByTestId('rich-text')).toHaveTextContent(
                SitecoreDictionary.FlightPlusHotelLabelsTripNotAvailable,
            );
        });

        it('should render search again button', () => {
            render(<HolidayNotAvailable />);

            expect(screen.getByTestId('holiday-not-available-button')).toHaveTextContent(
                SitecoreDictionary.GlobalsButtonsSearchAgain,
            );
        });

        it('should call resetBookingStore, buildFlightPlusHotelUrl and NOT call redirectToHomePage or onClickBackButton when button is clicked', async () => {
            render(<HolidayNotAvailable />);

            await userEvent.click(screen.getByTestId('holiday-not-available-button'));

            expect(mockStores.bookingStore.resetBookingStore).toHaveBeenCalled();
            expect(mockStores.queryParamStore.buildFlightPlusHotelUrl).toHaveBeenCalledWith(
                FlightPlusHotelSitePath.Flights,
                false,
                true,
            );
            expect(mockStores.routerStore.redirectToHomePage).not.toHaveBeenCalled();
            expect(mockStores.routerStore.onClickBackButton).not.toHaveBeenCalled();
        });
    });

    describe('mount/unmount', () => {
        it('should call listenToPopState and trackUnavailablePopup on mount', () => {
            render(<HolidayNotAvailable />);

            expect(mockStores.trackingStore.trackUnavailablePopup).toHaveBeenCalled();
            expect(mockStores.routerStore.listenToPopState).toHaveBeenCalled();
            expect(mockStores.bookingStore.resetBookingStore).not.toHaveBeenCalled();
            expect(mockStores.routerStore.onClickBackButton).not.toHaveBeenCalled();
            expect(mockStores.routerStore.redirectToHomePage).not.toHaveBeenCalled();
        });

        it('should call resetBookingStore on unmount', () => {
            const { unmount } = render(<HolidayNotAvailable />);

            unmount();

            expect(mockStores.bookingStore.resetBookingStore).toHaveBeenCalled();
        });

        it('should NOT call listenToPopState and trackUnavailablePopup on mount when shouldShow is false', () => {
            mockStores.bookingStore.failedToLoadData = false;
            mockStores.bookingStore.selectedOffer = {};
            mockStores.bookingStore.isPackageValid = true;

            render(<HolidayNotAvailable />);

            expect(mockStores.trackingStore.trackUnavailablePopup).not.toHaveBeenCalled();
            expect(mockStores.routerStore.listenToPopState).not.toHaveBeenCalled();
        });

        it('should NOT call resetBookingStore on unmount when package is not valid and isSelectedSeatsUnavailableError is true', () => {
            mockStores.bookingStore.failedToLoadData = false;
            mockStores.bookingStore.selectedOffer = { hotel: { resort: { name: 'testName' } } } as Nullable<IOffer>;
            mockStores.seatMapStore.isSelectedSeatsUnavailableError = true;
            const { unmount } = render(<HolidayNotAvailable />);

            unmount();

            expect(mockStores.bookingStore.resetBookingStore).not.toHaveBeenCalled();
        });

        it('should NOT call resetBookingStore on unmount when package is valid but isSelectedSeatsUnavailableError is false', () => {
            mockStores.bookingStore.failedToLoadData = false;
            mockStores.bookingStore.selectedOffer = { hotel: { resort: { name: 'testName' } } } as Nullable<IOffer>;
            mockStores.bookingStore.isPackageValid = true;
            const { unmount } = render(<HolidayNotAvailable />);

            unmount();

            expect(mockStores.bookingStore.resetBookingStore).not.toHaveBeenCalled();
        });
    });
});
