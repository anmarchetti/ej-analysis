import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { BookingPrivacy } from './BookingPrivacy';

const resetMocks = () => ({
    fields: {
        Title: 'Title',
        Description: 'Description',
        Icon: 'icon',
        CheckboxLabelRight: 'right',
        CheckboxLabelLeft: 'left',
        DebounceTimeout: 1,
    } as any,
    params: {} as any,
    rendering: {} as any,
});
const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
    viewBookingStore: {
        changeErrorMessage: jest.fn(),
        isBookingCanceled: false,
        booking: {
            package: {
                accom: {
                    hotel: {
                        name: '',
                        country: {
                            name: 'countryName',
                        },
                        location: {
                            name: '',
                        },
                        region: {
                            name: '',
                        },
                    },
                    rooms: [],
                },
                transport: {
                    routes: [
                        {
                            extRefId: 'flightReference',
                            depDate: 'departureDate',
                        },
                    ],
                },
                location: {
                    region: '',
                },
            },
            guests: [],
            bookingReference: 'test',
            isLoggedInAsLeadPassenger: true,
        } as any,
    },
    trackingStore: {
        fireViewBookingEvent: jest.fn(),
    },
});

let mockStores = createStores();
let mocks = resetMocks();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Checkbox', () => ({ onChange }) => <div onClick={onChange}>Checkbox</div>);

describe('<BookingPrivacy />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should render null if fields are not provided', () => {
        mocks.fields = undefined as any;

        const { container } = render(<BookingPrivacy {...mocks} />);

        expect(container.firstChild).toBeNull();
    });

    it('should render null if not logged in as lead passenger', () => {
        mockStores.viewBookingStore.booking.isLoggedInAsLeadPassenger = false;

        const { container } = render(<BookingPrivacy {...mocks} />);

        expect(container.firstChild).toBeNull();
    });

    it('should render null if booking is canceled', () => {
        mockStores.viewBookingStore.isBookingCanceled = true;

        const { container } = render(<BookingPrivacy {...mocks} />);

        expect(container.firstChild).toBeNull();
    });

    it('should fire tracking event', () => {
        const { getByText } = render(<BookingPrivacy {...mocks} />);
        fireEvent.click(getByText('Checkbox'));

        expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalled();
    });
});
