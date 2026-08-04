import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import SitePath from 'models/enum/SitePath';
import { mockBalanceHistoryItems } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistory.mocks';
import { mockBalanceHistoryFields } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistoryFields.mocks';
import BalanceHistory, { IBalanceHistoryProps } from 'frontend/components/renderings/HolidayCredit/BalanceHistory';

const createProps = (): IBalanceHistoryProps => ({
    activeCurrency: CurrencyCode.GBP,
    fields: mockBalanceHistoryFields,
    params: {},
    rendering: {},
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isGiftCardRedemptionEnabled: true,
        },
        holidayCreditStore: {
            balanceHistory: { GBP: mockBalanceHistoryItems },
            isHistoryLoading: false,
            booking: null,
        },
        redeemVoucherStore: { lastRedeemedVoucherCode: 'voucher' },
        marketStore: { formatMoneyToIntegerAndDecimal: jest.fn(() => ['', '']), currency: CurrencyCode.GBP },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockMoreThenMobileViewport = true;

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenMobileViewport: () => mockMoreThenMobileViewport,
}));

const mockGetRedemptionBookingRef = 'ref';
const mockGetOriginalVoucherCode = 'code';
const mockGetCreditStatus = 'active';

jest.mock('frontend/components/renderings/HolidayCredit/utils', () => ({
    __esModule: true,
    getRedemptionBookingRef: jest.fn(() => mockGetRedemptionBookingRef),
    getOriginalVoucherCode: jest.fn(() => mockGetOriginalVoucherCode),
    getCreditStatus: jest.fn(() => mockGetCreditStatus),
}));

const mockLinkComponent = jest.fn();
jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockLinkComponent(props);

        return <div data-tid={props['data-tid']}>{children}</div>;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='sitecore-jss-text' />;
    },
}));

jest.mock('frontend/components/common/Spinner', () => ({
    ...jest.requireActual('frontend/components/common/Spinner'),
    Spinner: jest.fn(() => <div data-tid='spinner' />),
}));

const mockBalanceHistoryItemProps = jest.fn();
jest.mock('frontend/components/renderings/HolidayCredit/components/BalanceHistoryItem/BalanceHistoryItem', () => ({
    __esModule: true,
    default: props => {
        mockBalanceHistoryItemProps(props);

        return <div data-tid='balance-history-item' onClick={props.onItemClick} />;
    },
}));

const mockBalanceHistoryItemDrawerProps = jest.fn();
jest.mock(
    'frontend/components/renderings/HolidayCredit/components/BalanceHistoryItemDrawer/BalanceHistoryItemDrawer',
    () => ({
        __esModule: true,
        default: props => {
            mockBalanceHistoryItemDrawerProps(props);

            return <div data-tid='balance-history-item-drawer' onClick={props.onCloseDrawer} />;
        },
    }),
);

