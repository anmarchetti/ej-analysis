import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { mockMarketCreditsField } from 'frontend/components/renderings/HolidayCredit/__mocks__/holidayCredit.mocks';
import HolidayCredit, { THolidayCreditProps } from 'frontend/components/renderings/HolidayCredit/HolidayCredit';
import * as utils from 'frontend/components/renderings/HolidayCredit/utils';

const mockBalanceCard = jest.fn();
jest.mock('frontend/components/renderings/HolidayCredit/components/BalanceCard', () => props => {
    mockBalanceCard(props);

    return <div data-tid='balance-card' />;
});

const mockRefundSuccessPopup = jest.fn();
jest.mock('frontend/components/renderings/CreditConfirm/components/RefundSuccessPopup', () => props => {
    mockRefundSuccessPopup(props);

    return <div data-tid='refund-success-popup' />;
});

const mockSpinner = jest.fn();
jest.mock('frontend/components/common/OverlaySpinner', () => props => {
    mockSpinner(props);

    return <div data-tid='spinner' />;
});

const mockPlaceholder = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholder(props);

        return <div data-tid='placeholder' />;
    },
}));

const createProps = (): THolidayCreditProps => ({
    fields: {
        InfoText: mockSitecoreField('text'),
        HelpLink: mockSitecoreField('link'),
        MarketCredits: mockMarketCreditsField,
        LoadingCreditHistoryLabel: mockSitecoreField('LoadingCreditHistoryLabel'),
        MultipleCreditsInfo: mockSitecoreField('MultipleCreditsInfo'),
    } as any,
    params: {} as any,
    rendering: {} as any,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            getBreadcrumb: jest.fn(),
            lang: 'en',
        },
        holidayCreditStore: {
            creditBalance: [
                {
                    currency: CurrencyCode.GBP,
                },
                {
                    currency: CurrencyCode.CHF,
                },
                {
                    currency: CurrencyCode.EUR,
                },
            ],
            isCreditLoading: false,
            isRefundSuccessPopupShown: false,
            clearRecentRefund: jest.fn(),
            initialize: jest.fn(),
        },
        userStore: { isLoggedIn: true },
        redeemVoucherStore: { setLatestRedeemedVoucherCode: jest.fn() },
        marketStore: { formatMoneyToIntegerAndDecimalWithTypes: jest.fn(() => []), currency: CurrencyCode.GBP },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HolidayCredit />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render OverlaySpinner if user is logged in', () => {
        const { queryByTestId } = render(<HolidayCredit {...mockProps} />);

        expect(queryByTestId('spinner')).not.toBeInTheDocument();
    });

    it('should render OverlaySpinner if user is NOT logged in', () => {
        mockStores.userStore.isLoggedIn = false;

        render(<HolidayCredit {...mockProps} />);

        expect(screen.getByTestId('spinner')).toBeInTheDocument();
        expect(mockSpinner).toHaveBeenCalledWith({ header: mockProps.fields.LoadingCreditHistoryLabel.value });
    });

    it('should render Placeholders', () => {
        render(<HolidayCredit {...mockProps} />);

        expect(mockPlaceholder).toHaveBeenNthCalledWith(1, {
            name: 'credit-page-title',
            rendering: {},
        });
        expect(mockPlaceholder).toHaveBeenNthCalledWith(2, {
            name: 'credit-expires-banner',
            rendering: {},
            className: 'bannerPaddings',
        });
        expect(mockPlaceholder).toHaveBeenNthCalledWith(3, {
            activeCurrency: undefined,
            name: 'credit-balance-history',
            rendering: {},
        });
        expect(mockPlaceholder).toHaveBeenNthCalledWith(4, { name: 'credit-links-card', rendering: {} });
    });

    it('should show warning text when user has more than one available credit market', () => {
        render(<HolidayCredit {...mockProps} />);

        expect(screen.queryByTestId('credit-warning')).toBeInTheDocument();
    });

    it('should render BalanceHistory for two currencies in creditBalance', () => {
        mockStores.holidayCreditStore.creditBalance = mockStores.holidayCreditStore.creditBalance.slice(0, 2);
        render(<HolidayCredit {...mockProps} />);

        expect(mockBalanceCard).toHaveBeenNthCalledWith(2, {
            activeCurrency: CurrencyCode.GBP,
            amount: undefined,
            changeActiveWallet: expect.any(Function),
            helpLinkText: undefined,
            isCreditLoading: false,
            MultipleCreditsInfo: mockProps.fields.MultipleCreditsInfo,
            tabs: [
                {
                    currency: CurrencyCode.GBP,
                    flag: {
                        value: {
                            alt: 'UK',
                            src: 'src',
                        },
                    },
                },
                {
                    currency: CurrencyCode.CHF,
                    flag: {
                        value: {
                            alt: 'CH',
                            src: 'src',
                        },
                    },
                },
            ],
        });
    });

    it('should NOT call getCreditTabs when no creditBalance', () => {
        mockStores.holidayCreditStore.creditBalance = null;
        const spy = jest.spyOn(utils, 'getCreditTabs');

        render(<HolidayCredit {...mockProps} />);

        expect(spy).not.toHaveBeenCalled();
        expect(mockBalanceCard).toHaveBeenCalledWith({
            activeCurrency: undefined,
            amount: undefined,
            changeActiveWallet: expect.any(Function),
            helpLinkText: undefined,
            isCreditLoading: true,
            tabs: [],
            MultipleCreditsInfo: mockProps.fields.MultipleCreditsInfo,
        });
    });

    it('should show RefundSuccessPopup when isRefundSuccessPopupShown is true', () => {
        mockStores.holidayCreditStore.isRefundSuccessPopupShown = true;

        render(<HolidayCredit {...mockProps} />);

        expect(mockRefundSuccessPopup).toHaveBeenCalled();
    });
});
