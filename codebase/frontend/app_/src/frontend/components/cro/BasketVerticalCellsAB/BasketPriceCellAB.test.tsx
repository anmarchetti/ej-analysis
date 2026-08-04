import React from 'react';
import { render, screen } from '@testing-library/react';

import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import BasketPriceCellAB, { IBasketPriceCellProps } from './BasketPriceCellAB';

const createStores = () => ({
    offer: {} as IOfferWithoutAltBoards,
    layoutStore: {
        getPhrase: jest.fn(p => p),
        isPillVisible: jest.fn(() => true),
        isExtrasPage: false,
        isHotelDetailsBookPage: false,
        isGuestDetailsPage: false,
    },
    appStore: {
        isScreenExtraSmall: false,
    },
    bookingStore: {
        totalPriceForExtras: 5,
        totalPricePPForExtras: 0,
        totalPricePP: 0,
        totalPrice: 10,
    },
});

const createProps = (): IBasketPriceCellProps => ({
    offer: {} as IOfferWithoutAltBoards,
    className: '',
    isNextButtonVisible: true,
    isABTestingComponent: true,
    isPricePPShown: true,
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockBasketPriceCellPriceComponent = jest.fn();
jest.mock('frontend/components/renderings/Basket/components/BasketPriceCellPrice/BasketPriceCellPrice', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockBasketPriceCellPriceComponent(props);

        return <div data-tid='basket-price-cell-price' />;
    },
}));

describe('<BasketPriceCellAB />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render standard', () => {
        render(<BasketPriceCellAB {...mockProps} />);
    });

    it('should render with all components', () => {
        render(<BasketPriceCellAB {...mockProps} />);

        expect(screen.getByTestId('basket-price-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('basket-price')).toBeInTheDocument();
        expect(screen.getByTestId('basket-pp-price')).toBeInTheDocument();
    });

    it('should render ppPriceDictionary when isNextButtonVisible is false ', () => {
        mockProps.isNextButtonVisible = false;

        render(<BasketPriceCellAB {...mockProps} />);

        expect(screen.getByTestId('basket-pp-price')).toHaveTextContent(
            `${SitecoreDictionary.GlobalsPriceLabelsPerPersonSubtextAB}`,
        );
    });

    it('should render ppPriceDictionary when isNextButtonVisible is true ', () => {
        render(<BasketPriceCellAB {...mockProps} />);

        expect(screen.getByTestId('basket-pp-price')).toHaveTextContent(
            `${SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom}`,
        );
    });

    it('render total price when isHotelDetailsBookPage is true', () => {
        mockStores.layoutStore.isHotelDetailsBookPage = true;
        render(<BasketPriceCellAB {...mockProps} />);

        expect(mockBasketPriceCellPriceComponent).toHaveBeenCalledWith({
            amount: 0,
            integerPart: 0,
            fractionPart: 0,
            prevIntegerPart: 0,
            prevFractionPart: 0,
        });
    });
});
