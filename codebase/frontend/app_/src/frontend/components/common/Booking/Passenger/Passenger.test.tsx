import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { Passenger } from './Passenger';

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
        isConfirmationPage: false,
        isTradePortal: false,
    },
});

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/UserFilled', () => ({
    __esModule: true,
    default: (props: any) => <div data-tid='user-filled-icon' className={props.className} />,
}));

jest.mock('frontend/components/icons-new/UserLined', () => ({
    __esModule: true,
    default: (props: any) => <div data-tid='user-lined-icon' className={props.className} />,
}));

const mockGetFullPassengerName = jest.fn();
const mockGetLeadPassengerAddress = jest.fn();
jest.mock('frontend/utils/passenger.utils', () => ({
    ...jest.requireActual('frontend/utils/passenger.utils'),
    getFullPassengerName: (...args) => mockGetFullPassengerName(...args),
    getLeadPassengerAddress: (...args) => mockGetLeadPassengerAddress(...args),
}));

jest.mock('frontend/components/icons-new/UserFilled', () => ({
    __esModule: true,
    default: (props: any) => <div data-tid='user-filled-icon' className={props.className} />,
}));

jest.mock('frontend/components/icons-new/UserLined', () => ({
    __esModule: true,
    default: (props: any) => <div data-tid='user-lined-icon' className={props.className} />,
}));

