import React from 'react';
import { render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { dataTid, PriceChanged } from './PriceChanged';

const createProps = () => ({
    priceIncreasedMessage: 'payment increase',
    priceDecreasedMessage: 'payment decrease',
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
    bookingStore: {
        totalPrice: 100,
        previousPrice: 200,
        applyingPromoCode: false,
    },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PriceChanged />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should standard render', () => {
        const { queryByTestId } = render(<PriceChanged {...mockProps} />);

        expect(queryByTestId(dataTid)).toBeInTheDocument();
    });

    it('Should render decrease label when previousPrice greater than totalPrice by one', () => {
        mockProps.priceDecreasedMessage = null;
        const { queryByText } = render(<PriceChanged {...mockProps} />);

        expect(queryByText(SitecoreDictionary.GlobalsTitlesUpdatedPriceDescriptionDecrease)).toBeInTheDocument();
    });

    it('Should render increase label when totalPrice greater than previousPrice by one', () => {
        mockProps.priceIncreasedMessage = null;
        mockStores.bookingStore.totalPrice = 200;
        mockStores.bookingStore.previousPrice = 100;
        const { queryByText } = render(<PriceChanged {...mockProps} />);

        expect(queryByText(SitecoreDictionary.GlobalsTitlesUpdatedPriceDescriptionIncrease)).toBeInTheDocument();
    });

    it('Should render increase label for payment page when previousPrice lower than totalPrice and it is payment page', () => {
        mockStores.bookingStore.totalPrice = 200;
        mockStores.bookingStore.previousPrice = 100;
        const { queryByText } = render(<PriceChanged {...mockProps} />);

        expect(queryByText('payment increase')).toBeInTheDocument();
    });

    it('Should render decrease label for payment page when previousPrice greater than totalPrice and it is payment page', () => {
        const { queryByText } = render(<PriceChanged {...mockProps} />);

        expect(queryByText('payment decrease')).toBeInTheDocument();
    });

    it('Should NOT render when actualPrice is 0', () => {
        mockStores.bookingStore.totalPrice = 0;
        const { container } = render(<PriceChanged {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render when previousPrice is 0', () => {
        mockStores.bookingStore.previousPrice = 0;
        const { container } = render(<PriceChanged {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render when promocode was applied', () => {
        mockStores.bookingStore.applyingPromoCode = true;
        const { container } = render(<PriceChanged {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render when delta is less than 1', () => {
        mockStores.bookingStore.totalPrice = 10;
        mockStores.bookingStore.previousPrice = 10;
        const { container } = render(<PriceChanged {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
