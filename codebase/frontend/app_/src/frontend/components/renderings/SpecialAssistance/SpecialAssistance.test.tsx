import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockBooking, mockGuests } from 'frontend/__mocks__';
import { buildFlightPlusHotelUrl } from 'frontend/utils/url.utils';
import { SitePath } from 'models/enum/SitePath';

import { specialAssistanceFields } from './__mocks__/SpecialAssistanceFields';
import SpecialAssistance, { ISpecialAssistanceProps } from './SpecialAssistance';

const createProps = (): ISpecialAssistanceProps => ({
    fields: specialAssistanceFields,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isSpecialAssistanceEnabled: true,
            isConfirmationPage: false,
            daysBeforeDepartureTravelAssistanceCanBeRequested: 3,
            isAssistedTravelOnlineFormEnabled: true,
            isTradePortal: false,
        },
        viewBookingStore: {
            isViewBookingStatusPage: false,
            booking: mockBooking,
            isAssistedTravelRequestsFailedToLoad: false,
            isPossibleToRequestAssistedTravel: true,
            guestWithAssistedTravelRequest: [
                {
                    passenger: mockGuests[0],
                    passengerName: 'John Doe',
                    requestedAt: '2024-01-01',
                },
                {
                    passenger: mockGuests[1],
                    passengerName: 'Jane Doe',
                    requestedAt: null,
                },
            ],
            isAssistedTravelRequestsLoading: false,
            initializeAssistedTravelRequestsFetch: jest.fn(),
            isFlightAndHotelPackage: false,
        },
        userStore: {
            toggleLoginPopup: jest.fn(),
            setIsRedirectPreventedAfterLogin: jest.fn(),
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links'>{props.field.value}</div>;
    },
}));

const mockSpecialAssistancePopup = jest.fn();
jest.mock('./components/SpecialAssistancePopup/SpecialAssistancePopup', () => ({
    __esModule: true,
    default: props => {
        mockSpecialAssistancePopup(props);

        return (
            <div data-tid='special-assistance-popup'>
                <button onClick={props.onClose} data-tid='close-popup-button' />
            </div>
        );
    },
}));

const mockViewBookingComponentWrapper = jest.fn();
jest.mock('frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper', () => ({
    __esModule: true,
    default: props => {
        mockViewBookingComponentWrapper(props);

        return (
            <div data-tid='view-booking-component-wrapper'>
                {props.children}
                {props.bottomChildren}
                <button onClick={props.onPrimaryButtonClick} data-tid='primary-button' />
                <button onClick={props.onSecondaryButtonClick} data-tid='secondary-button' />
            </div>
        );
    },
}));

const mockInfoBlock = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock', () => ({
    __esModule: true,
    default: props => {
        mockInfoBlock(props);

        return <div data-tid='info-block' />;
    },
}));

const mockCustomerCard = jest.fn();
jest.mock('./components/CustomerCard/CustomerCard', () => ({
    __esModule: true,
    default: props => {
        mockCustomerCard(props);

        return <div data-tid='customer-card' />;
    },
}));

jest.mock('frontend/components/common/LoadingState/LoadingState', () => ({
    __esModule: true,
    default: () => <div data-tid='loading-state' />,
}));

jest.mock('frontend/utils/viewBooking.utils', () => ({
    getDaysBeforeDeparture: jest.fn(() => 30),
}));

