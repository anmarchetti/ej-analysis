import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { isHolidayStore } from 'frontend/store/holidays';

import { specialRequestsFields } from './__mocks__/SpecialRequestsFields';
import { SpecialRequests, TSpecialRequestsProps } from './SpecialRequests';

expect.extend(toHaveNoViolations);

const createProps = (): TSpecialRequestsProps => ({
    fields: specialRequestsFields,
    params: {
        IsSleekDesign: undefined,
    },
    rendering: {},
});

let props: TSpecialRequestsProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/store/holidays', () => ({
    isHolidayStore: jest.fn(() => true),
}));

const mockBookingSpecialRequests = jest.fn();

jest.mock('./components/BookingSpecialRequests/BookingSpecialRequests', () => ({
    __esModule: true,
    default: props => {
        mockBookingSpecialRequests(props);

        return <div data-tid='booking-special-requests' />;
    },
}));

const mockExtraSpecialRequests = jest.fn();

jest.mock('./components/ExtrasSpecialRequests/ExtrasSpecialRequests', () => ({
    __esModule: true,
    default: props => {
        mockExtraSpecialRequests(props);

        return <div data-tid='extra-special-requests' />;
    },
}));

describe('<SpecialRequests />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            viewBookingStore: {
                booking: mockBooking,
                isViewBookingStatusPage: false,
            },
            layoutStore: {
                isPostBookingPages: false,
            },
        });
    });

    it('Should render ExtrasSpecialRequests if no booking', () => {
        mockStores.viewBookingStore.booking = null;
        render(<SpecialRequests {...props} />);

        expect(screen.queryByTestId('extra-special-requests')).toBeInTheDocument();
        expect(screen.queryByTestId('booking-special-requests')).not.toBeInTheDocument();

        expect(mockExtraSpecialRequests).toHaveBeenCalledWith({
            fields: props.fields,
        });
    });

    it('should render BookingSpecialRequests if there is booking and isPostBookingPages true', () => {
        mockStores.layoutStore.isPostBookingPages = true;
        render(<SpecialRequests {...props} />);

        expect(screen.queryByTestId('extra-special-requests')).not.toBeInTheDocument();
        expect(screen.queryByTestId('booking-special-requests')).toBeInTheDocument();

        expect(mockBookingSpecialRequests).toHaveBeenCalledWith({
            fields: props.fields,
            params: props.params,
            booking: mockStores.viewBookingStore.booking,
            withAmendment: !mockStores.viewBookingStore.booking.isExternalAgency,
        });
    });

    it('Should render BookingSpecialRequests if there is booking and isViewBookingStatusPage true', () => {
        mockStores.viewBookingStore.isViewBookingStatusPage = true;
        render(<SpecialRequests {...props} />);

        expect(screen.queryByTestId('booking-special-requests')).toBeInTheDocument();
    });

    it('should render BookingSpecialRequests if there is booking in bookingStore and isPostBookingPages true', () => {
        mockStores.layoutStore.isPostBookingPages = true;
        mockStores.viewBookingStore.booking = null;
        mockStores.bookingStore.booking = mockBooking;

        render(<SpecialRequests {...props} />);

        expect(screen.queryByTestId('booking-special-requests')).toBeInTheDocument();
    });

    it('should render ExtrasSpecialRequests if isHolidaysStore false and isViewBookingPage false', () => {
        mockStores.layoutStore.isViewBookingPage = false;
        (isHolidayStore as jest.MockedFunction<typeof isHolidayStore>).mockReturnValueOnce(false);

        render(<SpecialRequests {...props} />);

        expect(screen.queryByTestId('extra-special-requests')).toBeInTheDocument();
        expect(mockExtraSpecialRequests).toHaveBeenCalledWith({
            fields: props.fields,
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<SpecialRequests {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
