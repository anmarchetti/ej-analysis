import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RefundSuccessPopup from './RefundSuccessPopup';

const departureDate = 'test';
const countryName = 'test';
const bookingReference = 'test';
const flightReference = 'test';

const mockBookingWithRoutes = (
    routes = [
        {
            extRefId: flightReference,
            depDate: departureDate,
        },
    ],
) =>
    ({
        package: {
            accom: {
                hotel: {
                    name: 'hotel',
                    country: {
                        name: countryName,
                    },
                    location: {
                        name: '',
                    },
                    region: {
                        name: '',
                    },
                },
                leadPassenger: { email: 'email' },
                rooms: [],
            },
            transport: {
                routes,
            },
            location: {
                region: '',
            },
        },
        guests: [],
        bookingReference,
    } as any);

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    holidayCreditStore: {
        booking: mockBookingWithRoutes(),
        recentRefund: { cash: 1, credit: 2 },
        isRefundSuccessPopupShown: true,
        toggleCreditSuccessPopup: jest.fn(),
    },
    viewBookingStore: { getBooking: jest.fn() },
    trackingStore: { fireViewBookingEvent: jest.fn() },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RefundSuccessPopup />', () => {
    beforeEach(() => {
        mockStores = createStores();
        window.scrollTo = jest.fn();
    });

    it('should NOT render when NOT isPopupShown', () => {
        mockStores.holidayCreditStore.isRefundSuccessPopupShown = false;
        const { container } = render(<RefundSuccessPopup />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render refund success popup class', () => {
        const { getByText } = render(<RefundSuccessPopup />);

        expect(getByText(SitecoreDictionary.CreditConfirmSuccessPopupTitle)).toBeInTheDocument();
    });

    it('should render 3 buttons', () => {
        const { getAllByRole } = render(<RefundSuccessPopup />);

        expect(getAllByRole('button').length).toBe(3);
    });

    it('should call toggleCreditSuccessPopup after clicking CreditConfirmSuccessPopupSeeCredit button', async () => {
        const { getByText } = render(<RefundSuccessPopup />);

        await userEvent.click(getByText(SitecoreDictionary.CreditConfirmSuccessPopupSeeCredit));
        expect(mockStores.holidayCreditStore.toggleCreditSuccessPopup).toHaveBeenCalledWith(false);
    });

    it('should NOT call getBooking after clicking CreditConfirmSuccessPopupViewBooking button if no booking', async () => {
        mockStores.holidayCreditStore.booking = null as any;
        const { getByText } = render(<RefundSuccessPopup />);

        await userEvent.click(getByText(SitecoreDictionary.CreditConfirmSuccessPopupViewBooking));
        expect(mockStores.viewBookingStore.getBooking).not.toHaveBeenCalled();
    });

    it('should call getBooking after clicking CreditConfirmSuccessPopupViewBooking button', async () => {
        const { getByText } = render(<RefundSuccessPopup />);

        await userEvent.click(getByText(SitecoreDictionary.CreditConfirmSuccessPopupViewBooking));
        expect(mockStores.viewBookingStore.getBooking).toHaveBeenCalled();
    });

    it('fire tracking events -> see credits', () => {
        const { getByText } = render(<RefundSuccessPopup />);
        const viewButton = getByText('CreditConfirm.SuccessPopup.SeeCredit');
        fireEvent.click(viewButton);

        expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalled();
    });

    it('fire tracking events -> view booking', () => {
        const { getByText } = render(<RefundSuccessPopup />);
        const viewButton = getByText('CreditConfirm.SuccessPopup.ViewBooking');
        fireEvent.click(viewButton);

        expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalled();
    });
});
