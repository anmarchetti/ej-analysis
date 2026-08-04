import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import {
    mockFeesPerPersons,
    mockPriceBreakdownFields,
    mockPriceBreakdownItems,
} from 'frontend/components/common/PriceBreakdown/__mocks__/priceBreakdown';

import PriceBreakdownDetails, { IPriceBreakdownDetailsProps } from './PriceBreakdownDetails';

jest.mock('frontend/hooks/useMediaQuery');

const createProps = (): IPriceBreakdownDetailsProps => ({
    fields: mockPriceBreakdownFields,
    totalPrice: 50,
    currency: CurrencyCode.GBP,
    totalCostOfChangeField: { value: 'cost of changes' },
});

let mockProps = createProps();
let mockStores = createMockStores({
    layoutStore: {
        isCancelBookingPage: false,
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockChangeFeeBreakdownProps = jest.fn();
jest.mock('frontend/components/common/PriceBreakdown/components/ChangeFeeBreakdown/ChangeFeeBreakdown', () => ({
    __esModule: true,
    default: props => {
        mockChangeFeeBreakdownProps(props);

        return <div data-tid='change-fee-breakdown' />;
    },
}));

const mockPriceBreakdownItemProps = jest.fn();
jest.mock('frontend/components/common/PriceBreakdown/components/PriceBreakdownItem/PriceBreakdownItem', () => ({
    __esModule: true,
    default: props => {
        mockPriceBreakdownItemProps(props);

        return <div data-tid={`price-breakdown-item-${props.uniqueKey}`}>{props.children}</div>;
    },
}));

describe('PriceBreakdownDetails', () => {
    beforeAll(() => {
        jest.mocked(useMobileViewport).mockReturnValue(false);
    });

    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should return null when there is no data to display', () => {
        mockProps.feeChargePrice = undefined;
        mockProps.holidayCredit = undefined;
        mockProps.previousBalance = undefined;
        mockProps.priceBreakdownItems = undefined;
        mockProps.totalPrice = 0;

        const { container } = render(<PriceBreakdownDetails {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Previous Balance render', () => {
        it('should render correctly Previous Balance when it is provided', () => {
            mockProps.previousBalance = 100;

            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.getByTestId('price-breakdown-item-prev-balance')).toBeInTheDocument();
            expect(mockPriceBreakdownItemProps).toHaveBeenCalledWith({
                breakdownTitle: mockProps.fields.PreviousBalanceLabel!.value,
                amount: mockProps.previousBalance,
                className: 'balanceRow',
                uniqueKey: 'prev-balance',
                currency: mockProps.currency,
            });
        });

        it('should NOT render Previous Balance when it is NOT provided', () => {
            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.queryByTestId('price-breakdown-item-prev-balance')).not.toBeInTheDocument();
            expect(mockPriceBreakdownItemProps).not.toHaveBeenCalledWith(
                expect.objectContaining({ uniqueKey: 'prev-balance' }),
            );
        });

        it('should render correctly Previous Balance when field is not provided', () => {
            mockProps.previousBalance = 100;
            mockProps.fields.PreviousBalanceLabel = undefined;

            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.getByTestId('price-breakdown-item-prev-balance')).toBeInTheDocument();
            expect(mockPriceBreakdownItemProps).toHaveBeenCalledWith({
                breakdownTitle: '',
                amount: mockProps.previousBalance,
                className: 'balanceRow',
                uniqueKey: 'prev-balance',
                currency: mockProps.currency,
            });
        });
    });

    describe('Price Breakdown items render', () => {
        it('should render correctly Price Breakdown items when it is provided', () => {
            mockProps.priceBreakdownItems = mockPriceBreakdownItems;
            render(<PriceBreakdownDetails {...mockProps} />);

            mockProps.priceBreakdownItems.map((item, index) => {
                expect(screen.getByTestId(`price-breakdown-item-item-${index}`)).toBeInTheDocument();
                expect(mockPriceBreakdownItemProps).toHaveBeenCalledWith({
                    breakdownTitle: item.breakdownTitle,
                    amount: item.amount,
                    className: undefined,
                    uniqueKey: `item-${index}`,
                    tooltipText: item.tooltipText,
                    currency: mockProps.currency,
                });
            });
        });

        it('should NOT render Price Breakdown items when it is NOT provided', () => {
            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.queryByTestId('price-breakdown-item-item-0')).not.toBeInTheDocument();
        });
    });

    describe('Fee Charge Price render', () => {
        it('should render correctly Fee Charge Price when it is provided', () => {
            mockProps.feeChargePrice = 20;
            mockProps.feesPerPersons = mockFeesPerPersons;

            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.getByTestId('price-breakdown-item-fee')).toBeInTheDocument();
            expect(mockPriceBreakdownItemProps).toHaveBeenCalledWith({
                breakdownTitle: mockProps.fields.ChangeFeeTitle!.value,
                amount: mockProps.feeChargePrice,
                uniqueKey: 'fee',
                children: expect.anything(),
                currency: mockProps.currency,
            });
            expect(screen.getAllByTestId('change-fee-breakdown')).toHaveLength(2);
            expect(mockChangeFeeBreakdownProps).toHaveBeenCalledWith(
                expect.objectContaining({ feesCount: 1, feesPerPersonAmount: 10 }),
            );
            expect(mockChangeFeeBreakdownProps).toHaveBeenCalledWith(
                expect.objectContaining({ feesCount: 2, feesPerPersonAmount: 5 }),
            );
        });

        it('should NOT render Fee Charge Price when it is NOT provided', () => {
            mockProps.feeChargePrice = undefined;
            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.queryByTestId('price-breakdown-item-fee')).not.toBeInTheDocument();

            expect(screen.queryByTestId('change-fee-breakdown')).not.toBeInTheDocument();
            expect(mockChangeFeeBreakdownProps).not.toHaveBeenCalled();
        });

        it('should render correctly Fee Charge Price when field is not provided', () => {
            mockProps.feeChargePrice = 20;
            mockProps.feesPerPersons = mockFeesPerPersons;
            mockProps.fields.ChangeFeeTitle = undefined;

            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.getByTestId('price-breakdown-item-fee')).toBeInTheDocument();
            expect(mockPriceBreakdownItemProps).toHaveBeenCalledWith({
                breakdownTitle: '',
                amount: mockProps.feeChargePrice,
                uniqueKey: 'fee',
                children: expect.anything(),
                currency: mockProps.currency,
            });
            expect(screen.getAllByTestId('change-fee-breakdown')).toHaveLength(2);
            expect(mockChangeFeeBreakdownProps).toHaveBeenCalledWith(
                expect.objectContaining({ feesCount: 1, feesPerPersonAmount: 10 }),
            );
            expect(mockChangeFeeBreakdownProps).toHaveBeenCalledWith(
                expect.objectContaining({ feesCount: 2, feesPerPersonAmount: 5 }),
            );
        });
    });

    describe('Holiday Credit render', () => {
        it('should render Holiday Credit row correctly when it is provided', () => {
            mockProps.holidayCredit = 10;

            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.getByTestId('price-breakdown-item-holiday-credit')).toBeInTheDocument();
            expect(mockPriceBreakdownItemProps).toHaveBeenCalledWith({
                breakdownTitle: mockProps.fields.HolidayCredit?.value,
                amount: -mockProps.holidayCredit,
                className: 'creditRow',
                uniqueKey: 'holiday-credit',
                currency: mockProps.currency,
            });
        });

        it('should NOT render Holiday Credit when it is NOT provided', () => {
            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.queryByTestId('price-breakdown-item-holiday-credit')).not.toBeInTheDocument();
            expect(mockPriceBreakdownItemProps).not.toHaveBeenCalledWith(
                expect.objectContaining({ uniqueKey: 'holiday-credit' }),
            );
        });
    });

    describe('Total Price render', () => {
        it('should render correctly Total Price when it is provided', () => {
            mockProps.totalPrice = 20;

            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.getByTestId('price-breakdown-item-total')).toBeInTheDocument();
            expect(mockPriceBreakdownItemProps).toHaveBeenCalledWith({
                breakdownTitle: mockProps.totalCostOfChangeField?.value,
                amount: mockProps.totalPrice,
                className: 'totalRow',
                uniqueKey: 'total',
                currency: mockProps.currency,
            });
        });

        it('should NOT render Total Price when it is NOT provided', () => {
            mockProps.totalPrice = undefined as any;
            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.queryByTestId('price-breakdown-item-total')).not.toBeInTheDocument();
            expect(mockPriceBreakdownItemProps).not.toHaveBeenCalled();
        });

        it('should render correctly Total Price when total price field prop is not provided', () => {
            mockProps.totalPrice = 20;
            mockProps.totalCostOfChangeField = undefined;

            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.getByTestId('price-breakdown-item-total')).toBeInTheDocument();
            expect(mockPriceBreakdownItemProps).toHaveBeenCalledWith({
                breakdownTitle: '',
                amount: mockProps.totalPrice,
                className: 'totalRow',
                uniqueKey: 'total',
                currency: mockProps.currency,
            });
        });

        it('should NOT render total amount payable row when there is no price change', () => {
            mockProps.totalPrice = 0;
            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.queryByTestId('price-breakdown-details-total')).not.toBeInTheDocument();
        });

        describe('Cancel page', () => {
            beforeEach(() => {
                mockStores.layoutStore.isCancelBookingPage = true;
            });

            it('should NOT render total amount payable row when totalAmount is undefined', () => {
                mockProps.totalPrice = undefined;
                render(<PriceBreakdownDetails {...mockProps} />);

                expect(screen.queryByTestId('price-breakdown-details-total')).not.toBeInTheDocument();
            });

            it('should render total amount on cancel page when totalPrice is 0', () => {
                mockProps.totalPrice = 0;

                render(<PriceBreakdownDetails {...mockProps} />);

                expect(screen.getByTestId('price-breakdown-item-total')).toBeInTheDocument();
                expect(mockPriceBreakdownItemProps).toHaveBeenCalledWith({
                    breakdownTitle: mockProps.totalCostOfChangeField?.value,
                    amount: mockProps.totalPrice,
                    className: 'totalRow',
                    uniqueKey: 'total',
                    currency: mockProps.currency,
                });
            });
        });
    });

    describe('Tourist Tax Summary node', () => {
        it('should render touristTaxSummaryNode when provided', () => {
            mockProps.totalPrice = 50;
            mockProps.touristTaxSummaryNode = <div aria-label='tourist-tax-summary-node' />;

            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.getByRole('generic', { name: 'tourist-tax-summary-node' })).toBeInTheDocument();
        });

        it('should NOT render touristTaxSummaryNode section when not provided', () => {
            mockProps.totalPrice = 50;
            mockProps.touristTaxSummaryNode = undefined;

            render(<PriceBreakdownDetails {...mockProps} />);

            expect(screen.queryByRole('generic', { name: 'tourist-tax-summary-node' })).not.toBeInTheDocument();
        });
    });
});
