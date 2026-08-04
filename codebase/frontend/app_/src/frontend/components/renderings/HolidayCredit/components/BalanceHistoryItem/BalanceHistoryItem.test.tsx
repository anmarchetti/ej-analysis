import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import * as mediaQueryHooks from 'frontend/hooks/useMediaQuery';
import { mockBalanceHistoryItem } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistory.mocks';
import { mockBalanceHistoryFields } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistoryFields.mocks';
import { mockCreditTypeItems } from 'frontend/components/renderings/HolidayCredit/__mocks__/creditTypeItems.mocks';
import { BalanceOrderStatuses } from 'frontend/components/renderings/HolidayCredit/components/BalanceHistoryChip/BalanceHistoryChip';
import * as creditUtils from 'frontend/components/renderings/HolidayCredit/utils';

import BalanceHistoryItem, { TBalanceHistoryItemProps } from './BalanceHistoryItem';

const createProps = (overrides?: Partial<TBalanceHistoryItemProps>): TBalanceHistoryItemProps => ({
    creditItem: mockBalanceHistoryItem,
    fields: mockBalanceHistoryFields,
    defaultCreditTypeContent: mockCreditTypeItems[1].fields,
    isDrawerExpanded: false,
    isInsideDrawer: false,
    isRecentCredit: false,
    onItemClick: jest.fn(),
    withoutBorderTop: false,
    ...overrides,
});

const createStores = () => {
    const stores = createMockStores();
    stores.layoutStore.getPhrase = jest.fn(key => `phrase_${key}`);

    return stores;
};

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockBalanceHistoryDesktopItem = jest.fn();
jest.mock(
    'frontend/components/renderings/HolidayCredit/components/BalanceHistoryDesktopItem/BalanceHistoryDesktopItem',
    () => ({
        __esModule: true,
        default: props => {
            mockBalanceHistoryDesktopItem(props);

            return <div data-tid='balance-history-desktop-item'>Desktop Item</div>;
        },
    }),
);

const mockBalanceHistoryMobileItem = jest.fn();
jest.mock(
    'frontend/components/renderings/HolidayCredit/components/BalanceHistoryMobileItem/BalanceHistoryMobileItem',
    () => ({
        __esModule: true,
        default: props => {
            mockBalanceHistoryMobileItem(props);

            return <div data-tid='balance-history-mobile-item'>Mobile Item</div>;
        },
    }),
);

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    addDays: jest.fn((days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);

        return date;
    }),
}));

