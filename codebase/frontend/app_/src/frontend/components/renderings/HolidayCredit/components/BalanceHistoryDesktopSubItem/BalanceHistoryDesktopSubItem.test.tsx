import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import * as dateUtils from 'frontend/utils/date.utils';

import BalanceHistoryDesktopSubItem, { TBalanceHistoryDesktopSubItemProps } from './BalanceHistoryDesktopSubItem';

const createProps = (overrides?: Partial<TBalanceHistoryDesktopSubItemProps>): TBalanceHistoryDesktopSubItemProps => ({
    amount: 100,
    balanceAmount: 200,
    creditLabel: 'Holiday Credit',
    currency: 'GBP' as CurrencyCode,
    date: '2024-12-31',
    redemptionOrigin: 'Redemption origin text',
    isAmountMoreThanZero: true,
    ...overrides,
});

const createStores = () => createMockStores();

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockCreditItemInfo = jest.fn();
jest.mock('frontend/components/renderings/HolidayCredit/components/CreditItemInfo/CreditItemInfo', () => ({
    __esModule: true,
    default: props => {
        mockCreditItemInfo(props);

        return <div data-tid='credit-item-info'>CreditItemInfo</div>;
    },
}));

const mockFormattedMoney = jest.fn();
jest.mock('frontend/components/common/FormattedMoney/FormattedMoney', () => ({
    __esModule: true,
    default: props => {
        mockFormattedMoney(props);

        return <span data-tid='formatted-money'>{props.amount}</span>;
    },
    MIN_FRACTION_DIGITS: 2,
}));

jest.mock('frontend/utils/date.utils', () => ({
    formatDateL10n: jest.fn(date => `Formatted: ${date}`),
    parseDateL10n: jest.fn(date => new Date(date)),
}));

describe('<BalanceHistoryDesktopSubItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render the desktop subitem container', () => {
        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-subitem')).toBeInTheDocument();
    });

    it('should render CreditItemInfo with correct props', () => {
        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith({
            showLogo: false,
            creditTypeName: 'Holiday Credit',
            description: 'Redemption origin text',
            dataTid: 'balance-history-subitem',
        });
    });

    it('should render formatted date', () => {
        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(screen.getByTestId('price-change-warning-date')).toBeInTheDocument();
        expect(screen.getByText('Formatted: 2024-12-31')).toBeInTheDocument();
        expect(dateUtils.formatDateL10n).toHaveBeenCalledWith('2024-12-31', 'DD MMM YYYY');
    });

    it('should render transaction amount with + sign when amount is positive', () => {
        mockProps = createProps({ amount: 100, isAmountMoreThanZero: true });

        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(screen.getByTestId('price-change-warning-transaction-amount')).toBeInTheDocument();
        expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('should render transaction amount with - sign when amount is negative', () => {
        mockProps = createProps({ amount: -50, isAmountMoreThanZero: false });

        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(screen.getByTestId('price-change-warning-transaction-amount')).toBeInTheDocument();
        expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render absolute value of transaction amount', () => {
        mockProps = createProps({ amount: -75, isAmountMoreThanZero: false });

        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 75,
                options: { currency: 'GBP', minimumFractionDigits: 2 },
            }),
        );
    });

    it('should not render transaction amount when amount is 0', () => {
        mockProps = createProps({ amount: 0, isAmountMoreThanZero: false });

        const { container } = render(<BalanceHistoryDesktopSubItem {...mockProps} />);
        const transactionContainer = container.querySelector('[data-tid="price-change-warning-transaction-amount"]');

        expect(transactionContainer).toBeInTheDocument();
        expect(transactionContainer?.textContent).toBe('');
    });

    it('should render balance amount correctly', () => {
        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-subitem-total-amount')).toBeInTheDocument();
        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 200,
                options: { currency: 'GBP', minimumFractionDigits: 2 },
            }),
        );
    });

    it('should render absolute value of balance amount', () => {
        mockProps = createProps({ balanceAmount: -150, isAmountMoreThanZero: false });

        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 150,
            }),
        );
    });

    it('should apply refund style when amount is positive', () => {
        mockProps = createProps({ amount: 100, isAmountMoreThanZero: true });

        const { container } = render(<BalanceHistoryDesktopSubItem {...mockProps} />);
        const transactionAmount = container.querySelector('.refund');

        expect(transactionAmount).toBeInTheDocument();
    });

    it('should apply purchase style when amount is negative', () => {
        mockProps = createProps({ amount: -50, isAmountMoreThanZero: false });

        const { container } = render(<BalanceHistoryDesktopSubItem {...mockProps} />);
        const transactionAmount = container.querySelector('.purchase');

        expect(transactionAmount).toBeInTheDocument();
    });

    it('should render multiple FormattedMoney components correctly', () => {
        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        // First call for transaction amount
        expect(mockFormattedMoney).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                amount: 100,
            }),
        );

        // Second call for balance amount
        expect(mockFormattedMoney).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                amount: 200,
            }),
        );
    });

    it('should handle undefined currency', () => {
        mockProps = createProps({ currency: undefined });

        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                options: { currency: undefined, minimumFractionDigits: 2 },
            }),
        );
    });

    it('should handle empty creditLabel', () => {
        mockProps = createProps({ creditLabel: '' });

        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                creditTypeName: '',
            }),
        );
    });

    it('should handle empty redemptionOrigin', () => {
        mockProps = createProps({ redemptionOrigin: '' });

        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                description: '',
            }),
        );
    });

    it('should render with different currency codes', () => {
        mockProps = createProps({ currency: 'EUR' as CurrencyCode });

        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                options: { currency: 'EUR', minimumFractionDigits: 2 },
            }),
        );
    });

    it('should handle zero balance amount', () => {
        mockProps = createProps({ balanceAmount: 0 });

        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 0,
            }),
        );
    });

    it('should handle large amounts', () => {
        mockProps = createProps({ amount: 10000, balanceAmount: 25000 });

        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                amount: 10000,
            }),
        );

        expect(mockFormattedMoney).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                amount: 25000,
            }),
        );
    });

    it('should not show logo in CreditItemInfo', () => {
        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                showLogo: false,
            }),
        );
    });

    it('should handle different date formats', () => {
        mockProps = createProps({ date: '2023-06-15T10:30:00Z' });

        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(dateUtils.formatDateL10n).toHaveBeenCalledWith('2023-06-15T10:30:00Z', 'DD MMM YYYY');
    });

    it('should not apply refund or purchase style when amount is 0', () => {
        mockProps = createProps({ amount: 0, isAmountMoreThanZero: false });

        const { container } = render(<BalanceHistoryDesktopSubItem {...mockProps} />);
        const transactionAmount = container.querySelector('[data-tid="price-change-warning-transaction-amount"]');

        // When amount is 0, isAmountMoreThanZero is false, so purchase style should be applied
        expect(transactionAmount).toHaveClass('purchase');
    });

    it('should handle very small positive amounts', () => {
        mockProps = createProps({ amount: 0.01, isAmountMoreThanZero: true });

        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(screen.getByText('+')).toBeInTheDocument();
        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 0.01,
            }),
        );
    });

    it('should handle very small negative amounts', () => {
        mockProps = createProps({ amount: -0.01, isAmountMoreThanZero: false });

        render(<BalanceHistoryDesktopSubItem {...mockProps} />);

        expect(screen.getByText('-')).toBeInTheDocument();
        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 0.01,
            }),
        );
    });
});
