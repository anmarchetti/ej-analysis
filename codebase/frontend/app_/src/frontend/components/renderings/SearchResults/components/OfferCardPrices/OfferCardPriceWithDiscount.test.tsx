import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { mockTouristTaxFields } from 'frontend/__mocks__/touristTax';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IOfferCardPriceWithDiscount, OfferCardPriceWithDiscount } from './OfferCardPriceWithDiscount';

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

const createProps = (): IOfferCardPriceWithDiscount => ({
    labelAfterPrice: 'labelAfterPrice',
    labelBeforePrice: 'labelBeforePrice',
    price: 200,
    priceBeforeDiscount: 300,
    priceExcludingTouristTax: 180,
    pricePP: 100,
    pricePPExcludingTouristTax: 90,
    isPricePP: false,
    currency: CurrencyCode.GBP,
    tooltipMessage: 'tooltipMessage',
    ...mockTouristTaxFields,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: () => <div />,
    TooltipContent: ({ children }) => <div>{children}</div>,
}));

describe('<OfferCardPriceWithDiscount />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            marketStore: { formatMoney: jest.fn((price, {}) => price) },
            layoutStore: { getPhrase: jest.fn(p => p), isOffersPriceViewTotal: false },
        });
    });

    it('should standard render', () => {
        render(<OfferCardPriceWithDiscount {...mockProps} />);

        expect(screen.getByTestId('price-with-discount-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('from-label')).toHaveTextContent(mockProps.labelBeforePrice);
        expect(screen.getByTestId('discount-price')).toHaveTextContent('300');
        expect(screen.getByTestId('label-after-discount-price')).toHaveTextContent(mockProps.labelAfterPrice);
        expect(screen.getByTestId('label-after-current-price')).toHaveTextContent(mockProps.labelAfterPrice);
        expect(screen.getByTestId('price-wrapper')).toBeInTheDocument();
        expect(screen.getAllByText(mockProps.labelAfterPrice)).toHaveLength(2);
        expect(screen.getByTestId('after-discount-price')).toHaveTextContent('180');
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('price-tooltip-message')).toHaveTextContent(mockProps.tooltipMessage);
        expect(screen.getByTestId('discount-tooltip-message')).toHaveTextContent(
            SitecoreDictionary.HolidayCardPromotionPillTooltipsDiscount,
        );
        expect(mockStores.marketStore.formatMoney).toHaveBeenNthCalledWith(1, 300, {
            currency: mockProps.currency,
            maximumFractionDigits: 0,
        });
        expect(mockStores.marketStore.formatMoney).toHaveBeenNthCalledWith(2, 180, {
            currency: mockProps.currency,
            maximumFractionDigits: 0,
        });
    });

    it('should NOT render labelBeforePrice when labelBeforePrice is NOT provided', () => {
        mockProps.labelBeforePrice = '';

        render(<OfferCardPriceWithDiscount {...mockProps} />);

        expect(screen.queryByTestId('label-before-discount-price')).not.toBeInTheDocument();
    });

    it('should NOT render labelAfterPrice when labelAfterPrice is NOT provided', () => {
        mockProps.labelAfterPrice = '';

        render(<OfferCardPriceWithDiscount {...mockProps} />);

        expect(screen.queryByTestId('label-after-discount-price')).not.toBeInTheDocument();
        expect(screen.queryByTestId('label-after-current-price')).not.toBeInTheDocument();
    });

    it('should NOT render tooltip when tooltipMessage and discountTooltip are NOT provided', () => {
        mockProps.tooltipMessage = '';
        mockStores.layoutStore.getPhrase.mockReturnValueOnce('');

        render(<OfferCardPriceWithDiscount {...mockProps} />);

        expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });

    it('should render tooltip with only tooltipMessage when discountTooltip is NOT provided', () => {
        mockStores.layoutStore.getPhrase.mockReturnValueOnce('');

        render(<OfferCardPriceWithDiscount {...mockProps} />);

        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('price-tooltip-message')).toBeInTheDocument();
    });

    it('should render tooltip with only discountTooltip when tooltipMessage is NOT provided', () => {
        mockProps.tooltipMessage = '';

        render(<OfferCardPriceWithDiscount {...mockProps} />);

        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('discount-tooltip-message')).toBeInTheDocument();
    });

    it('should render tourist tax', () => {
        render(<OfferCardPriceWithDiscount {...mockProps} />);

        expect(mockTouristTaxPriceTooltipComponent).toHaveBeenCalledWith({
            touristTax: mockProps.touristTax,
            taxesAndFees: mockProps.taxesAndFees,
        });
        expect(mockTouristTaxPriceLabelComponent).toHaveBeenCalledWith({
            price: mockProps.price,
            pricePP: mockProps.pricePP,
            touristTax: mockProps.touristTax,
            touristTaxPP: mockProps.touristTaxPP,
            isPricePP: !mockStores.layoutStore.isOffersPriceViewTotal,
        });
    });
});
