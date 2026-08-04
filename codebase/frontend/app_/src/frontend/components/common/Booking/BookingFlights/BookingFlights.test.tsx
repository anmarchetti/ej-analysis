import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores, mockFlightsRoutes } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import BookingFlights from './BookingFlights';

jest.mock('frontend/components/common/FlightsDetails/Flight/Flight', () => ({ route }) => (
    <div>{route.direction} flight</div>
));

jest.mock('frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper', () => ({
    __esModule: true,
    default: ({ dataTid, Title, children }) => (
        <div data-tid={dataTid}>
            {Title?.value && <h3 role='heading'>{Title.value}</h3>}
            {children}
        </div>
    ),
}));

const createProps = () => ({
    routes: [...mockFlightsRoutes],
    fields: {},
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<Flights />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            amendFlightsStore: {
                isAmendCTAVisible: false,
            },
            viewBookingStore: { isLuxuryPackage: false },
        });
    });

    it('should render flights', () => {
        render(<BookingFlights {...mockProps} />);

        expect(
            screen.getByRole('heading', { name: SitecoreDictionary.BookingSummaryTitlesFlights }),
        ).toBeInTheDocument();
        expect(screen.getByText('outbound flight')).toBeInTheDocument();
        expect(screen.getByText('inbound flight')).toBeInTheDocument();
    });

    it('should NOT render flights', () => {
        mockProps.routes = [];
        render(<BookingFlights {...mockProps} />);

        expect(screen.queryByText('outbound flight')).not.toBeInTheDocument();
        expect(screen.queryByText('inbound flight')).not.toBeInTheDocument();
    });

    it('should render late checkout banner', () => {
        mockProps.lateCheckoutBanner = <div data-tid='late-checkout-banner' />;

        render(<BookingFlights {...mockProps} />);

        expect(screen.queryByTestId('late-checkout-banner')).toBeInTheDocument();
    });

    describe('Amend button', () => {
        it('should render amend button', () => {
            mockStores.amendFlightsStore.isAmendCTAVisible = true;
            render(<BookingFlights {...mockProps} />);

            expect(
                screen.getByRole('button', { name: SitecoreDictionary.ViewBookingButtonsAmendFlights }),
            ).toBeInTheDocument();
        });

        it('should NOT render amend button', () => {
            mockStores.amendFlightsStore.isAmendCTAVisible = false;
            render(<BookingFlights {...mockProps} />);

            expect(screen.queryByText(SitecoreDictionary.ViewBookingButtonsAmendFlights)).not.toBeInTheDocument();
        });

        it('should call onAmendFlightsClick when button is clicked', () => {
            mockStores.amendFlightsStore.isAmendCTAVisible = true;
            mockProps.onAmendFlightsClick = jest.fn();
            render(<BookingFlights {...mockProps} />);
            const button = screen.getByRole('button', { name: SitecoreDictionary.ViewBookingButtonsAmendFlights });

            fireEvent.click(button);

            expect(mockProps.onAmendFlightsClick).toHaveBeenCalled();
        });

        it('should hide amend button when isNoFlightsAvailablePopupShown is true', () => {
            mockStores.amendFlightsStore.isAmendCTAVisible = true;
            mockStores.amendFlightsStore.isNoAvailableFlightsPopupShown = true;
            render(<BookingFlights {...mockProps} />);

            expect(screen.queryByText(SitecoreDictionary.ViewBookingButtonsAmendFlights)).not.toBeInTheDocument();
        });

        it('should hide amend button when isLuxuryPackage is true', () => {
            mockStores.amendFlightsStore.isAmendCTAVisible = true;
            mockStores.viewBookingStore.isLuxuryPackage = true;
            render(<BookingFlights {...mockProps} />);

            expect(screen.queryByText(SitecoreDictionary.ViewBookingButtonsAmendFlights)).not.toBeInTheDocument();
        });

        it('should not render button if isTradePortal', () => {
            mockStores.layoutStore.isTradePortal = true;
            mockStores.amendFlightsStore.isAmendCTAVisible = true;

            render(<BookingFlights {...mockProps} />);

            expect(screen.queryByText(SitecoreDictionary.ViewBookingButtonsAmendFlights)).not.toBeInTheDocument();
        });
    });
});
