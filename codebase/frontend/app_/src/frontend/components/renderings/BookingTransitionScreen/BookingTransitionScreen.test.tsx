import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';

import BookingTransitionScreen from './BookingTransitionScreen';

const createProps = () => ({
    fields: {
        TransitionMinimumTime: { value: 0 },
        Subtitle: { value: '' },
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('./components/BookingTransition', () => () => <div data-tid='transition' />);

describe('<BookingTransitionScreen />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: { isFullMaintenance: false, isHotelDetailsBookPage: false, isGuestDetailsPage: true },
            appStore: { isNavigationBooking: false, isScreenLessMedium: true, isLoading: false },
            bookingStore: { isValidatingPackage: false, selectedOffer: null },
        });
    });

    it('should NOT render if Full Maintenance', () => {
        mockStores.layoutStore.isFullMaintenance = true;
        const { container } = render(<BookingTransitionScreen {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render on HotelDetailsPage', () => {
        mockStores.layoutStore.isHotelDetailsBookPage = true;

        const { container } = render(<BookingTransitionScreen {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if no fields', () => {
        mockProps.fields = null;
        const { container } = render(<BookingTransitionScreen {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if not loading', async () => {
        const { container } = render(<BookingTransitionScreen {...mockProps} />);

        await waitFor(() => expect(container).toBeEmptyDOMElement());
    });

    it('should render if minimum time did not passed', () => {
        mockProps.TransitionMinimumTime = { value: 1000 };
        mockStores.appStore.isNavigationBooking = true;
        const { getByTestId } = render(<BookingTransitionScreen {...mockProps} />);

        expect(getByTestId('transition')).toBeInTheDocument();
    });

    it('should render if navigation booking', () => {
        mockStores.appStore.isNavigationBooking = true;
        const { getByTestId } = render(<BookingTransitionScreen {...mockProps} />);

        expect(getByTestId('transition')).toBeInTheDocument();
    });

    it('should render if validating package', () => {
        mockStores.bookingStore.isValidatingPackage = true;
        const { getByTestId } = render(<BookingTransitionScreen {...mockProps} />);

        expect(getByTestId('transition')).toBeInTheDocument();
    });

    it('should render when loading', () => {
        mockStores.appStore.isLoading = true;
        const { getByTestId } = render(<BookingTransitionScreen {...mockProps} />);

        expect(getByTestId('transition')).toBeInTheDocument();
    });
});