describe('<BalanceHistory />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockMoreThenMobileViewport = true;
    });

    it('should render Spinner when balance history is loading', () => {
        mockStores.holidayCreditStore.isHistoryLoading = true;
        render(<BalanceHistory {...mockProps} />);

        expect(screen.getByTestId('spinner')).toBeInTheDocument();
        expect(screen.queryByTestId('balance-history-table')).not.toBeInTheDocument();

        expect(mockTextProps).toHaveBeenCalledWith({ field: mockProps.fields!.Title, tag: 'h4', className: 'title' });
    });

    it('should render component when balance history is loaded', () => {
        render(<BalanceHistory {...mockProps} />);

        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
        expect(screen.getByTestId('balance-history-table')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenNthCalledWith(1, {
            field: mockProps.fields!.Title,
            tag: 'h4',
            className: 'title',
        });

        expect(mockTextProps).toHaveBeenNthCalledWith(2, {
            field: mockProps.fields!.StatusColumnTitle,
            tag: 'span',
        });
        expect(mockTextProps).toHaveBeenNthCalledWith(3, {
            field: mockProps.fields!.ExpiryColumnTitle,
            tag: 'span',
        });
        expect(mockTextProps).toHaveBeenNthCalledWith(4, {
            field: mockProps.fields!.CreditTypeColumnTitle,
            tag: 'span',
        });
        expect(mockTextProps).toHaveBeenNthCalledWith(5, {
            field: mockProps.fields!.RemainingColumnTitle,
            tag: 'span',
            className: 'remainingTitle',
        });

        expect(screen.getAllByTestId('balance-history-item')).toHaveLength(mockBalanceHistoryItems.length);
    });

    it('should call BalanceHistoryItem with correct props', () => {
        render(<BalanceHistory {...mockProps} />);

        expect(mockBalanceHistoryItemProps).toHaveBeenCalledWith({
            creditItem: mockBalanceHistoryItems[1],
            isRecentCredit: false,
            fields: mockProps.fields,
            defaultCreditTypeContent: mockProps.fields?.Children[1].fields,
            onItemClick: expect.any(Function),
            withoutBorderTop: true,
        });
    });

    it('should mark credit item as recent when booking reference matches', () => {
        mockStores.holidayCreditStore.booking = { bookingReference: mockGetRedemptionBookingRef };
        render(<BalanceHistory {...mockProps} />);

        expect(mockBalanceHistoryItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isRecentCredit: true,
            }),
        );
    });

    it('should mark credit item as recent when voucher code matches', () => {
        mockStores.redeemVoucherStore.lastRedeemedVoucherCode = mockGetOriginalVoucherCode;
        render(<BalanceHistory {...mockProps} />);

        expect(mockBalanceHistoryItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isRecentCredit: true,
            }),
        );
    });

    it('should pass withoutBorderTop as true for first item', () => {
        render(<BalanceHistory {...mockProps} />);

        expect(mockBalanceHistoryItemProps).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                withoutBorderTop: true,
            }),
        );
    });

    it('should pass withoutBorderTop as false for non-first items', () => {
        render(<BalanceHistory {...mockProps} />);

        expect(mockBalanceHistoryItemProps).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                withoutBorderTop: false,
            }),
        );
    });

    it('should NOT render component when credit history is empty and no redeem voucher', () => {
        mockStores.holidayCreditStore.balanceHistory = { GBP: [] };
        mockStores.layoutStore.isGiftCardRedemptionEnabled = false;
        const { container } = render(<BalanceHistory {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when fields are NOT provided', () => {
        mockProps.fields = undefined;
        const { container } = render(<BalanceHistory {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render drawer component when credit item expand btn is clicked on mobile', async () => {
        mockMoreThenMobileViewport = false;
        render(<BalanceHistory {...mockProps} />);

        const creditItem = screen.getAllByTestId('balance-history-item')[1];

        await userEvent.click(creditItem);
        waitFor(() => {
            expect(screen.getByTestId('balance-history-item-drawer')).toBeInTheDocument();
            expect(mockBalanceHistoryItemDrawerProps).toHaveBeenCalledWith({
                isDrawerExpanded: true,
                creditItem: mockBalanceHistoryItems[1],
                onCloseDrawer: expect.any(Function),
                fields: mockProps.fields,
                defaultCreditTypeContent: mockProps.fields?.Children[1].fields,
            });
        });
    });

    it('should close drawer component when close btn is clicked on mobile', async () => {
        mockMoreThenMobileViewport = false;
        render(<BalanceHistory {...mockProps} />);

        const creditItem = screen.getAllByTestId('balance-history-item')[1];

        await userEvent.click(creditItem);

        const drawer = screen.getByTestId('balance-history-item-drawer');

        await userEvent.click(drawer);

        expect(screen.queryByTestId('balance-history-item-drawer')).not.toBeInTheDocument();
    });

    describe('Redeem Voucher Button', () => {
        it('should render link when redeem voucher is enabled and market currency is active', () => {
            render(<BalanceHistory {...mockProps} />);

            expect(screen.getByTestId('balance-history-redeem-voucher-btn')).toHaveTextContent(
                mockProps.fields!.RedeemVoucherButtonLabel.value,
            );
            expect(mockLinkComponent).toHaveBeenCalledWith({
                href: SitePath.RedeemVoucher,
                'data-tid': 'balance-history-redeem-voucher-btn',
                className: 'linkBtn',
            });
        });

        it('should NOT render link when redeem voucher is disabled', () => {
            mockStores.layoutStore.isGiftCardRedemptionEnabled = false;
            render(<BalanceHistory {...mockProps} />);

            expect(screen.queryByTestId('balance-history-redeem-voucher-btn')).not.toBeInTheDocument();
            expect(mockLinkComponent).not.toHaveBeenCalled();
        });

        it('should NOT render link when market currency is NOT active', () => {
            mockProps.activeCurrency = CurrencyCode.CHF;
            render(<BalanceHistory {...mockProps} />);

            expect(screen.queryByTestId('balance-history-redeem-voucher-btn')).not.toBeInTheDocument();
            expect(mockLinkComponent).not.toHaveBeenCalled();
        });
    });
});
