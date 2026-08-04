import React from 'react';
import { render } from '@testing-library/react';

import { SeatType } from 'models/enum/SeatType';
import { LuggageAllowanceType } from 'frontend/components/cro/BasketAB/components/Flight';

import { SeatSelectionAndLuggageDesktop } from './SeatSelectionAndLuggageDesktop';

jest.mock('./SeatSelectionDesktop', () => ({
    __esModule: true,
    default: ({ text }) => <div data-tid={text}>SeatSelectionDesktop {text}</div>,
}));

const mockSeatProducts = jest.fn();

jest.mock('../SeatProducts/SeatProducts', () => ({
    __esModule: true,
    default: props => {
        mockSeatProducts(props);

        return <div data-tid='seat-products'>SeatProducts </div>;
    },
}));

jest.mock('frontend/components/renderings/SeatAndBags/components/SeatBag', () => ({
    __esModule: true,
    default: ({ text }) => (
        <div className='seat-bag' data-tid={text}>
            SeatBag {text}
        </div>
    ),
}));

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(key => key) },
});
const createProps = () => ({
    fields: {
        FallbackBenefit: {
            fields: {
                Name: {
                    value: 'Fallback benefit name',
                },
            },
        },
    },
    seat: {
        seatNumber: '1A',
        priceBand: SeatType.UpFront,
        products: [
            { id: '123', name: 'Awesome bag', icon: 'awesome-bag-icon' },
            { id: '123', name: 'Awesome bag', icon: 'awesome-bag-icon' },
            { id: '456', name: 'Small bag', icon: 'small-bag-icon' },
            { id: LuggageAllowanceType.LargeOverheadBag, name: 'lcb' },
        ],
    },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('SeatSelectionAndLuggageDesktop', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render selected seat with SeatProducts', () => {
        const { queryByTestId, getByTestId } = render(<SeatSelectionAndLuggageDesktop {...mockProps} />);

        expect(getByTestId(SeatType.UpFront)).toHaveTextContent('SeatSelectionDesktop Up Front');
        expect(getByTestId('seat-products')).toHaveTextContent('SeatProducts');
        expect(mockSeatProducts).toHaveBeenCalledWith({ products: mockProps.seat.products.slice(0, 3) });

        expect(queryByTestId('Globals.Labels.NoSeatSelected')).not.toBeInTheDocument();
        expect(queryByTestId('fallback-bag')).not.toBeInTheDocument();
    });

    it('should render no selected seat with fallback bennefit', () => {
        delete mockProps.seat.seatNumber;
        delete mockProps.seat.products;

        const { container, getByTestId } = render(<SeatSelectionAndLuggageDesktop {...mockProps} />);

        expect(container.querySelectorAll('.seat-bag')).toHaveLength(1);
        expect(getByTestId('Globals.Labels.NoSeatSelected')).toHaveTextContent(
            'SeatSelectionDesktop Globals.Labels.NoSeatSelected',
        );
        expect(getByTestId('Fallback benefit name')).toHaveTextContent('SeatBag Fallback benefit name');
    });

    it('should render nothing if no fields', () => {
        delete mockProps.fields;

        const { container, queryByTestId } = render(<SeatSelectionAndLuggageDesktop {...mockProps} />);

        expect(queryByTestId(SeatType.UpFront)).not.toBeInTheDocument();
        expect(queryByTestId('seat-products')).not.toBeInTheDocument();
        expect(container.querySelectorAll('.seat-bag')).toHaveLength(0);
    });
});