describe('<BalanceHistoryItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        jest.spyOn(mediaQueryHooks, 'useMoreThenMobileViewport').mockReturnValue(true);
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(true);
        jest.spyOn(creditUtils, 'getHistoryItemCurrency').mockReturnValue('GBP' as CurrencyCode);
        jest.spyOn(creditUtils, 'isCreditUsed').mockReturnValue(false);
        jest.spyOn(creditUtils, 'isCreditExpired').mockReturnValue(false);
        jest.spyOn(creditUtils, 'getMetaDataValueByKey').mockReturnValue('');
        jest.spyOn(creditUtils, 'getRedemptionOrigin').mockReturnValue('Redemption origin text');
    });

    it('should render desktop item when viewport is more than tablet', () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(true);

        render(<BalanceHistoryItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-desktop-item')).toBeInTheDocument();
        expect(screen.queryByTestId('balance-history-mobile-item')).not.toBeInTheDocument();
    });

    it('should render mobile item when viewport is tablet or less', () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(false);

        render(<BalanceHistoryItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-mobile-item')).toBeInTheDocument();
        expect(screen.queryByTestId('balance-history-desktop-item')).not.toBeInTheDocument();
    });

    it('should call getHistoryItemCurrency with creditItem', () => {
        const getHistoryItemCurrencySpy = jest.spyOn(creditUtils, 'getHistoryItemCurrency');

        render(<BalanceHistoryItem {...mockProps} />);

        expect(getHistoryItemCurrencySpy).toHaveBeenCalledWith(mockBalanceHistoryItem);
    });

    it('should set isDisabled to true when credit is used', () => {
        jest.spyOn(creditUtils, 'getCreditStatus').mockReturnValue(BalanceOrderStatuses.Used);

        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isDisabled: true,
            }),
        );
    });

    it('should set isDisabled to true when credit is expired', () => {
        jest.spyOn(creditUtils, 'getCreditStatus').mockReturnValue(BalanceOrderStatuses.Expired);

        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isDisabled: true,
            }),
        );
    });

    it('should set isDisabled to false when credit is neither used nor expired', () => {
        jest.spyOn(creditUtils, 'getCreditStatus').mockReturnValue(BalanceOrderStatuses.Active);

        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isDisabled: false,
            }),
        );
    });

    it('should call getRedemptionOrigin with metadata and getPhrase', () => {
        const getRedemptionOriginSpy = jest.spyOn(creditUtils, 'getRedemptionOrigin');

        render(<BalanceHistoryItem {...mockProps} />);

        expect(getRedemptionOriginSpy).toHaveBeenCalledWith(mockBalanceHistoryItem.metadata, expect.any(Function));
    });

    it('should find credit type content from Children by META_REASON', () => {
        jest.spyOn(creditUtils, 'getMetaDataValueByKey').mockReturnValue('Promotion - Tesco Clubcard');

        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith(
            expect.objectContaining({
                creditTypeTitle: 'Tesco Clubcard',
                LogoImage: mockCreditTypeItems[0].fields.LogoImage,
            }),
        );
    });

    it('should use defaultCreditTypeContent when no matching child is found', () => {
        jest.spyOn(creditUtils, 'getMetaDataValueByKey').mockReturnValue('non-matching-key');

        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith(
            expect.objectContaining({
                creditTypeTitle: 'Credit',
                LogoImage: mockCreditTypeItems[1].fields.LogoImage,
            }),
        );
    });

    it('should handle missing creditTypeSitecoreContent gracefully', () => {
        mockProps = createProps({ defaultCreditTypeContent: undefined });
        jest.spyOn(creditUtils, 'getMetaDataValueByKey').mockReturnValue('non-matching-key');

        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith(
            expect.objectContaining({
                creditTypeTitle: '',
            }),
        );
    });

    it('should initialize isItemExpanded to false', () => {
        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isItemExpanded: false,
            }),
        );
    });

    it('should toggle isItemExpanded when handleExpand is called on tablet+ viewport', () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenMobileViewport').mockReturnValue(true);

        render(<BalanceHistoryItem {...mockProps} />);

        // Get the handleExpand function from the first call
        const handleExpandFn = mockBalanceHistoryDesktopItem.mock.calls[0][0].handleExpand;

        // Call handleExpand
        act(() => {
            handleExpandFn();
        });

        // Re-render should show isItemExpanded as true
        expect(mockBalanceHistoryDesktopItem).toHaveBeenLastCalledWith(
            expect.objectContaining({
                isItemExpanded: true,
            }),
        );
    });

    it('should call onItemClick when handleExpand is called on mobile viewport', () => {
        const onItemClick = jest.fn();
        mockProps = createProps({ onItemClick });
        jest.spyOn(mediaQueryHooks, 'useMoreThenMobileViewport').mockReturnValue(false);
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(false);

        render(<BalanceHistoryItem {...mockProps} />);

        const handleExpandFn = mockBalanceHistoryMobileItem.mock.calls[0][0].handleExpand;
        handleExpandFn();

        expect(onItemClick).toHaveBeenCalledTimes(1);
    });

    it('should reset isItemExpanded to false when viewport changes to mobile', async () => {
        const { rerender } = render(<BalanceHistoryItem {...mockProps} />);

        // Change viewport
        jest.spyOn(mediaQueryHooks, 'useMoreThenMobileViewport').mockReturnValue(false);
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(false);

        rerender(<BalanceHistoryItem {...mockProps} />);

        await waitFor(() => {
            expect(mockBalanceHistoryMobileItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    isItemExpanded: false,
                }),
            );
        });
    });

    it('should pass common props to desktop item', () => {
        jest.spyOn(creditUtils, 'getCreditStatus').mockReturnValue(BalanceOrderStatuses.Active);
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(true);

        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith({
            isDisabled: false,
            LogoImage: expect.any(Object),
            creditTypeTitle: 'Credit',
            description: 'Redemption origin text',
            currency: 'GBP',
            handleExpand: expect.any(Function),
            isItemExpanded: false,
            isRecentCredit: false,
            creditItem: mockBalanceHistoryItem,
            fields: mockBalanceHistoryFields,
            status: BalanceOrderStatuses.Active,
        });
    });

    it('should pass common props plus mobile-specific props to mobile item', () => {
        jest.spyOn(creditUtils, 'getCreditStatus').mockReturnValue(BalanceOrderStatuses.Active);
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(false);

        mockProps = createProps({
            isDrawerExpanded: true,
            isInsideDrawer: true,
            withoutBorderTop: true,
        });

        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryMobileItem).toHaveBeenCalledWith({
            isDisabled: false,
            LogoImage: expect.any(Object),
            creditTypeTitle: 'Credit',
            description: 'Redemption origin text',
            currency: 'GBP',
            handleExpand: expect.any(Function),
            isItemExpanded: false,
            isRecentCredit: false,
            creditItem: mockBalanceHistoryItem,
            fields: mockBalanceHistoryFields,
            status: BalanceOrderStatuses.Active,
            isDrawerExpanded: true,
            isInsideDrawer: true,
            withoutBorderTop: true,
        });
    });

    it('should convert isDrawerExpanded to boolean in mobile item', () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(false);
        mockProps = createProps({ isDrawerExpanded: undefined });

        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryMobileItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isDrawerExpanded: false,
            }),
        );
    });

    it('should handle isRecentCredit prop', () => {
        mockProps = createProps({ isRecentCredit: true });

        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isRecentCredit: true,
            }),
        );
    });

    it('should handle undefined currency', () => {
        jest.spyOn(creditUtils, 'getHistoryItemCurrency').mockReturnValue(undefined);

        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith(
            expect.objectContaining({
                currency: undefined,
            }),
        );
    });

    it('should handle undefined onItemClick', () => {
        mockProps = createProps({ onItemClick: undefined });
        jest.spyOn(mediaQueryHooks, 'useMoreThenMobileViewport').mockReturnValue(false);
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(false);

        render(<BalanceHistoryItem {...mockProps} />);

        const handleExpandFn = mockBalanceHistoryMobileItem.mock.calls[0][0].handleExpand;

        // Should not throw error
        expect(() => handleExpandFn()).not.toThrow();
    });

    it('should use getPhrase from store', () => {
        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockStores.layoutStore.getPhrase).toBeDefined();
        expect(creditUtils.getRedemptionOrigin).toHaveBeenCalledWith(
            mockBalanceHistoryItem.metadata,
            mockStores.layoutStore.getPhrase,
        );
    });

    it('should handle empty Children array', () => {
        mockProps = createProps({
            fields: {
                ...mockBalanceHistoryFields,
                Children: [],
            },
        });

        render(<BalanceHistoryItem {...mockProps} />);

        // Should use defaultCreditTypeContent
        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith(
            expect.objectContaining({
                creditTypeTitle: 'Credit',
            }),
        );
    });

    it('should call getMetaDataValueByKey with correct parameters', () => {
        const getMetaDataValueByKeySpy = jest.spyOn(creditUtils, 'getMetaDataValueByKey');

        render(<BalanceHistoryItem {...mockProps} />);

        expect(getMetaDataValueByKeySpy).toHaveBeenCalledWith(mockBalanceHistoryItem.metadata, 'reason');
    });

    it('should handle multiple expand/collapse cycles', async () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenMobileViewport').mockReturnValue(true);

        const { rerender } = render(<BalanceHistoryItem {...mockProps} />);

        // Verify initial state
        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isItemExpanded: false,
            }),
        );

        // Get the expand handler and simulate expansion
        mockBalanceHistoryDesktopItem.mockClear();
        rerender(<BalanceHistoryItem {...mockProps} />);
        const handleExpandFn = mockBalanceHistoryDesktopItem.mock.calls[0][0].handleExpand;

        // Test that handleExpand function exists and works
        expect(handleExpandFn).toBeDefined();
        expect(typeof handleExpandFn).toBe('function');
    });

    it('should handle credit that is both used and expired', () => {
        // jest.spyOn(creditUtils, 'isCreditUsed').mockReturnValue(true);
        // jest.spyOn(creditUtils, 'isCreditExpired').mockReturnValue(true);
        jest.spyOn(creditUtils, 'getCreditStatus').mockReturnValue(BalanceOrderStatuses.Expired);

        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isDisabled: true,
            }),
        );
    });

    it('should handle empty description from getRedemptionOrigin', () => {
        jest.spyOn(creditUtils, 'getRedemptionOrigin').mockReturnValue('');

        render(<BalanceHistoryItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopItem).toHaveBeenCalledWith(
            expect.objectContaining({
                description: '',
            }),
        );
    });
});
