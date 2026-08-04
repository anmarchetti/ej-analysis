import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { GuestType } from 'models/enum/GuestType';
import { GuestInfo } from 'models/GuestInfo';

import GuestDetails, { IGuestDetailsProps } from './GuestDetails';

jest.mock('frontend/components/icons-new/EmailFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='email-icon'>Email Icon</div>,
}));

jest.mock('frontend/components/icons-new/PhoneFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='phone-icon'>Phone Icon</div>,
}));

const createProps = (): IGuestDetailsProps => ({
    guestsDetails: [
        new GuestInfo({ type: GuestType.Adult, age: 18, firstName: 'John', lastName: 'Doe', notBornYet: false }, true),
        new GuestInfo({ type: GuestType.Adult, age: 18, firstName: 'Jane', lastName: 'Doe', notBornYet: false }),
        new GuestInfo({ type: GuestType.Child, age: 5, firstName: 'Child', lastName: 'First', notBornYet: false }),
    ],
    leadPassenger: new GuestInfo(
        { type: GuestType.Adult, age: 18, firstName: 'John', lastName: 'Doe', notBornYet: false },
        true,
    ),
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), getSetting: jest.fn(p => p) },
});

let mockProps = createProps();
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<GuestDetails />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render guest details correctly', () => {
        mockProps.guestsDetails = [
            new GuestInfo(
                { type: GuestType.Adult, age: 18, firstName: 'John', lastName: 'Doe', notBornYet: false },
                true,
            ),
        ];
        render(<GuestDetails {...mockProps} />);

        const guestNameElement = screen.getByTestId('guest-name');
        expect(guestNameElement).toHaveTextContent(mockProps.guestsDetails[0].firstName);
        expect(guestNameElement).toHaveTextContent(mockProps.guestsDetails[0].lastName);
    });

    it('should display lead passenger email and phone when provided', () => {
        mockProps.leadPassenger!.email = 'john.doe@example.com';
        mockProps.leadPassenger!.dialingCode = '+1';
        mockProps.leadPassenger!.phone = '234567890';

        render(<GuestDetails {...mockProps} />);

        expect(screen.getByTestId('lead-guest-email')).toHaveTextContent('john.doe@example.com');
        expect(screen.getByTestId('lead-guest-phone')).toHaveTextContent('+1234567890');
    });

    it('should NOT display lead passenger email or phone when NOT provided', () => {
        render(<GuestDetails {...mockProps} />);

        expect(screen.queryByTestId('lead-guest-email')).toBeNull();
        expect(screen.queryByTestId('lead-guest-phone')).toBeNull();
    });

    it('should NOT render lead passenger details when lead passenger is NOT defined', () => {
        mockProps.leadPassenger = null;

        render(<GuestDetails {...mockProps} />);

        expect(screen.queryByTestId('lead-guest-email')).toBeNull();
        expect(screen.queryByTestId('lead-guest-phone')).toBeNull();
    });
});
