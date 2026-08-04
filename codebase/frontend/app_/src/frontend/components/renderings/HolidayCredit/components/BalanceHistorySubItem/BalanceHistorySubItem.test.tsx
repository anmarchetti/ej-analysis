import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import * as mediaQueryHooks from 'frontend/hooks/useMediaQuery';
import { IMetadata, IOrder } from 'models/data/IBalanceHistory';
import { mockBalanceHistoryFields } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistoryFields.mocks';
import * as creditUtils from 'frontend/components/renderings/HolidayCredit/utils';

import BalanceHistorySubItem, { TBalanceHistorySubItemType } from './BalanceHistorySubItem';

const createProps = (overrides?: Partial<TBalanceHistorySubItemType>): TBalanceHistorySubItemType => ({
    fields: mockBalanceHistoryFields,
    order: {
        amount: 100,
        date: '2024-12-31',
        status: 'Active',
    } as IOrder,
    balance: 200,
    creditTypeTitle: 'Holiday Credit',
    currency: 'GBP' as CurrencyCode,
    metadata: [
        { key: 'booking_ref', value: 'EJH123456' },
        { key: 'source', value: 'promotion' },
    ] as IMetadata[],
    ...overrides,
});

const createStores = () => createMockStores();

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockBalanceHistoryDesktopSubItem = jest.fn();
jest.mock(
    'frontend/components/renderings/HolidayCredit/components/BalanceHistoryDesktopSubItem/BalanceHistoryDesktopSubItem',
    () => ({
        __esModule: true,
        default: props => {
            mockBalanceHistoryDesktopSubItem(props);

            return <div data-tid='balance-history-desktop-subitem'>Desktop SubItem</div>;
        },
    }),
);

const mockBalanceHistoryMobileSubItem = jest.fn();
jest.mock(
    'frontend/components/renderings/HolidayCredit/components/BalanceHistoryMobileSubItem/BalanceHistoryMobileSubItem',
    () => ({
        __esModule: true,
        default: props => {
            mockBalanceHistoryMobileSubItem(props);

            return <div data-tid='balance-history-mobile-subitem'>Mobile SubItem</div>;
        },
    }),
);

