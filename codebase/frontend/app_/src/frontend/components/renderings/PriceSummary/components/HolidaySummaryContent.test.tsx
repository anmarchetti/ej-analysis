import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { IExtraPriceBreakdown } from 'models/data/IValidPackageInfo';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import HolidaySummaryContent, { IHolidaySummaryContentProps } from './HolidaySummaryContent';

let mockStores;

const createStores = () => ({
    bookingStore: {
        clearActivePromocode: jest.fn(),
        promoCode: { value: 'PROMO' },
        isRemovingPromocode: false,
        packageInfo: {
            paymentInfo: {
                currency: 'USD',
            },
        },
    },
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
    marketStore: {
        formatMoney: jest.fn(amount => `$${amount}`),
    },
});

const createProps = (overrides: Partial<IHolidaySummaryContentProps> = {}): IHolidaySummaryContentProps => ({
    breakdownItem: {
        code: 'TEST',
        name: 'Test Item',
        amount: 100,
        quantity: 1,
        subcategories: [],
    } as IExtraPriceBreakdown,
    idx: 0,
    isLastItem: false,
    isSubcategory: false,
    ...overrides,
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HolidaySummaryContent />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render', () => {
        const props = createProps();
        render(<HolidaySummaryContent {...props} />);
        expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('should format the price correctly', () => {
        const props = createProps();
        render(<HolidaySummaryContent {...props} />);
        expect(screen.getByText('$100')).toBeInTheDocument();
    });

    it('should display the quantity if greater than 1', () => {
        const props = createProps({
            breakdownItem: {
                ...createProps().breakdownItem,
                quantity: 2,
            },
        });
        render(<HolidaySummaryContent {...props} />);
        expect(screen.getByText('2 × $100')).toBeInTheDocument();
    });

    it('should NOT display the quantity when item is greater than 1 and item is SurCharge', () => {
        const props = createProps({
            breakdownItem: {
                ...createProps().breakdownItem,
                quantity: 2,
                code: 'SurCharge Price',
            },
        });
        render(<HolidaySummaryContent {...props} />);
        expect(screen.getByText('$100')).toBeInTheDocument();
    });

    it('should render promocode and remove button when code is Promotions', () => {
        const props = createProps({
            breakdownItem: {
                ...createProps().breakdownItem,
                code: PriceBreakdownCode.Promotions,
            },
        });
        render(<HolidaySummaryContent {...props} />);
        expect(screen.getByText('Test Item: PROMO')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsButtonsRemove)).toBeInTheDocument();
    });

    it('should call clearActivePromocode when remove button is clicked', () => {
        const props = createProps({
            breakdownItem: {
                ...createProps().breakdownItem,
                code: PriceBreakdownCode.Promotions,
            },
        });
        render(<HolidaySummaryContent {...props} />);
        fireEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsRemove));
        expect(mockStores.bookingStore.clearActivePromocode).toHaveBeenCalled();
    });

    it('should render subcategories and toggle expand/collapse state', () => {
        const props = createProps({
            breakdownItem: {
                ...createProps().breakdownItem,
                subcategories: [
                    { code: 'SUB1', name: 'Subcategory 1', amount: 50, quantity: 1 },
                    { code: 'SUB2', name: 'Subcategory 2', amount: -30, quantity: 1 },
                ],
            },
        });
        render(<HolidaySummaryContent {...props} />);
        fireEvent.click(screen.getByTestId('read-more-desktop'));
        expect(screen.getByText('Subcategory 1')).toBeInTheDocument();
        expect(screen.getByText('Subcategory 2')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('read-more-desktop'));
        expect(screen.queryByText('Subcategory 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Subcategory 2')).not.toBeInTheDocument();
    });

    it('should render different classes based on props', () => {
        const props = createProps({
            isSubcategory: true,
            isLastItem: true,
        });
        const { container } = render(<HolidaySummaryContent {...props} />);
        expect(container.firstChild).toHaveClass('subcategory');
        expect(container.firstChild).toHaveClass('subcategoryLast');
    });

    it('should set round up the price', () => {
        const props = createProps({
            breakdownItem: {
                ...createProps().breakdownItem,
                amount: 123.256,
            },
        });
        render(<HolidaySummaryContent {...props} />);
        expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(124, {
            currency: 'USD',
            maximumFractionDigits: 0,
        });
    });

    describe('isHolidayPackageCostHighlighted prop', () => {
        it('should apply packageCostHighlightedWrapper class when isHolidayPackageCostHighlighted is true and idx > 0', () => {
            const props = createProps({
                isHolidayPackageCostHighlighted: true,
                idx: 1,
            });

            render(<HolidaySummaryContent {...props} />);

            expect(screen.getByTestId('breakdown-item')).toHaveClass('packageCostHighlightedWrapper');
        });

        it('should NOT apply packageCostHighlightedWrapper class when idx is 0 even if flag is true', () => {
            const props = createProps({
                isHolidayPackageCostHighlighted: true,
                idx: 0,
            });

            render(<HolidaySummaryContent {...props} />);

            expect(screen.getByTestId('breakdown-item')).not.toHaveClass('packageCostHighlightedWrapper');
        });

        it('should NOT apply packageCostHighlightedWrapper class when isHolidayPackageCostHighlighted is false', () => {
            const props = createProps({
                isHolidayPackageCostHighlighted: false,
                idx: 1,
            });

            render(<HolidaySummaryContent {...props} />);

            expect(screen.getByTestId('breakdown-item')).not.toHaveClass('packageCostHighlightedWrapper');
        });

        it('should NOT apply packageCostHighlightedWrapper class when isHolidayPackageCostHighlighted is undefined', () => {
            const props = createProps({
                isHolidayPackageCostHighlighted: undefined,
                idx: 1,
            });

            render(<HolidaySummaryContent {...props} />);

            expect(screen.getByTestId('breakdown-item')).not.toHaveClass('packageCostHighlightedWrapper');
        });

        it('should apply both subcategory and packageCostHighlightedWrapper classes when both conditions are met', () => {
            const props = createProps({
                isHolidayPackageCostHighlighted: true,
                idx: 1,
                isSubcategory: true,
            });

            render(<HolidaySummaryContent {...props} />);

            expect(screen.getByTestId('breakdown-item')).toHaveClass('subcategory packageCostHighlightedWrapper');
        });
    });
});
