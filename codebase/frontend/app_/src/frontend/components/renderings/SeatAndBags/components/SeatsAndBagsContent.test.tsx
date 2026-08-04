import React from 'react';
import { render } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';

import SeatsAndBagsContent from './SeatsAndBagsContent';

const createStores = () => ({
    appStore: {
        isScreenLessMedium: false,
    },
    layoutStore: {
        isEditMode: false,
        getPhrase: jest.fn(),
    },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
    seatMapStore: { currency: CurrencyCode.GBP },
});
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SeatsAndBagsContent />', () => {
    const resetMocks = () => ({
        fields: {
            OutboundTitle: {},
            Children: [],
            ReturnTitle: {},
            OutboundIcon: {},
            ReturnIcon: {},
            ReadLess: 'ReadLess',
            ReadMore: 'ReadMore',
        } as any,
        passengers: [],
        isScreenMedium: false,
        footer: null,
        isInbound: false,
        isPriceHidden: false,
    });
    let mocks = resetMocks();

    beforeEach(() => {
        jest.resetAllMocks();
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should not render component when no passenger passed', () => {
        mocks.passengers = [];
        const { container } = render(<SeatsAndBagsContent {...mocks} />);

        expect(container.firstChild).toBeNull();
    });

    it('should render component when passenger passed', () => {
        mocks.passengers = [
            {
                outboundPassenger: {
                    passengerId: '',
                },
                inboundPassenger: {
                    passengerId: '',
                },
            },
        ] as any;
        const { container } = render(<SeatsAndBagsContent {...mocks} />);

        expect(container.firstChild).not.toBeNull();
    });

    it('should render desktop component', () => {
        mocks.isScreenMedium = true;
        mocks.passengers = [
            {
                outboundPassenger: {
                    passengerId: '',
                },
                inboundPassenger: {
                    passengerId: '',
                },
            },
        ] as any;
        const { container } = render(<SeatsAndBagsContent {...mocks} />);

        expect(container.querySelector('.seats-and-bags__desktop')).toBeInTheDocument();
    });
});
