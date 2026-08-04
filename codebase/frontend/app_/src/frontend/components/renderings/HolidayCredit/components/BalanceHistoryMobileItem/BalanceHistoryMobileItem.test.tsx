import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import * as mediaQueryHooks from 'frontend/hooks/useMediaQuery';
import * as dateUtils from 'frontend/utils/date.utils';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { mockBalanceHistoryItem } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistory.mocks';
import { mockBalanceHistoryFields } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistoryFields.mocks';
import { BalanceOrderStatuses } from 'frontend/components/renderings/HolidayCredit/components/BalanceHistoryChip/BalanceHistoryChip';
import * as creditUtils from 'frontend/components/renderings/HolidayCredit/utils';

import BalanceHistoryMobileItem, { TBalanceHistoryMobileItemProps } from './BalanceHistoryMobileItem';

const createProps = (overrides?: Partial<TBalanceHistoryMobileItemProps>): TBalanceHistoryMobileItemProps => ({
    creditItem: mockBalanceHistoryItem,
    creditTypeTitle: 'Holiday Credit',
    currency: 'GBP' as CurrencyCode,
    description: 'Test description',
    fields: mockBalanceHistoryFields,
    handleExpand: jest.fn(),
    isDisabled: false,
    isDrawerExpanded: false,
    isItemExpanded: false,
    status: BalanceOrderStatuses.Active,
    LogoImage: mockSitecoreField(mockSitecoreImageField('logo')),
    isInsideDrawer: false,
    isRecentCredit: false,
    withoutBorderTop: false,
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

const mockBalanceHistoryChip = jest.fn();
jest.mock('frontend/components/renderings/HolidayCredit/components/BalanceHistoryChip/BalanceHistoryChip', () => ({
    __esModule: true,
    default: props => {
        mockBalanceHistoryChip(props);

        return <div data-tid='balance-history-chip'>Chip</div>;
    },
    BalanceOrderStatuses: {
        ExpireSoon: 'expireSoon',
        Active: 'active',
        Expired: 'expired',
        Used: 'used',
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

const mockExpirationDate = jest.fn();
jest.mock('frontend/components/renderings/HolidayCredit/components/ExpirationDate/ExpirationDate', () => ({
    __esModule: true,
    default: props => {
        mockExpirationDate(props);

        return <div data-tid='expiration-date'>ExpirationDate</div>;
    },
}));

const mockBalanceHistorySubItem = jest.fn();
jest.mock(
    'frontend/components/renderings/HolidayCredit/components/BalanceHistorySubItem/BalanceHistorySubItem',
    () => ({
        __esModule: true,
        default: props => {
            mockBalanceHistorySubItem(props);

            return <div data-tid='balance-history-subitem'>SubItem</div>;
        },
    }),
);

const mockShowMoreButton = jest.fn();
jest.mock('frontend/components/common/ShowMoreButton', () => ({
    __esModule: true,
    default: props => {
        mockShowMoreButton(props);

        return <button data-tid={props.dataTid}>ShowMoreButton</button>;
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
    addDays: jest.fn((days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);

        return date;
    }),
}));

describe('<BalanceHistoryMobileItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        jest.spyOn(mediaQueryHooks, 'useMoreThenMobileViewport').mockReturnValue(false);
        jest.spyOn(creditUtils, 'getBalanceOnStep').mockReturnValue(1100);
    });

    it('should render the mobile item container', () => {
        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-mobile-item')).toBeInTheDocument();
    });

    it('should render as a button element', () => {
        render(<BalanceHistoryMobileItem {...mockProps} />);

        const container = screen.getByTestId('balance-history-mobile-item');
        expect(container.tagName).toBe('BUTTON');
    });

    it('should call handleExpand when clicked on mobile viewport', () => {
        const handleExpand = jest.fn();
        mockProps = createProps({ handleExpand });
        jest.spyOn(mediaQueryHooks, 'useMoreThenMobileViewport').mockReturnValue(false);

        render(<BalanceHistoryMobileItem {...mockProps} />);

        fireEvent.click(screen.getByTestId('balance-history-mobile-item'));

        expect(handleExpand).toHaveBeenCalledTimes(1);
    });

    it('should not call handleExpand when clicked on tablet+ viewport', () => {
        const handleExpand = jest.fn();
        mockProps = createProps({ handleExpand });
        jest.spyOn(mediaQueryHooks, 'useMoreThenMobileViewport').mockReturnValue(true);

        render(<BalanceHistoryMobileItem {...mockProps} />);

        fireEvent.click(screen.getByTestId('balance-history-mobile-item'));

        expect(handleExpand).not.toHaveBeenCalled();
    });

    it('should render BalanceHistoryChip with correct props', () => {
        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockBalanceHistoryChip).toHaveBeenCalledWith({
            status: BalanceOrderStatuses.Active,
            fields: mockBalanceHistoryFields,
        });
    });

    it('should not render BalanceHistoryChip when status is not provided', () => {
        mockProps = createProps({ status: undefined as any });
        mockBalanceHistoryChip.mockClear();

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockBalanceHistoryChip).not.toHaveBeenCalled();
    });

    it('should render balance with FormattedMoney', () => {
        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-mobile-item-balance')).toBeInTheDocument();
        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 1100,
                options: { currency: 'GBP', minimumFractionDigits: 2 },
            }),
        );
    });

    it('should render absolute value of balance', () => {
        jest.spyOn(creditUtils, 'getBalanceOnStep').mockReturnValue(-500);

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 500,
            }),
        );
    });

    it('should call getBalanceOnStep with creditItem and step 0', () => {
        const getBalanceOnStepSpy = jest.spyOn(creditUtils, 'getBalanceOnStep');

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(getBalanceOnStepSpy).toHaveBeenCalledWith(mockBalanceHistoryItem, 0);
    });

    it('should render ShowMoreButton when not in drawer expanded state', () => {
        mockProps = createProps({ isDrawerExpanded: false });

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-mobile-item-button')).toBeInTheDocument();
    });

    it('should not render ShowMoreButton when in drawer expanded state', () => {
        mockProps = createProps({ isDrawerExpanded: true });

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(screen.queryByTestId('balance-history-mobile-item-button')).not.toBeInTheDocument();
    });

    it('should render ShowMoreButton with expand label when collapsed', () => {
        mockProps = createProps({ isItemExpanded: false });

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockShowMoreButton).toHaveBeenCalledWith(
            expect.objectContaining({
                'aria-label': 'Expand credit history',
                isChevronUp: false,
            }),
        );
    });

    it('should render ShowMoreButton with collapse label when expanded on tablet+', () => {
        mockProps = createProps({ isItemExpanded: true });
        jest.spyOn(mediaQueryHooks, 'useMoreThenMobileViewport').mockReturnValue(true);

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockShowMoreButton).toHaveBeenCalledWith(
            expect.objectContaining({
                'aria-label': 'Collapse credit history',
                isChevronUp: true,
            }),
        );
    });

    it('should render ExpirationDate with correct props', () => {
        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockExpirationDate).toHaveBeenCalledWith({
            expirationDate: mockBalanceHistoryItem.expires,
            fields: mockBalanceHistoryFields,
        });
    });

    it('should render CreditItemInfo with correct props', () => {
        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-mobile-item-logo-and-type')).toBeInTheDocument();
        expect(mockCreditItemInfo).toHaveBeenCalledWith({
            creditTypeName: 'Holiday Credit',
            description: 'Test description',
            dataTid: 'balance-history-mobile-item',
            showLogo: false,
            logo: mockProps.LogoImage,
        });
    });

    it('should render IssuedOnLabel with Text component', () => {
        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockBalanceHistoryFields.IssuedOnLabel,
            component: 'span',
        });
    });

    it('should render formatted created date', () => {
        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(dateUtils.formatDateL10n).toHaveBeenCalledWith(mockBalanceHistoryItem.createdAt, 'DD MMM YYYY');
    });

    it('should not render details when not expanded', () => {
        mockProps = createProps({ isItemExpanded: false, isDrawerExpanded: false });

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockBalanceHistorySubItem).not.toHaveBeenCalled();
    });

    it('should render details when item is expanded', () => {
        mockProps = createProps({ isItemExpanded: true });

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockBalanceHistorySubItem).toHaveBeenCalled();
    });

    it('should render details when drawer is expanded', () => {
        mockProps = createProps({ isDrawerExpanded: true });

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockBalanceHistorySubItem).toHaveBeenCalled();
    });

    it('should render BalanceHistorySubItem for each redemption', () => {
        mockProps = createProps({ isItemExpanded: true });

        render(<BalanceHistoryMobileItem {...mockProps} />);

        // Number of redemptions + 1 for the credit item itself
        const redemptionsCount = mockBalanceHistoryItem.redemptions.length;
        expect(mockBalanceHistorySubItem).toHaveBeenCalledTimes(redemptionsCount + 1);
    });

    it('should render BalanceHistorySubItem for redemptions with correct props', () => {
        mockProps = createProps({ isItemExpanded: true });
        jest.spyOn(creditUtils, 'getBalanceOnStep').mockReturnValue(400);

        render(<BalanceHistoryMobileItem {...mockProps} />);

        const firstRedemption = mockBalanceHistoryItem.redemptions[0];
        expect(mockBalanceHistorySubItem).toHaveBeenCalledWith(
            expect.objectContaining({
                currency: 'GBP',
                metadata: firstRedemption.metadata,
                order: firstRedemption.order,
                balance: 400,
                fields: mockBalanceHistoryFields,
                creditTypeTitle: 'Holiday Credit',
            }),
        );
    });

    it('should render final BalanceHistorySubItem for credit item itself', () => {
        mockProps = createProps({ isItemExpanded: true });

        render(<BalanceHistoryMobileItem {...mockProps} />);

        // Last call should be for the credit item itself
        const lastCall = mockBalanceHistorySubItem.mock.calls[mockBalanceHistorySubItem.mock.calls.length - 1];
        expect(lastCall[0]).toEqual(
            expect.objectContaining({
                currency: 'GBP',
                metadata: mockBalanceHistoryItem.metadata,
                order: mockBalanceHistoryItem.order,
                fields: mockBalanceHistoryFields,
                creditTypeTitle: 'Holiday Credit',
            }),
        );
    });

    it('should apply disabledCredit class when isDisabled is true', () => {
        mockProps = createProps({ isDisabled: true });

        const { container } = render(<BalanceHistoryMobileItem {...mockProps} />);
        const button = container.querySelector('button');

        expect(button).toHaveClass('disabledCredit');
    });

    it('should apply recentCredit class when isRecentCredit is true', () => {
        mockProps = createProps({ isRecentCredit: true });

        const { container } = render(<BalanceHistoryMobileItem {...mockProps} />);
        const button = container.querySelector('button');

        expect(button).toHaveClass('recentCredit');
    });

    it('should apply withoutBorderTop class when withoutBorderTop is true', () => {
        mockProps = createProps({ withoutBorderTop: true });

        const { container } = render(<BalanceHistoryMobileItem {...mockProps} />);
        const button = container.querySelector('button');

        expect(button).toHaveClass('withoutBorderTop');
    });

    it('should apply insideDrawer class when isInsideDrawer is true', () => {
        mockProps = createProps({ isInsideDrawer: true });

        const { container } = render(<BalanceHistoryMobileItem {...mockProps} />);
        const button = container.querySelector('button');

        expect(button).toHaveClass('insideDrawer');
    });

    it('should apply expandedCredit class when isItemExpanded is true', () => {
        mockProps = createProps({ isItemExpanded: true });

        const { container } = render(<BalanceHistoryMobileItem {...mockProps} />);
        const button = container.querySelector('button');

        expect(button).toHaveClass('expandedCredit');
    });

    it('should handle undefined LogoImage', () => {
        mockProps = createProps({ LogoImage: undefined });

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                logo: undefined,
            }),
        );
    });

    it('should handle undefined currency', () => {
        mockProps = createProps({ currency: undefined });

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                options: { currency: undefined, minimumFractionDigits: 2 },
            }),
        );
    });

    it('should render with different status types', () => {
        mockProps = createProps({ status: BalanceOrderStatuses.Expired });

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockBalanceHistoryChip).toHaveBeenCalledWith(
            expect.objectContaining({
                status: BalanceOrderStatuses.Expired,
            }),
        );
    });

    it('should handle ShowLogos being false', () => {
        mockProps = createProps();
        mockProps.fields.ShowLogos = mockSitecoreField(false);

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                showLogo: false,
            }),
        );
    });

    it('should handle empty description', () => {
        mockProps = createProps({ description: '' });

        render(<BalanceHistoryMobileItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                description: '',
            }),
        );
    });

    it('should handle credit item with no redemptions', () => {
        const itemWithNoRedemptions = {
            ...mockBalanceHistoryItem,
            redemptions: [],
        };
        mockProps = createProps({ creditItem: itemWithNoRedemptions, isItemExpanded: true });

        render(<BalanceHistoryMobileItem {...mockProps} />);

        // Should only render the credit item itself
        expect(mockBalanceHistorySubItem).toHaveBeenCalledTimes(1);
    });

    it('should call getBalanceOnStep for each redemption with correct index', () => {
        mockProps = createProps({ isItemExpanded: true });
        const getBalanceOnStepSpy = jest.spyOn(creditUtils, 'getBalanceOnStep');

        render(<BalanceHistoryMobileItem {...mockProps} />);

        mockBalanceHistoryItem.redemptions.forEach((_, index) => {
            expect(getBalanceOnStepSpy).toHaveBeenCalledWith(mockBalanceHistoryItem, index);
        });
    });
});
