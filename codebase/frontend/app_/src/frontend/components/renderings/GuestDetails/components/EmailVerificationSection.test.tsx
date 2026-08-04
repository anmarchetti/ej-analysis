import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { GuestType } from 'models/enum/GuestType';
import { GuestInfo } from 'models/GuestInfo';

import EmailVerificationSection from './EmailVerificationSection';

const mockGuestDetailsBlockComponent = jest.fn();
jest.mock('./section/GuestDetailsBlock', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockGuestDetailsBlockComponent(props);

        return <div data-tid='guest-details-block' />;
    },
}));

const createStores = () =>
    createMockStores({
        guestDetailsStore: {
            adults: [] as GuestInfo[],
            children: [] as GuestInfo[],
            infants: [] as GuestInfo[],
            getPrimarySectionText: jest.fn(g => g.type),
            getSecondarySectionText: jest.fn(g => g.type),
        },
    });

const mockProps = { hasSignInPrompt: false };

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<EmailVerificationSection />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('Should render empty component if no guests info found', () => {
        const { container } = render(<EmailVerificationSection {...mockProps} />);

        expect(container.firstChild).toBeEmptyDOMElement();
    });

    it('Should render sections correct', () => {
        mockStores.guestDetailsStore.adults = [
            { type: GuestType.Adult, firstName: 'Adult', isLead: true },
        ] as GuestInfo[];
        mockStores.guestDetailsStore.children = [{ type: GuestType.Child, firstName: 'Child' }] as GuestInfo[];
        mockStores.guestDetailsStore.infants = [{ type: GuestType.Infant, firstName: 'Infant' }] as GuestInfo[];

        render(<EmailVerificationSection {...mockProps} />);

        expect(mockGuestDetailsBlockComponent).toHaveBeenNthCalledWith(1, {
            disabled: false,
            icon: expect.any(Object),
            id: 'guest-details-ADULT-1',
            secondaryText: 'ADULT',
            title: 'ADULT 1',
            isLead: true,
        });
        expect(screen.getAllByTestId('guest-details-block')).toHaveLength(3);
    });
});
