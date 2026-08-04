import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import * as dateUtils from 'frontend/utils/date.utils';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { mockBalanceHistoryItem } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistory.mocks';
import { mockBalanceHistoryFields } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistoryFields.mocks';
import { BalanceOrderStatuses } from 'frontend/components/renderings/HolidayCredit/components/BalanceHistoryChip/BalanceHistoryChip';
import * as creditUtils from 'frontend/components/renderings/HolidayCredit/utils';

import BalanceHistoryDesktopItem, { TBalanceHistoryDesktopItemProps } from './BalanceHistoryDesktopItem';

const createProps = (overrides?: Partial<TBalanceHistoryDesktopItemProps>): TBalanceHistoryDesktopItemProps => ({
    creditItem: mockBalanceHistoryItem,
    creditTypeTitle: 'Holiday Credit',
    currency: 'GBP' as CurrencyCode,
    description: 'Test description',
    fields: mockBalanceHistoryFields,
    handleExpand: jest.fn(),
    isDisabled: false,
    isItemExpanded: false,
    status: BalanceOrderStatuses.Active,
    LogoImage: mockSitecoreField(mockSitecoreImageField('logo')),
    isRecentCredit: false,
    ...overrides,
});

const createStores = () => createMockStores();

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
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

const mockExpirationDate = jest.fn();
jest.mock('frontend/components/renderings/HolidayCredit/components/ExpirationDate/ExpirationDate', () => ({
    __esModule: true,
    default: props => {
        mockExpirationDate(props);

        return <div data-tid='expiration-date'>ExpirationDate</div>;
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

        return (
            <button data-tid={props.dataTid} onClick={props.onClick}>
                ShowMoreButton
            </button>
        );
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
    addDays: jest.fn((days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);

        return date;
    }),
}));

describe('<BalanceHistoryDesktopItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        jest.spyOn(creditUtils, 'getBalanceOnStep').mockReturnValue(1100);
    });

    it('should render the desktop item container', () => {
        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-item')).toBeInTheDocument();
    });

    it('should render main item section', () => {
        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-main-item')).toBeInTheDocument();
    });

    it('should render BalanceHistoryChip with correct props', () => {
        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockBalanceHistoryChip).toHaveBeenCalledWith({
            status: BalanceOrderStatuses.Active,
            fields: mockBalanceHistoryFields,
        });
    });

    it('should render ExpirationDate with correct props', () => {
        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockExpirationDate).toHaveBeenCalledWith({
            expirationDate: mockBalanceHistoryItem.expires,
            fields: mockBalanceHistoryFields,
        });
    });

    it('should render CreditItemInfo with correct props', () => {
        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith({
            showLogo: false,
            logo: mockProps.LogoImage,
            creditTypeName: 'Holiday Credit',
            description: 'Test description',
            dataTid: 'balance-history-item',
            isRecentCredit: false,
        });
    });

    it('should render formatted created date', () => {
        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-item-date')).toBeInTheDocument();
        expect(dateUtils.formatDateL10n).toHaveBeenCalledWith(mockBalanceHistoryItem.createdAt, 'DD MMM YYYY');
    });

    it('should render balance with FormattedMoney', () => {
        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-item-balance')).toBeInTheDocument();
        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 1100,
                options: { currency: 'GBP', minimumFractionDigits: 2 },
            }),
        );
    });

    it('should render absolute value of balance', () => {
        jest.spyOn(creditUtils, 'getBalanceOnStep').mockReturnValue(-500);

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 500,
            }),
        );
    });

    it('should call getBalanceOnStep with creditItem and step 0', () => {
        const getBalanceOnStepSpy = jest.spyOn(creditUtils, 'getBalanceOnStep');

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(getBalanceOnStepSpy).toHaveBeenCalledWith(mockBalanceHistoryItem, 0);
    });

    it('should render ShowMoreButton with correct props when collapsed', () => {
        mockProps = createProps({ isItemExpanded: false });

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockShowMoreButton).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'balance-history-item-button',
                'aria-label': 'Expand credit history',
                isChevronUp: false,
            }),
        );
    });

    it('should render ShowMoreButton with correct props when expanded', () => {
        mockProps = createProps({ isItemExpanded: true });

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockShowMoreButton).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'balance-history-item-button',
                'aria-label': 'Collapse credit history',
                isChevronUp: true,
            }),
        );
    });

    it('should call handleExpand when ShowMoreButton is clicked', () => {
        const handleExpand = jest.fn();
        mockProps = createProps({ handleExpand });

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        fireEvent.click(screen.getByTestId('balance-history-item-button'));

        expect(handleExpand).toHaveBeenCalledTimes(1);
    });

    it('should not render details when not expanded', () => {
        mockProps = createProps({ isItemExpanded: false });

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockBalanceHistorySubItem).not.toHaveBeenCalled();
    });

    it('should render details when expanded', () => {
        mockProps = createProps({ isItemExpanded: true });

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockBalanceHistorySubItem).toHaveBeenCalled();
    });

    it('should render BalanceHistorySubItem for each redemption', () => {
        mockProps = createProps({ isItemExpanded: true });

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        // Number of redemptions + 1 for the credit item itself
        const redemptionsCount = mockBalanceHistoryItem.redemptions.length;
        expect(mockBalanceHistorySubItem).toHaveBeenCalledTimes(redemptionsCount + 1);
    });

    it('should render BalanceHistorySubItem for redemptions with correct props', () => {
        mockProps = createProps({ isItemExpanded: true });
        jest.spyOn(creditUtils, 'getBalanceOnStep').mockReturnValue(400);

        render(<BalanceHistoryDesktopItem {...mockProps} />);

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

        render(<BalanceHistoryDesktopItem {...mockProps} />);

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

        const { container } = render(<BalanceHistoryDesktopItem {...mockProps} />);
        const itemContainer = container.querySelector('[data-tid="balance-history-item"]');

        expect(itemContainer).toHaveClass('disabledCredit');
    });

    it('should apply recentCredit class when isRecentCredit is true', () => {
        mockProps = createProps({ isRecentCredit: true });

        const { container } = render(<BalanceHistoryDesktopItem {...mockProps} />);
        const itemContainer = container.querySelector('[data-tid="balance-history-item"]');

        expect(itemContainer).toHaveClass('recentCredit');
    });

    it('should apply expandedCredit class when isItemExpanded is true', () => {
        mockProps = createProps({ isItemExpanded: true });

        const { container } = render(<BalanceHistoryDesktopItem {...mockProps} />);
        const itemContainer = container.querySelector('[data-tid="balance-history-item"]');

        expect(itemContainer).toHaveClass('expandedCredit');
    });

    it('should apply mainItemWithLogos class when ShowLogos is true', () => {
        mockProps = createProps();
        mockProps.fields.ShowLogos = mockSitecoreField(true);

        const { container } = render(<BalanceHistoryDesktopItem {...mockProps} />);
        const mainItem = container.querySelector('[data-tid="balance-history-main-item"]');

        expect(mainItem).toHaveClass('mainItemWithLogos');
    });

    it('should not apply mainItemWithLogos class when ShowLogos is false', () => {
        mockProps = createProps();
        mockProps.fields.ShowLogos = mockSitecoreField(false);

        const { container } = render(<BalanceHistoryDesktopItem {...mockProps} />);
        const mainItem = container.querySelector('[data-tid="balance-history-main-item"]');

        expect(mainItem).not.toHaveClass('mainItemWithLogos');
    });

    it('should handle undefined LogoImage', () => {
        mockProps = createProps({ LogoImage: undefined });

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                logo: undefined,
            }),
        );
    });

    it('should handle undefined currency', () => {
        mockProps = createProps({ currency: undefined });

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                options: { currency: undefined, minimumFractionDigits: 2 },
            }),
        );
    });

    it('should handle different status types', () => {
        mockProps = createProps({ status: BalanceOrderStatuses.Expired });

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockBalanceHistoryChip).toHaveBeenCalledWith(
            expect.objectContaining({
                status: BalanceOrderStatuses.Expired,
            }),
        );
    });

    it('should handle empty description', () => {
        mockProps = createProps({ description: '' });

        render(<BalanceHistoryDesktopItem {...mockProps} />);

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

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        // Should only render the credit item itself
        expect(mockBalanceHistorySubItem).toHaveBeenCalledTimes(1);
    });

    it('should call getBalanceOnStep for each redemption with correct index', () => {
        mockProps = createProps({ isItemExpanded: true });
        const getBalanceOnStepSpy = jest.spyOn(creditUtils, 'getBalanceOnStep');

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        mockBalanceHistoryItem.redemptions.forEach((_, index) => {
            expect(getBalanceOnStepSpy).toHaveBeenCalledWith(mockBalanceHistoryItem, index);
        });
    });

    it('should pass isRecentCredit to CreditItemInfo', () => {
        mockProps = createProps({ isRecentCredit: true });

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockCreditItemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                isRecentCredit: true,
            }),
        );
    });

    it('should handle large balance amounts', () => {
        jest.spyOn(creditUtils, 'getBalanceOnStep').mockReturnValue(999999);

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 999999,
            }),
        );
    });

    it('should render all subitems with unique keys', () => {
        mockProps = createProps({ isItemExpanded: true });

        const { container } = render(<BalanceHistoryDesktopItem {...mockProps} />);
        const subitems = container.querySelectorAll('[data-tid="balance-history-subitem"]');

        expect(subitems.length).toBe(mockBalanceHistoryItem.redemptions.length + 1);
    });

    it('should handle zero balance', () => {
        jest.spyOn(creditUtils, 'getBalanceOnStep').mockReturnValue(0);

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 0,
            }),
        );
    });

    it('should render with different currency codes', () => {
        mockProps = createProps({ currency: 'EUR' as CurrencyCode });

        render(<BalanceHistoryDesktopItem {...mockProps} />);

        expect(mockFormattedMoney).toHaveBeenCalledWith(
            expect.objectContaining({
                options: { currency: 'EUR', minimumFractionDigits: 2 },
            }),
        );
    });
});
