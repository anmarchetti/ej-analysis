import React from 'react';
import { render } from '@testing-library/react';

import { SeatType } from 'models/enum/SeatType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ISeatMapPassengersListProps, SeatMapPassengersList } from './SeatMapPassengersList';

const createProps = (): ISeatMapPassengersListProps => ({
    seats: [
        {
            priceBand: SeatType.UpFront,
            seatNumber: '1A',
            products: [],
            price: 29.99,
        },
        {
            priceBand: SeatType.ExtraLegroom,
            seatNumber: '4B',
            products: [],
            price: 19.99,
        },
    ],
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
});

let mockProps = createProps();
let mockStores = createStores();

const mockRichTextDictionary = jest.fn();

jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockRichTextDictionary(props);

        return <div data-tid='no-seat-selected-dictionary' {...props} />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AncillariesDropdown />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render standard', () => {
        const { getByTestId, queryByTestId, getAllByTestId } = render(<SeatMapPassengersList {...mockProps} />);

        expect(getByTestId('seats-container')).toBeInTheDocument();
        expect(queryByTestId('no-seat-text')).not.toBeInTheDocument();

        const seatsNumber = getAllByTestId('seat-number');

        expect(seatsNumber).toHaveLength(mockProps.seats.length);

        seatsNumber.forEach((seatsNumber, index) => {
            expect(seatsNumber).toHaveTextContent(mockProps.seats[index]!.seatNumber);
        });
    });

    it('should render no seats selected text in case of no seats', async () => {
        mockProps.seats = [];
        const { getByTestId, queryByTestId } = render(<SeatMapPassengersList {...mockProps} />);

        expect(mockRichTextDictionary).toHaveBeenNthCalledWith(1, {
            dictionaryKey: SitecoreDictionary.SeatMapLabelsNoSeatSelectedPlural,
            tag: 'span',
        });
        expect(getByTestId('no-seat-text')).toBeInTheDocument();
        expect(queryByTestId('seats-container')).not.toBeInTheDocument();
    });
});
