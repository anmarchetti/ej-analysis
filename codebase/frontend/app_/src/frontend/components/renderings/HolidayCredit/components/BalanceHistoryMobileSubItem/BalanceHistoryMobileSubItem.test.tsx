import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import * as mediaQueryHooks from 'frontend/hooks/useMediaQuery';
import * as dateUtils from 'frontend/utils/date.utils';
import { mockBalanceHistoryFields } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistoryFields.mocks';

import BalanceHistoryMobileSubItem, { TBalanceHistoryMobileSubItemProps } from './BalanceHistoryMobileSubItem';

const createProps = (overrides?: Partial<TBalanceHistoryMobileSubItemProps>): TBalanceHistoryMobileSubItemProps => ({
    amount: 100,
    balanceAmount: 200,
    creditLabel: 'Holiday Credit',
    currency: 'GBP' as CurrencyCode,
    date: '2024-12-31',
    fields: mockBalanceHistoryFields,
    isAmountMoreThanZero: true,
    redemptionOrigin: 'Redemption origin text',
    ...overrides,
});

const createStores = () => createMockStores();

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <span data-tid='text'>{props.field?.value}</span>;
    },
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
}));

describe('<BalanceHistoryMobileSubItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        jest.spyOn(mediaQueryHooks, 'useMoreThenMobileViewport').mockReturnValue(true);
    });

    it('should render the mobile subitem container', () => {
        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-mobile-subitem')).toBeInTheDocument();
    });

    it('should render CreditItemInfo with correct props', () => {
        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith({
            showLogo: false,
            creditTypeName: 'Holiday Credit',
            description: 'Redemption origin text',
            dataTid: 'balance-history-mobile-subitem',
        });
    });

    it('should render balance amount correctly', () => {
        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-mobile-subitem-total-amount')).toBeInTheDocument();
        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 200,
                options: { currency: 'GBP', minimumFractionDigits: 2 },
            }),
        );
    });

    it('should render absolute value of balance amount', () => {
        mockProps = createProps({ balanceAmount: -150 });

        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 150,
            }),
        );
    });

    it('should render RemainingAmountLabel', () => {
        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockBalanceHistoryFields.RemainingAmountLabel,
            component: 'span',
        });
    });

    it('should render transaction amount with + sign when amount is positive', () => {
        mockProps = createProps({ amount: 100, isAmountMoreThanZero: true });

        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-mobile-subitem-transaction-amount')).toBeInTheDocument();
        expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('should render transaction amount with - sign when amount is negative', () => {
        mockProps = createProps({ amount: -50, isAmountMoreThanZero: false });

        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-mobile-subitem-transaction-amount')).toBeInTheDocument();
        expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render absolute value of transaction amount', () => {
        mockProps = createProps({ amount: -75, isAmountMoreThanZero: false });

        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 75,
                options: { currency: 'GBP', minimumFractionDigits: 2 },
            }),
        );
    });

    it('should render formatted date', () => {
        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-mobile-subitem-date')).toBeInTheDocument();
        expect(screen.getByText('Formatted: 2024-12-31')).toBeInTheDocument();
        expect(dateUtils.formatDateL10n).toHaveBeenCalledWith('2024-12-31', 'DD MMM YYYY');
    });

    it('should render BalanceChangeOnLabel when viewport is more than mobile', () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenMobileViewport').mockReturnValue(true);

        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockBalanceHistoryFields.BalanceChangeOnLabel,
            component: 'span',
        });
    });

    it('should not render BalanceChangeOnLabel when viewport is mobile', () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenMobileViewport').mockReturnValue(false);
        mockTextProps.mockClear();

        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        const balanceChangeOnLabelCalls = mockTextProps.mock.calls.filter(
            call => call[0].field === mockBalanceHistoryFields.BalanceChangeOnLabel,
        );
        expect(balanceChangeOnLabelCalls.length).toBe(0);
    });

    it('should not render transaction amount section when amount is 0', () => {
        mockProps = createProps({ amount: 0 });

        const { container } = render(<BalanceHistoryMobileSubItem {...mockProps} />);
        const transactionContainer = container.querySelector(
            '[data-tid="balance-history-mobile-subitem-transaction-amount"]',
        );

        expect(transactionContainer).toBeInTheDocument();
        expect(transactionContainer?.textContent).toBe('');
    });

    it('should not render date when amount is 0', () => {
        mockProps = createProps({ amount: 0 });

        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(screen.queryByTestId('balance-history-mobile-subitem-date')).not.toBeInTheDocument();
    });

    it('should apply refund style when amount is positive', () => {
        mockProps = createProps({ amount: 100, isAmountMoreThanZero: true });

        const { container } = render(<BalanceHistoryMobileSubItem {...mockProps} />);
        const transactionAmount = container.querySelector('.refund');

        expect(transactionAmount).toBeInTheDocument();
    });

    it('should apply purchase style when amount is negative', () => {
        mockProps = createProps({ amount: -50, isAmountMoreThanZero: false });

        const { container } = render(<BalanceHistoryMobileSubItem {...mockProps} />);
        const transactionAmount = container.querySelector('.purchase');

        expect(transactionAmount).toBeInTheDocument();
    });

    it('should handle undefined currency', () => {
        mockProps = createProps({ currency: undefined });

        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                options: { currency: undefined, minimumFractionDigits: 2 },
            }),
        );
    });

    it('should render multiple FormattedMoney components correctly', () => {
        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        // First call for balance amount
        expect(mockFormattedMoney).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                amount: 200,
            }),
        );

        // Second call for transaction amount
        expect(mockFormattedMoney).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                amount: 100,
            }),
        );
    });

    it('should pass all required props to CreditItemInfo', () => {
        mockProps = createProps({
            creditLabel: 'Gift Card',
            redemptionOrigin: 'Online purchase',
        });

        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith({
            showLogo: false,
            creditTypeName: 'Gift Card',
            description: 'Online purchase',
            dataTid: 'balance-history-mobile-subitem',
        });
    });

    it('should handle empty creditLabel', () => {
        mockProps = createProps({ creditLabel: '' });

        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                creditTypeName: '',
            }),
        );
    });

    it('should handle empty redemptionOrigin', () => {
        mockProps = createProps({ redemptionOrigin: '' });

        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                description: '',
            }),
        );
    });

    it('should render with different currency codes', () => {
        mockProps = createProps({ currency: 'EUR' as CurrencyCode });

        render(<BalanceHistoryMobileSubItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                options: { currency: 'EUR', minimumFractionDigits: 2 },
            }),
        );
    });
});