describe('<Passenger />', () => {
    const createProps = () =>
        ({
            isLeadLoggedIn: true,
            isExternalAgency: false,
            showLeadEmailOnly: false,
            showFlightLabel: false,
            flightRef: null,
            passenger: {
                age: 0,
                firstName: 'Ann',
                isLead: true,
                lastName: 'Brown',
                notBornYet: false,
                sex: 'SEX_FEMALE',
                title: 'Mrs',
                type: GuestType.Adult,
                index: '1',
            },
            leadPassenger: {
                address: 'Test address',
                address2: 'Test address 2',
                age: 0,
                dateOfBirth: '1995-07-05T00:00:00+03:00',
                email: 'test@test.fr',
                phone: '1234567890',
                postCode: 'd444ff',
                sex: 'SEX_FEMALE',
                townCity: 'Minsk',
                type: 'ADULT',
                dialingCode: '+44',
                countryCode: 'GBR',
                firstName: 'Ann',
                lastName: 'Brown',
                title: 'Mrs',
            },
        } as any);

    let props = createProps();

    beforeEach(() => {
        props = createProps();
        mockStores = createStores();

        mockGetFullPassengerName.mockImplementation(
            passengerData => `${passengerData.title} ${passengerData.firstName} ${passengerData.lastName}`,
        );
    });

    it('should render lead passenger name', () => {
        render(<Passenger {...props} />);

        const expectedName = `${props.passenger.title} ${props.passenger.firstName} ${props.passenger.lastName}`;

        expect(mockGetFullPassengerName).toHaveBeenCalledWith(props.passenger, mockStores.layoutStore.getPhrase);
        expect(screen.getByTestId('lead-name')).toHaveTextContent(expectedName);
    });

    it('should render UserLined icon when leadPassenger is not provided', () => {
        props.leadPassenger = undefined;
        render(<Passenger {...props} />);

        expect(screen.getByTestId('user-lined-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('user-filled-icon')).not.toBeInTheDocument();
    });

    it('should render UserFilled icon when leadPassenger is provided', () => {
        render(<Passenger {...props} />);

        expect(screen.getByTestId('user-filled-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('user-lined-icon')).not.toBeInTheDocument();
    });

    it('should render lead passenger info if lead is logged in and other conditions met', () => {
        props.isLeadLoggedIn = true;
        props.isExternalAgency = false;
        mockStores.layoutStore.isTradePortal = false;
        mockStores.layoutStore.isConfirmationPage = false;

        render(<Passenger {...props} />);

        expect(screen.getByTestId('passenger-info')).toBeInTheDocument();
        expect(screen.getByTestId('lead-label')).toHaveTextContent(
            SitecoreDictionary.BookingPassengersLabelsLeadPassenger,
        );
    });

    it('should NOT render lead passenger info if user is not signed in (and not on confirm/trade)', () => {
        props.isLeadLoggedIn = false;
        mockStores.layoutStore.isConfirmationPage = false;
        mockStores.layoutStore.isTradePortal = false;

        render(<Passenger {...props} />);

        expect(screen.queryByTestId('passenger-info')).not.toBeInTheDocument();
        expect(screen.queryByTestId('lead-label')).not.toBeInTheDocument();
    });

    it('should render lead info on Confirmation Page for not logged in user', () => {
        props.isLeadLoggedIn = false;
        mockStores.layoutStore.isConfirmationPage = true;

        render(<Passenger {...props} />);

        expect(screen.getByTestId('passenger-info')).toBeInTheDocument();
    });

    it('should NOT render lead info for external agency (when not on trade portal)', () => {
        props.isExternalAgency = true;
        mockStores.layoutStore.isTradePortal = false;

        render(<Passenger {...props} />);

        expect(screen.queryByTestId('passenger-info')).not.toBeInTheDocument();
        expect(screen.queryByTestId('lead-label')).not.toBeInTheDocument();
    });

    it('should NOT render lead passenger info if no leadPassenger data', () => {
        props.leadPassenger = undefined;

        render(<Passenger {...props} />);

        expect(screen.queryByTestId('passenger-info')).not.toBeInTheDocument();
    });

    it('should render lead info for external agency if on Trade Portal', () => {
        props.isExternalAgency = true;
        mockStores.layoutStore.isTradePortal = true;

        render(<Passenger {...props} />);

        expect(screen.getByTestId('passenger-info')).toBeInTheDocument();
    });

    describe('FlightLabel', () => {
        beforeEach(() => {
            props.showFlightLabel = true;
        });

        it('should render label with flight ref when showFlightLabel is true and flightRef exists', () => {
            props.flightRef = '123XYZ';

            render(<Passenger {...props} />);

            expect(screen.getByTestId('lead-label')).toHaveTextContent(
                SitecoreDictionary.BookingPassengersLabelsLeadPassenger,
            );
            expect(screen.getByTestId('guest-name')).toHaveClass('withFlightRef');
        });

        it('should render label without flight ref when showFlightLabel is true and flightRef is null/empty', () => {
            props.flightRef = null;

            render(<Passenger {...props} />);

            expect(screen.getByTestId('lead-label')).toHaveTextContent(
                SitecoreDictionary.BookingPassengersLabelsLeadPassengerNoFlightRef,
            );
            expect(screen.getByTestId('guest-name')).toHaveClass('withFlightRef');
        });
    });

    it('should render only lead passenger email if showLeadEmailOnly is true and lead details are shown', () => {
        props.showLeadEmailOnly = true;
        props.isLeadLoggedIn = true;
        props.isExternalAgency = false;

        render(<Passenger {...props} />);

        expect(screen.getByTestId('passenger-info')).toBeInTheDocument();
        const infoItems = screen.getAllByTestId('passenger-info-item');
        expect(infoItems).toHaveLength(1);

        const emailItem = infoItems[0];
        expect(within(emailItem).getByTestId('passenger-info-label')).toHaveTextContent(
            SitecoreDictionary.BookingPassengersLabelsEmail,
        );
        expect(within(emailItem).getByTestId('passenger-info-value')).toHaveTextContent(props.leadPassenger.email);
    });

    it('should render all lead passenger details if showLeadDetails is true and showLeadEmailOnly is false', () => {
        props.showLeadEmailOnly = false;
        props.isLeadLoggedIn = true;
        props.isExternalAgency = false;

        render(<Passenger {...props} />);
        expect(screen.getByTestId('passenger-info')).toBeInTheDocument();
        const infoItems = screen.getAllByTestId('passenger-info-item');

        expect(infoItems.length).toBeGreaterThanOrEqual(3);
        expect(screen.getByText(props.leadPassenger.email)).toBeInTheDocument();
        expect(mockGetLeadPassengerAddress).toHaveBeenCalledWith(props.leadPassenger);
        expect(screen.getByText(props.leadPassenger.townCity)).toBeInTheDocument();
        expect(screen.getByText(props.leadPassenger.postCode.toUpperCase())).toBeInTheDocument();
    });
});
