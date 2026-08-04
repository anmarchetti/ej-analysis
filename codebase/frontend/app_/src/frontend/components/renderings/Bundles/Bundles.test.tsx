import React from 'react';
import { render, screen } from '@testing-library/react';

import Bundles from './Bundles';

const BUTTON_TEXT = 'Continue';
const PROMO_CODE = 'EUCO';
const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(() => BUTTON_TEXT),
    },
    searchStore: {
        validateSearchParameters: jest.fn(),
    },
    bookingStore: {
        isGuestsParametersValid: false,
        updateRoomsAllocationFromSearchStore: jest.fn(),
        packageInfo: {
            Prom: PROMO_CODE,
        },
    },
});

const createProps = () => ({
    fields: {
        items: [
            {
                promoCode: PROMO_CODE,
                bundles: [
                    {
                        name: 'Standard',
                        bundleElements: [{ identifier: 'Standard Seat', icon: { identifier: 'Seat' } }],
                        description: 'A Standard Bundle',
                        icon: { identifier: 'Basic' },
                    },
                ],
            },
        ],
    },
    params: {},
    rendering: {},
});
let mockStores = createStores();
let mockProps = createProps();
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ ...mockStores }),
}));

describe('<Bundles />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('should render a button with the defined text', () => {
        render(<Bundles {...mockProps} />);

        expect(screen.getByText(BUTTON_TEXT)).toBeInTheDocument();
    });
});
