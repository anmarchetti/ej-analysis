import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockTouristTaxFields } from 'frontend/__mocks__/touristTax';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { mockIframeOffer } from 'frontend/components/renderings/iframe/IframeHolidaysCarousel/__mocks__/iframe.mocks';

import { HolidayPrice } from './HolidayPrice';

jest.mock('react-dom');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: ({ children }) => <div data-tid='tooltip-trigger'>{children}</div>,
    TooltipContent: ({ children }) => <div data-tid='tooltip-content'>{children}</div>,
}));

let mockGetPricePill;
let mockIsPricePPShown;
let mockGetTotalDiscountPPExcludingInfants;
let mockGetTotalDiscount;
jest.mock('frontend/utils/offer.utils', () => ({
    getPricePill: () => mockGetPricePill,
    isPricePPShown: () => mockIsPricePPShown,
    getTotalDiscountPPExcludingInfants: () => mockGetTotalDiscountPPExcludingInfants,
    getTotalDiscount: () => mockGetTotalDiscount,
}));

jest.mock('frontend/utils/touristTax.utils', () => ({
    ...jest.requireActual('frontend/utils/touristTax.utils'),
    getTouristTaxFieldsFromOffer: jest.fn(),
}));
const mockedGetTouristTaxFieldsFromOffer = getTouristTaxFieldsFromOffer as jest.Mock;

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

const createProps = () => ({
    offer: { ...mockIframeOffer, priceExcludingTouristTax: 1000, pricePPExcludingTouristTax: 500 },
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), tooltipSettings: {} },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
});

let mockProps;
let mockStores;

describe('<HolidayPrice />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockIsPricePPShown = true;
        mockGetPricePill = 'price tooltip';
        mockGetTotalDiscountPPExcludingInfants = 0;
        mockGetTotalDiscount = 0;
        mockedGetTouristTaxFieldsFromOffer.mockReturnValue(mockTouristTaxFields);
    });

    it('should render price pp when isPricePPShown is true', () => {
        render(<HolidayPrice {...mockProps} />);

        expect(screen.getByTestId('price-pp')).toHaveTextContent('£500');
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
    });

    it('should render total price when isPricePPShown is false', () => {
        mockIsPricePPShown = false;
        render(<HolidayPrice {...mockProps} />);

        expect(screen.queryByTestId('price-pp')).not.toBeInTheDocument();
        expect(screen.getByTestId('total-price')).toHaveTextContent('£1000');
        expect(screen.getByTestId('tooltip-content')).toHaveTextContent(mockGetPricePill);
    });

    it('should not render tooltip', () => {
        mockGetPricePill = '';

        const { container } = render(<HolidayPrice {...mockProps} />);

        expect(container.querySelector('.visually-hidden')).not.toBeInTheDocument();
    });

    describe('Tourist Tax', () => {
        it('should render tourist tax with price pp when isPricePPShown is true', () => {
            render(<HolidayPrice {...mockProps} />);

            expect(getTouristTaxFieldsFromOffer).toHaveBeenCalledWith(mockProps.offer);
            expect(mockTouristTaxPriceTooltipComponent).toHaveBeenCalledWith({
                touristTax: mockTouristTaxFields.touristTax,
                taxesAndFees: mockTouristTaxFields.taxesAndFees,
                triggerClassName: 'tooltipTrigger',
            });

            expect(mockTouristTaxPriceLabelComponent).toHaveBeenCalledWith({
                price: mockProps.offer.price,
                pricePP: mockProps.offer.pricePP,
                touristTax: mockTouristTaxFields.touristTax,
                touristTaxPP: mockTouristTaxFields.touristTaxPP,
                isPricePP: true,
            });
        });

        it('should render tourist tax label with total price when isPricePPShown is false', () => {
            mockIsPricePPShown = false;
            render(<HolidayPrice {...mockProps} />);

            expect(mockTouristTaxPriceLabelComponent).toHaveBeenCalledWith({
                price: mockProps.offer.price,
                pricePP: mockProps.offer.pricePP,
                touristTax: mockTouristTaxFields.touristTax,
                touristTaxPP: mockTouristTaxFields.touristTaxPP,
                isPricePP: false,
            });
        });
    });

    it('should render pre-discount price pp when isPricePPShown is true', () => {
        mockGetTotalDiscountPPExcludingInfants = 50;
        mockIsPricePPShown = true;

        render(<HolidayPrice {...mockProps} />);

        expect(screen.getByTestId('pre-discount-price')).toHaveTextContent('£550');
    });

    it('should render pre-discount total price when isPricePPShown is false', () => {
        mockGetTotalDiscount = 100;
        mockIsPricePPShown = false;

        render(<HolidayPrice {...mockProps} />);

        expect(screen.getByTestId('pre-discount-price')).toHaveTextContent('£1100');
    });
});
