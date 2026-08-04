import React from 'react';
import { render, screen } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { mockTouristTaxEmptyFields, mockTouristTaxFields } from 'frontend/__mocks__/touristTax';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { BasketPriceCell, IBasketPriceCellProps } from './BasketPriceCell';

jest.mock('frontend/utils/touristTax.utils', () => ({
    ...jest.requireActual('frontend/utils/touristTax.utils'),
    getTouristTaxFieldsFromOffer: jest.fn(),
    getTouristTaxPrice: jest.fn(value => value),
}));
const mockedGetTouristTaxFieldsFromOffer = getTouristTaxFieldsFromOffer as jest.Mock;

const mockBasketPriceCellPriceComponent = jest.fn();
jest.mock('./BasketPriceCellPrice/BasketPriceCellPrice', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockBasketPriceCellPriceComponent(props);

        return <div data-tid='basket-price-cell-price' />;
    },
}));

const mockTouristTaxPriceTooltipComponent = jest.fn();
jest.mock('frontend/components/common/TouristTaxPriceTooltip/TouristTaxPriceTooltip', () => ({
    __esModule: true,
    TouristTaxPriceTooltip: ({ children, ...props }) => {
        mockTouristTaxPriceTooltipComponent(props);

        return <div data-tid='tourist-tax-price-tooltip'>{children}</div>;
    },
}));

const mockTouristTaxPriceLabelComponent = jest.fn();
jest.mock('frontend/components/common/TouristTaxPriceLabel/TouristTaxPriceLabel', () => ({
    __esModule: true,
    TouristTaxPriceLabel: ({ ...props }) => {
        mockTouristTaxPriceLabelComponent(props);

        return <div data-tid='tourist-tax-price-label' />;
    },
}));

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
        totalPriceForExtras: 10,
        totalPricePPForExtras: 5,
        totalPricePP: 10,
        totalPrice: 20,
        addExtrasToPrice: jest.fn(price => price),
    },
});

let mocks;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const resetMocks = (): IBasketPriceCellProps => ({
    offer: {} as IOfferWithoutAltBoards,
    className: '',
    isNextButtonVisible: true,
    isABTestingComponent: true,
    isPricePPShown: true,
});