describe('<SpecialAssistance />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if no fields', () => {
        mockProps.fields = undefined;
        const { container } = render(<SpecialAssistance {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if isSpecialAssistanceEnabled false', () => {
        mockStores.layoutStore.isSpecialAssistanceEnabled = false;
        const { container } = render(<SpecialAssistance {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if no booking', () => {
        mockStores.viewBookingStore.booking = null;
        const { container } = render(<SpecialAssistance {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component', () => {
        render(<SpecialAssistance {...mockProps} />);

        expect(screen.getByTestId('view-booking-component-wrapper')).toBeInTheDocument();
        expect(mockViewBookingComponentWrapper).toHaveBeenCalledWith({
            Icon: mockProps.fields!.Icon,
            Title: mockProps.fields!.SpecialAssistanceTitle,
            PrimaryButtonText: mockProps.fields!.PrimaryButtonLabel,
            PrimaryButtonScreenReaderText: mockProps.fields!.PrimaryButtonScreenReaderText,
            onPrimaryButtonClick: expect.any(Function),
            SecondaryButtonText: mockProps.fields!.SecondaryButtonLabel,
            SecondaryButtonScreenReaderText: mockProps.fields!.SecondaryButtonScreenReaderText,
            onSecondaryButtonClick: expect.any(Function),
            useMasonryStyle: mockStores.viewBookingStore.isViewBookingStatusPage,
            dataTid: 'special-assistance',
            children: expect.anything(),
            bottomChildren: expect.anything(),
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields!.SpecialAssistanceDescription,
            tag: 'div',
            className: 'description',
            dataId: 'description',
        });
    });

    it('should open popup on secondary button click', async () => {
        render(<SpecialAssistance {...mockProps} />);

        const secondaryButton = screen.getByTestId('secondary-button');
        await userEvent.click(secondaryButton);

        expect(screen.getByTestId('special-assistance-popup')).toBeInTheDocument();
        expect(mockSpecialAssistancePopup).toHaveBeenCalledWith({
            fields: mockProps.fields!.ContactUsPopup.fields,
            onClose: expect.any(Function),
        });
    });

    it('should close popup on close button click', async () => {
        render(<SpecialAssistance {...mockProps} />);

        const secondaryButton = screen.getByTestId('secondary-button');
        await userEvent.click(secondaryButton);

        expect(screen.getByTestId('special-assistance-popup')).toBeInTheDocument();

        const closeButton = screen.getByTestId('close-popup-button');
        await userEvent.click(closeButton);

        expect(screen.queryByTestId('special-assistance-popup')).not.toBeInTheDocument();
    });

    it('should call toggleLoginPopup on primary button click if user is not logged in as lead passenger and it is not a Trade Booking', () => {
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            isLoggedInAsLeadPassenger: false,
        };
        render(<SpecialAssistance {...mockProps} />);

        const primaryButton = screen.getByTestId('primary-button');
        primaryButton.click();

        expect(mockStores.userStore.setIsRedirectPreventedAfterLogin).toHaveBeenCalledWith(true);
        expect(mockStores.userStore.toggleLoginPopup).toHaveBeenCalled();
    });

    it('should call redirectTo on primary button click', () => {
        render(<SpecialAssistance {...mockProps} />);

        const primaryButton = screen.getByTestId('primary-button');
        primaryButton.click();

        expect(mockStores.routerStore.redirectTo).toHaveBeenCalledWith(SitePath.AssistedTravel);
    });

    it('should call redirectTo with flight and hotel URL on primary button click when isFlightAndHotelPackage is true', () => {
        mockStores.viewBookingStore.isFlightAndHotelPackage = true;
        render(<SpecialAssistance {...mockProps} />);

        const primaryButton = screen.getByTestId('primary-button');
        primaryButton.click();

        expect(mockStores.routerStore.redirectTo).toHaveBeenCalledWith(
            buildFlightPlusHotelUrl(SitePath.AssistedTravel),
        );
    });

    it('should NOT render primary button if isPossibleToRequestAssistedTravel is false', () => {
        mockStores.viewBookingStore.isPossibleToRequestAssistedTravel = false;
        render(<SpecialAssistance {...mockProps} />);

        expect(mockViewBookingComponentWrapper).toHaveBeenCalledWith(
            expect.objectContaining({ PrimaryButtonText: undefined }),
        );
    });

    it('should render primary button if isPossibleToRequestAssistedTravel is true but user is NOT logged in as lead passenger', () => {
        mockStores.viewBookingStore.isPossibleToRequestAssistedTravel = true;
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            isLoggedInAsLeadPassenger: false,
        };
        render(<SpecialAssistance {...mockProps} />);

        expect(mockViewBookingComponentWrapper).toHaveBeenCalledWith(
            expect.objectContaining({ PrimaryButtonText: mockProps.fields!.PrimaryButtonLabel }),
        );
    });

    it('should NOT render primary button if isPossibleToRequestAssistedTravel is false and user is NOT logged in as lead passenger', () => {
        mockStores.viewBookingStore.isPossibleToRequestAssistedTravel = false;
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            isLoggedInAsLeadPassenger: false,
        };
        render(<SpecialAssistance {...mockProps} />);

        expect(mockViewBookingComponentWrapper).toHaveBeenCalledWith(
            expect.objectContaining({ PrimaryButtonText: undefined }),
        );
    });

    it('should render info block with error message if assisted travel requests failed to load', () => {
        mockStores.viewBookingStore.isAssistedTravelRequestsFailedToLoad = true;
        render(<SpecialAssistance {...mockProps} />);

        expect(screen.getByTestId('info-block')).toBeInTheDocument();
        expect(mockInfoBlock).toHaveBeenCalledWith({
            title: mockProps.fields!.ErrorTitle,
            text: mockProps.fields!.ErrorDescription,
            className: 'infoBlock',
        });
    });

    it('should render assisted requested on label with correct date', () => {
        mockStores.viewBookingStore.isAssistedTravelRequestsFailedToLoad = false;
        mockStores.viewBookingStore.guestWithAssistedTravelRequest = [
            {
                passenger: {
                    index: 0,
                    type: 'Adult',
                },
                passengerName: 'John Doe',
                requestedAt: '2024-01-01',
            },
        ];
        render(<SpecialAssistance {...mockProps} />);

        expect(screen.getByTestId('customer-card')).toBeInTheDocument();
        expect(mockCustomerCard).toHaveBeenCalledWith({
            customerName: 'John Doe',
            description: 'Assisted requested on 2024-01-01',
        });
    });

    it('should NOT render add assistance button if number of guests with assisted travel request is equal to total number of guests without infants in booking', () => {
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            guests: [
                { index: 0, type: 'Adult' },
                { index: 1, type: 'Adult' },
            ],
        };
        mockStores.viewBookingStore.guestWithAssistedTravelRequest = [
            {
                passenger: { index: 0, type: 'Adult' },
                passengerName: 'John Doe',
                requestedAt: '2024-01-01',
            },
            {
                passenger: { index: 1, type: 'Adult' },
                passengerName: 'Jane Doe',
                requestedAt: '2024-01-02',
            },
        ];
        render(<SpecialAssistance {...mockProps} />);

        expect(mockViewBookingComponentWrapper).toHaveBeenCalledWith(
            expect.objectContaining({ PrimaryButtonText: undefined }),
        );
    });

    it('should render loading state if assisted travel requests are loading', () => {
        mockStores.viewBookingStore.isAssistedTravelRequestsLoading = true;
        render(<SpecialAssistance {...mockProps} />);

        expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });
});