describe('<BalanceHistorySubItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(true);
        jest.spyOn(creditUtils, 'getMetaDataValueByKey').mockReturnValue('EJH123456');
        jest.spyOn(creditUtils, 'getRedemptionOrigin').mockReturnValue('Redemption origin text');
        jest.spyOn(creditUtils, 'getSubItemLabel').mockReturnValue('Credit label text');
    });

    it('should render desktop subitem when viewport is more than tablet', () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(true);

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-desktop-subitem')).toBeInTheDocument();
        expect(screen.queryByTestId('balance-history-mobile-subitem')).not.toBeInTheDocument();
    });

    it('should render mobile subitem when viewport is tablet or less', () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(false);

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-mobile-subitem')).toBeInTheDocument();
        expect(screen.queryByTestId('balance-history-desktop-subitem')).not.toBeInTheDocument();
    });

    it('should pass correct props to desktop subitem', () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(true);

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopSubItem).toHaveBeenCalledWith({
            creditLabel: 'Credit label text',
            redemptionOrigin: 'Redemption origin text',
            balanceAmount: 200,
            amount: 100,
            date: '2024-12-31',
            currency: 'GBP',
            isAmountMoreThanZero: true,
        });
    });

    it('should pass correct props to mobile subitem', () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(false);

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(mockBalanceHistoryMobileSubItem).toHaveBeenCalledWith({
            creditLabel: 'Credit label text',
            redemptionOrigin: 'Redemption origin text',
            balanceAmount: 200,
            amount: 100,
            date: '2024-12-31',
            currency: 'GBP',
            isAmountMoreThanZero: true,
            fields: mockBalanceHistoryFields,
        });
    });

    it('should call getMetaDataValueByKey with correct parameters', () => {
        const getMetaDataValueByKeySpy = jest.spyOn(creditUtils, 'getMetaDataValueByKey');

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(getMetaDataValueByKeySpy).toHaveBeenCalledWith(mockProps.metadata, 'booking_ref');
    });

    it('should call getSubItemLabel with correct parameters when amount is positive', () => {
        const getSubItemLabelSpy = jest.spyOn(creditUtils, 'getSubItemLabel');

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(getSubItemLabelSpy).toHaveBeenCalledWith(
            'Active',
            true,
            mockBalanceHistoryFields,
            'EJH123456',
            'Holiday Credit',
        );
    });

    it('should call getSubItemLabel with correct parameters when amount is negative', () => {
        mockProps = createProps({
            order: {
                amount: -50,
                date: '2024-12-31',
                status: 'Active',
            } as IOrder,
        });
        const getSubItemLabelSpy = jest.spyOn(creditUtils, 'getSubItemLabel');

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(getSubItemLabelSpy).toHaveBeenCalledWith(
            'Active',
            false,
            mockBalanceHistoryFields,
            'EJH123456',
            'Holiday Credit',
        );
    });

    it('should call getRedemptionOrigin with correct parameters', () => {
        const getRedemptionOriginSpy = jest.spyOn(creditUtils, 'getRedemptionOrigin');

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(getRedemptionOriginSpy).toHaveBeenCalledWith(mockProps.metadata, expect.any(Function));
    });

    it('should use balance amount when balance prop is provided', () => {
        mockProps = createProps({ balance: 300 });
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(true);

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopSubItem).toHaveBeenCalledWith(
            expect.objectContaining({
                balanceAmount: 300,
            }),
        );
    });

    it('should use order amount when balance prop is not provided', () => {
        mockProps = createProps({ balance: undefined });
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(true);

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopSubItem).toHaveBeenCalledWith(
            expect.objectContaining({
                balanceAmount: 100,
            }),
        );
    });

    it('should handle empty metadata array', () => {
        mockProps = createProps({ metadata: [] });
        jest.spyOn(creditUtils, 'getMetaDataValueByKey').mockReturnValue('');

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-desktop-subitem')).toBeInTheDocument();
    });

    it('should handle undefined metadata', () => {
        mockProps = createProps({ metadata: undefined });

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(screen.getByTestId('balance-history-desktop-subitem')).toBeInTheDocument();
    });

    it('should handle undefined currency', () => {
        mockProps = createProps({ currency: undefined });
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(true);

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(mockBalanceHistoryDesktopSubItem).toHaveBeenCalledWith(
            expect.objectContaining({
                currency: undefined,
            }),
        );
    });

    it('should handle zero amount', () => {
        mockProps = createProps({
            order: {
                amount: 0,
                date: '2024-12-31',
                status: 'Active',
            } as IOrder,
        });
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(false);

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(mockBalanceHistoryMobileSubItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isAmountMoreThanZero: false,
            }),
        );
    });

    it('should handle canceled status', () => {
        mockProps = createProps({
            order: {
                amount: 100,
                date: '2024-12-31',
                status: 'Canceled',
            } as IOrder,
        });

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(creditUtils.getSubItemLabel).toHaveBeenCalledWith(
            'Canceled',
            true,
            mockBalanceHistoryFields,
            'EJH123456',
            'Holiday Credit',
        );
    });

    it('should handle empty holidayRef', () => {
        jest.spyOn(creditUtils, 'getMetaDataValueByKey').mockReturnValue('');
        const getSubItemLabelSpy = jest.spyOn(creditUtils, 'getSubItemLabel');

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(getSubItemLabelSpy).toHaveBeenCalledWith('Active', true, mockBalanceHistoryFields, '', 'Holiday Credit');
    });

    it('should handle undefined creditTypeTitle', () => {
        mockProps = createProps({ creditTypeTitle: undefined });
        const getSubItemLabelSpy = jest.spyOn(creditUtils, 'getSubItemLabel');

        render(<BalanceHistorySubItem {...mockProps} />);

        expect(getSubItemLabelSpy).toHaveBeenCalledWith(
            'Active',
            true,
            mockBalanceHistoryFields,
            'EJH123456',
            undefined,
        );
    });
});