describe('<BasketPriceCell />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
        mockedGetTouristTaxFieldsFromOffer.mockReturnValue(mockTouristTaxFields);
    });

    it('should render with all components', () => {
        const { container } = render(<BasketPriceCell {...mocks} />);

        expect(container.querySelector('.basket__price-pills')).toBeInTheDocument();
        expect(container.querySelector('.basket__price-pills')).toBeEmptyDOMElement();
        expect(container.querySelector('.basket__price')).toBeInTheDocument();
    });

    it('should render without BasketPriceCellOffers when isPricePPShown is false', () => {
        mocks.isPricePPShown = false;
        const { container } = render(<BasketPriceCell {...mocks} />);

        expect(container.querySelector('.basket__price-pills')).toBeEmptyDOMElement();
        expect(container.querySelector('.basket__price')).toBeInTheDocument();
    });

    it('should render ppPriceDictionary when isExtraPage or isGuestDetailsPage or isScreenExtraSmall and isPricePPShown are true', () => {
        mockStores.layoutStore.isExtraPage = true;
        mockStores.layoutStore.isGuestDetailsPage = true;
        mockStores.appStore.isScreenExtraSmall = true;

        const { container } = render(<BasketPriceCell {...mocks} />);

        expect(container.querySelector('.basket__price-pp')).toHaveTextContent(
            `${SitecoreDictionary.GlobalsPriceLabelsPerPerson}`,
        );
    });

    it('should render ppPriceDictionary when isScreenExtraSmall', () => {
        mockStores.appStore.isScreenExtraSmall = true;

        const { container } = render(<BasketPriceCell {...mocks} />);

        expect(container.querySelector('.basket__price')).toHaveTextContent(
            `${SitecoreDictionary.GlobalsPriceLabelsTotalFrom}`,
        );
    });

    it('should render ppPriceFormDictionary when isExtraPage or isGuestDetailsPage or isScreenExtraSmall are false and isPricePPShown is true', () => {
        const { container } = render(<BasketPriceCell {...mocks} />);

        expect(container.querySelector('.basket__price-pp')).toHaveTextContent(
            `${SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom}`,
        );
    });

    it('render total price when isHotelDetailsBookPage is true', () => {
        mockStores.layoutStore.isHotelDetailsBookPage = true;
        render(<BasketPriceCell {...mocks} />);

        expect(mockBasketPriceCellPriceComponent).toHaveBeenNthCalledWith(1, {
            amount: 10,
            integerPart: 10,
            fractionPart: 0,
            prevIntegerPart: 10,
            prevFractionPart: 0,
        });
        expect(mockBasketPriceCellPriceComponent).toHaveBeenNthCalledWith(2, {
            amount: 5,
            integerPart: 5,
            fractionPart: 0,
            prevIntegerPart: 5,
            prevFractionPart: 0,
        });
    });

    describe('<TouristTaxPriceTooltip />', () => {
        it('should render tourist tax dictionary when isHotelDetailsBookPage is false and touristTax is not equal to 0', () => {
            jest.spyOn(Tokenizer, 'replaceToken');

            const { container } = render(<BasketPriceCell {...mocks} />);

            expect(getTouristTaxFieldsFromOffer).toHaveBeenCalledWith(mocks.offer);
            expect(container.querySelector('.basket__price')).toBeInTheDocument();
            expect(screen.getByTestId('tourist-tax-price-tooltip')).toHaveTextContent(
                SitecoreDictionary.TouristTaxLabelsIncludesLocalTax,
            );
            expect(Tokenizer.replaceToken).toHaveBeenCalledWith(
                SitecoreDictionary.TouristTaxLabelsIncludesLocalTax,
                Tokens.Price,
                `${mockTouristTaxFields.touristTax}`,
            );
        });

        it('should render tourist tax price label when isHotelDetailsBookPage is true', () => {
            mockStores.layoutStore.isHotelDetailsBookPage = true;

            const { container } = render(<BasketPriceCell {...mocks} />);

            expect(getTouristTaxFieldsFromOffer).toHaveBeenCalledWith(mocks.offer);
            expect(container.querySelector('.basket__price')).toBeInTheDocument();
            expect(screen.getByTestId('tourist-tax-price-tooltip')).toBeInTheDocument();
            expect(mockTouristTaxPriceTooltipComponent).toHaveBeenCalledWith({
                touristTax: mockTouristTaxFields.touristTax,
                taxesAndFees: mockTouristTaxFields.taxesAndFees,
            });
            expect(screen.getByTestId('tourist-tax-price-label')).toBeInTheDocument();
            expect(mockTouristTaxPriceLabelComponent).toHaveBeenCalledWith({
                isPricePP: false,
                touristTax: mockTouristTaxFields.touristTax,
                touristTaxPP: mockTouristTaxFields.touristTaxPP,
                price: mockStores.bookingStore.totalPriceWithTouristTax,
                pricePP: mockStores.bookingStore.totalPricePPWithTouristTax,
            });
        });

        it('should render tourist tax price label when isExtrasPage is true', () => {
            mockStores.layoutStore.isExtrasPage = true;

            const { container } = render(<BasketPriceCell {...mocks} />);

            expect(getTouristTaxFieldsFromOffer).toHaveBeenCalledWith(mocks.offer);
            expect(container.querySelector('.basket__price')).toBeInTheDocument();
            expect(screen.getByTestId('tourist-tax-price-tooltip')).toBeInTheDocument();
            expect(mockTouristTaxPriceTooltipComponent).toHaveBeenCalledWith({
                touristTax: mockTouristTaxFields.touristTax,
                taxesAndFees: mockTouristTaxFields.taxesAndFees,
            });
            expect(screen.getByTestId('tourist-tax-price-label')).toBeInTheDocument();
            expect(mockTouristTaxPriceLabelComponent).toHaveBeenCalledWith({
                isPricePP: false,
                touristTax: mockTouristTaxFields.touristTax,
                touristTaxPP: mockTouristTaxFields.touristTaxPP,
                price: mockStores.bookingStore.totalPriceWithTouristTax,
                pricePP: mockStores.bookingStore.totalPricePPWithTouristTax,
            });
        });

        it('should render tourist tax price label when isGuestDetailsPage is true', () => {
            mockStores.layoutStore.isGuestDetailsPage = true;

            const { container } = render(<BasketPriceCell {...mocks} />);

            expect(getTouristTaxFieldsFromOffer).toHaveBeenCalledWith(mocks.offer);
            expect(container.querySelector('.basket__price')).toBeInTheDocument();
            expect(screen.getByTestId('tourist-tax-price-tooltip')).toBeInTheDocument();
            expect(mockTouristTaxPriceTooltipComponent).toHaveBeenCalledWith({
                touristTax: mockTouristTaxFields.touristTax,
                taxesAndFees: mockTouristTaxFields.taxesAndFees,
            });
            expect(screen.getByTestId('tourist-tax-price-label')).toBeInTheDocument();
            expect(mockTouristTaxPriceLabelComponent).toHaveBeenCalledWith({
                isPricePP: false,
                touristTax: mockTouristTaxFields.touristTax,
                touristTaxPP: mockTouristTaxFields.touristTaxPP,
                price: mockStores.bookingStore.totalPriceWithTouristTax,
                pricePP: mockStores.bookingStore.totalPricePPWithTouristTax,
            });
        });

        it('should render tourist tax price label when isHotelDetailsBookPage is false and touristTax is equal to 0', () => {
            mockStores.layoutStore.isHotelDetailsBookPage = false;
            mockedGetTouristTaxFieldsFromOffer.mockReturnValue(mockTouristTaxEmptyFields);

            const { container } = render(<BasketPriceCell {...mocks} />);

            expect(getTouristTaxFieldsFromOffer).toHaveBeenCalledWith(mocks.offer);
            expect(container.querySelector('.basket__price')).toBeInTheDocument();
            expect(screen.getByTestId('tourist-tax-price-tooltip')).toBeInTheDocument();
            expect(mockTouristTaxPriceTooltipComponent).toHaveBeenCalledWith({
                touristTax: mockTouristTaxEmptyFields.touristTax,
                taxesAndFees: mockTouristTaxEmptyFields.taxesAndFees,
            });
            expect(screen.getByTestId('tourist-tax-price-label')).toBeInTheDocument();
            expect(mockTouristTaxPriceLabelComponent).toHaveBeenCalledWith({
                isPricePP: false,
                touristTax: mockTouristTaxEmptyFields.touristTax,
                touristTaxPP: mockTouristTaxEmptyFields.touristTaxPP,
                price: mockStores.bookingStore.totalPriceWithTouristTax,
                pricePP: mockStores.bookingStore.totalPricePPWithTouristTax,
            });
        });
    });
});
