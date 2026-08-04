import React from 'react';
import { render } from '@testing-library/react';

import { SeatType } from 'models/enum/SeatType';

import SeatSelectionDesktop from './SeatSelectionDesktop';

const createStores = () => ({
    layoutStore: { isTradePortal: false, isPricesHidden: false },
    marketStore: { formatMoney: jest.fn(a => `+£${a}`) },
    seatMapStore: { currency: 'GBP' },
});
const createProps = () => ({
    text: SeatType.ExtraLegroom,
    color: 'green',
    seatNumber: '1A' as string | null,
    price: '29.99' as string | null,
    isPricesHidden: false,
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SeatSelectionDesktop />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render component with price on Holidays site', () => {
        const { getByText, container } = render(<SeatSelectionDesktop {...mockProps} />);

        expect(getByText('1A')).toBeInTheDocument();
        expect(getByText(SeatType.ExtraLegroom)).toBeInTheDocument();
        expect(getByText('+£29.99')).toBeInTheDocument();
        expect(container.querySelector('.seat-confirmation__seat-number--border-color-green')).toBeInTheDocument();
    });

    it('Should not render text when it is not provided', () => {
        delete mockProps.text;

        const { container } = render(<SeatSelectionDesktop {...mockProps} />);

        expect(container.querySelector('.seat-confirmation__place')).not.toBeInTheDocument();
    });

    it('Should not render seat number when it is not provided', () => {
        delete mockProps.seatNumber;

        const { container } = render(<SeatSelectionDesktop {...mockProps} />);

        expect(container.querySelector('.seat-confirmation__seat-number')).not.toBeInTheDocument();
    });

    it('Should not render price when price is not provided', () => {
        delete mockProps.price;

        const { queryByTestId } = render(<SeatSelectionDesktop {...mockProps} />);

        expect(queryByTestId('seat-price')).not.toBeInTheDocument();
    });

    describe('isPricesHidden', () => {
        it('Should not render price when isPricesHidden = true', () => {
            const { queryByTestId } = render(<SeatSelectionDesktop {...mockProps} isPricesHidden />);

            expect(queryByTestId('seat-price')).not.toBeInTheDocument();
        });

        it('Should render price when isPricesHidden = false ', () => {
            const { queryByText } = render(<SeatSelectionDesktop {...mockProps} />);

            expect(queryByText('+£29.99')).toBeInTheDocument();
        });
    });
});
