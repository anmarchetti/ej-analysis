import React from 'react';
import { render } from '@testing-library/react';

import { mockLuggageListFields } from 'frontend/__mocks__';

import TradePortalConfirmBookingDetails from './TradePortalConfirmBookingDetails';

const createProps = () => ({
    fields: {
        Title: { value: 'Test' },
        ...mockLuggageListFields,
    },
});

const createStores = () => ({ guestDetailsStore: { hasGuestInStorage: jest.fn(() => true) } });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockBookingDetails = jest.fn();
jest.mock('frontend/components/renderings/Payment/components/BookingDetails/BookingDetails', () => ({
    __esModule: true,
    default: props => {
        mockBookingDetails(props);

        return <div data-tid='booking-details' />;
    },
}));

describe('<TradePortalConfirmBookingDetails />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if no fields', () => {
        mockProps.fields = null;
        const { container } = render(<TradePortalConfirmBookingDetails {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if no guests in storage', () => {
        mockStores.guestDetailsStore.hasGuestInStorage = jest.fn(() => false);
        const { container } = render(<TradePortalConfirmBookingDetails {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render title', () => {
        mockProps.fields.Title = null;
        const { queryByRole } = render(<TradePortalConfirmBookingDetails {...mockProps} />);

        expect(queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render title and booking details', () => {
        const { getByRole, getByTestId } = render(<TradePortalConfirmBookingDetails {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('Test');
        expect(getByTestId('booking-details')).toBeInTheDocument();
        expect(mockBookingDetails).toHaveBeenCalledWith({ className: 'mb-0', fields: mockProps.fields });
    });
});
