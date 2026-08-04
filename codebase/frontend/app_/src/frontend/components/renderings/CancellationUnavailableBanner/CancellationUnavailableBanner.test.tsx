import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import { CancellationUnavailableBanner, TCancellationUnavailableBannerProps } from './CancellationUnavailableBanner';

const mockExpandableBanner = jest.fn();
jest.mock('frontend/components/common/ExpandableBanner/ExpandableBanner', () => ({
    __esModule: true,
    default: ({ button, ...props }) => {
        mockExpandableBanner({ button, ...props });

        return <div data-tid='expandable-banner'>{button}</div>;
    },
}));

const mockPlaceholder = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholder(props);

        return <div data-tid='placeholder' />;
    },
}));

const createContext = () =>
    createMockStores({
        userStore: {
            isLoggedIn: true,
        },
        viewBookingStore: {
            booking: {
                ...mockBooking,
                isExternalAgency: false,
                isLoggedInAsLeadPassenger: false,
                setRedirectUrl: jest.fn(),
            },
        },
    });

const createProps = (): TCancellationUnavailableBannerProps => ({
    fields: {
        Description: mockSitecoreField(
            `Log in using the email address you booked with to see more details. You'll be able to download your travel documents and manage your booking from here.`,
        ),
        Icon: { value: mockSitecoreImageField('/holidays/cms/media/') },
        Title: mockSitecoreField('Lead customer? Log in to manage your holiday'),
    },
    params: {},
    rendering: {},
});

let mockProps = createProps();
let mockContext = createContext();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockContext,
}));

describe('<CancellationUnavailableBanner />', () => {
    beforeEach(() => {
        mockContext = createContext();
        mockProps = createProps();
        mockExpandableBanner.mockClear();
        mockPlaceholder.mockClear();
    });

    it('should NOT render component when no fields', () => {
        delete mockProps.fields;

        const { container } = render(<CancellationUnavailableBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when no booking', () => {
        mockContext.viewBookingStore.booking = null;

        const { container } = render(<CancellationUnavailableBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when cancellation is NOT blocked', () => {
        mockContext.viewBookingStore.booking.cancellationIsBlocked = false;

        const { container } = render(<CancellationUnavailableBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when booking is from external agency', () => {
        mockContext.viewBookingStore.booking.cancellationIsBlocked = true;
        mockContext.viewBookingStore.booking.isExternalAgency = true;

        const { container } = render(<CancellationUnavailableBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render ExpandableBanner when cancellation is blocked', () => {
        mockContext.viewBookingStore.booking.cancellationIsBlocked = true;

        render(<CancellationUnavailableBanner {...mockProps} />);

        expect(screen.getByTestId('expandable-banner')).toBeInTheDocument();
        expect(mockExpandableBanner).toHaveBeenCalledWith(
            expect.objectContaining({
                Title: mockProps.fields!.Title,
                Description: mockProps.fields!.Description,
                Icon: mockProps.fields!.Icon,
                dataTidPrefix: 'cancellation-unavailable-banner',
            }),
        );
    });

    it('should pass isOutlined={false} to the Placeholder when cancellation is blocked', () => {
        mockContext.viewBookingStore.booking.cancellationIsBlocked = true;

        render(<CancellationUnavailableBanner {...mockProps} />);

        expect(mockPlaceholder).toHaveBeenCalledWith(
            expect.objectContaining({
                isOutlined: false,
            }),
        );
    });
});
