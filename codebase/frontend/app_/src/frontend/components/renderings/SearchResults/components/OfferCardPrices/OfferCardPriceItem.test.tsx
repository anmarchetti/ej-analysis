import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { mockTouristTaxFields } from 'frontend/__mocks__/touristTax';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IOfferCardPriceItemProps, OfferCardPriceItem } from './OfferCardPriceItem';

const mockOfferCardPriceWithDiscount = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/OfferCardPrices/OfferCardPriceWithDiscount', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardPriceWithDiscount(props);

        return <div data-tid='offer-card-price-with-discount' />;
    },
}));

const mockTooltipContentComponent = jest.fn();
jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: () => <div />,
    TooltipContent: ({ text }) => {
        mockTooltipContentComponent(text);

        return <div />;
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
    layoutStore: { getPhrase: jest.fn(p => p), areStrikethroughPricesEnabled: false },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
});

const createProps = (): IOfferCardPriceItemProps => ({
    price: 110,
    priceDictionary: undefined,
    currency: CurrencyCode.GBP,
    priceExcludingTouristTax: 100,
    pricePP: 55,
    pricePPExcludingTouristTax: 50,
    isPricePP: false,
    ...mockTouristTaxFields,
});

let mockProps: IOfferCardPriceItemProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<OfferCardPriceItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render only price value', () => {
        mockProps.priceDictionary = undefined;

        const { container } = render(<OfferCardPriceItem {...mockProps} />);

        expect(screen.getByText('£100')).toBeInTheDocument();
        expect(container.querySelector('.price-big__from-label')).not.toBeInTheDocument();
        expect(container.querySelector('.price-big__subtext')).not.toBeInTheDocument();
        expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
        expect(screen.queryByTestId('offer-card-price-with-discount')).not.toBeInTheDocument();
        expect(container.getElementsByClassName('priceWithEnabledDiscountWrapper')).toHaveLength(0);
    });

    it('Should render priceWithEnabledDiscountWrapper when areStrikethroughPricesEnabled', () => {
        mockStores.layoutStore.areStrikethroughPricesEnabled = true;

        const { container } = render(<OfferCardPriceItem {...mockProps} />);

        expect(container.getElementsByClassName('priceWithEnabledDiscountWrapper')).toHaveLength(1);
    });

    it('Should render price and labels', () => {
        mockStores.layoutStore.getPhrase.mockReturnValueOnce('from {price} pp');
        mockProps.priceDictionary = SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom;
        render(<OfferCardPriceItem {...mockProps} />);

        expect(screen.getByText('from')).toHaveClass('price-big__from-label');
        expect(screen.getByText('£100')).toBeInTheDocument();
        expect(screen.getByText('pp')).toHaveClass('price-big__subtext');
        expect(screen.getByTestId('price-with-label-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('from-label')).toBeInTheDocument();
        expect(screen.getByTestId('price-wrapper')).toBeInTheDocument();
    });

    it('should render tooltip', () => {
        mockProps.tooltipMessage = 'tooltip message';
        render(<OfferCardPriceItem {...mockProps} />);

        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(mockTooltipContentComponent).toHaveBeenCalledWith('tooltip message');
    });

    it('should render custom class', () => {
        mockProps.className = 'custom-class';
        const { container } = render(<OfferCardPriceItem {...mockProps} />);

        expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should render OfferCardPriceWithDiscount when discount is provided', () => {
        mockProps.discount = 100;

        render(<OfferCardPriceItem {...mockProps} />);

        expect(screen.getByTestId('offer-card-price-with-discount')).toBeInTheDocument();
        expect(mockOfferCardPriceWithDiscount).toHaveBeenCalledWith({
            isPricePP: mockProps.isPricePP,
            priceExcludingTouristTax: mockProps.priceExcludingTouristTax,
            pricePPExcludingTouristTax: mockProps.pricePPExcludingTouristTax,
            pricePP: mockProps.pricePP,
            currency: 'GBP',
            labelAfterPrice: undefined,
            labelBeforePrice: '',
            price: mockProps.price,
            priceBeforeDiscount: mockProps.priceExcludingTouristTax + mockProps.discount,
            tooltipMessage: undefined,
            touristTax: mockProps.touristTax,
            touristTaxPP: mockProps.touristTaxPP,
            taxesAndFees: mockProps.taxesAndFees,
        });
    });

    it('should render tourist tax', () => {
        mockProps.taxTooltipTriggerClassName = 'triggerClassName';
        render(<OfferCardPriceItem {...mockProps} />);

        expect(mockTouristTaxPriceTooltipComponent).toHaveBeenCalledWith({
            touristTax: mockProps.touristTax,
            triggerClassName: mockProps.taxTooltipTriggerClassName,
            taxesAndFees: mockProps.taxesAndFees,
        });

        expect(mockTouristTaxPriceLabelComponent).toHaveBeenCalledWith({
            price: mockProps.price,
            pricePP: mockProps.pricePP,
            touristTax: mockProps.touristTax,
            touristTaxPP: mockProps.touristTaxPP,
            isPricePP: mockProps.isPricePP,
        });
    });
});
