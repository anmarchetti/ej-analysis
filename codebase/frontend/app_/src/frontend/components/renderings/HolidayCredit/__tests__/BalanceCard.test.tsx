import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { NumberFormatPartTypes } from 'frontend/store/base/market/MarketStore';
import { scrollToElement } from 'frontend/utils/ui.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BalanceCard from 'frontend/components/renderings/HolidayCredit/components/BalanceCard';

jest.mock('frontend/utils/ui.utils', () => ({
    scrollToElement: jest.fn(),
}));

const changeActiveWallet = jest.fn();
const createProps = () => ({
    amount: 1.2,
    isCreditLoading: false,
    tabs: [
        {
            currency: 'CHF',
            flag: {
                value: {
                    scr: 'src',
                },
            },
        },
        {
            currency: 'GBP',
            flag: {
                value: {
                    scr: 'src',
                },
            },
        },
    ],
    activeCurrency: 'GBP',
    changeActiveWallet,
    helpLinkText: 'helpLinkText',
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
    appStore: {
        isScreenLessMedium: true,
    },
    marketStore: { formatMoneyToIntegerAndDecimalWithTypes: jest.fn(() => [{}, {}, {}]) },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BalanceCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render heading and price', () => {
        mockStores.marketStore.formatMoneyToIntegerAndDecimalWithTypes.mockReturnValueOnce([
            { type: NumberFormatPartTypes.Currency, value: '£' },
            { type: NumberFormatPartTypes.Integer, value: '1' },
            { type: NumberFormatPartTypes.Decimal, value: '.20' },
        ]);
        const { getByRole, getByText } = render(<BalanceCard {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent(SitecoreDictionary.HolidayCreditTitlesBalanceCard);
        expect(getByText('£1')).toBeInTheDocument();
        expect(getByText('.20')).toBeInTheDocument();
        expect(screen.getByText(mockProps.tabs[0].currency)).toBeInTheDocument();
    });

    it('should render spinner when credit is loading ', () => {
        mockProps.isCreditLoading = true;
        const { getByTestId } = render(<BalanceCard {...mockProps} />);

        expect(getByTestId('spinner-container')).toBeInTheDocument();
    });

    it('should call setActiveCurrency after changing market', () => {
        const { container } = render(<BalanceCard {...mockProps} />);
        const tabs = container.getElementsByClassName('tab');

        fireEvent.click(tabs[0]);
        expect(changeActiveWallet).toBeCalledWith('CHF');
    });

    it('should not display tabs when there no available', () => {
        mockProps.tabs = [];
        render(<BalanceCard {...mockProps} />);

        expect(screen.queryByTestId('wallet-tabs')).not.toBeInTheDocument();
    });

    it('should not display tabs when user has credit in one currency', () => {
        mockProps.tabs = [
            {
                currency: 'GBP',
                flag: {
                    value: {
                        scr: 'src',
                    },
                },
            },
        ];
        render(<BalanceCard {...mockProps} />);

        expect(screen.queryByTestId('wallet-tabs')).not.toBeInTheDocument();
    });

    it('should display tabs', () => {
        const { container } = render(<BalanceCard {...mockProps} />);
        const tabs = container.getElementsByClassName('tab');

        // eslint-disable-next-line no-magic-numbers
        expect(tabs.length).toBe(2);
    });

    it('should display help link and scroll to section on click', () => {
        jest.spyOn(document, 'getElementById').mockImplementation(() => ({ parentElement: {} } as HTMLElement));
        render(<BalanceCard {...mockProps} />);
        const helpLink = screen.getByText(mockProps.helpLinkText);

        expect(helpLink).toBeInTheDocument();
        fireEvent.click(helpLink);
        expect(scrollToElement).toHaveBeenCalledWith({} as HTMLElement);
    });

    it('should NOT scroll when no section found', () => {
        jest.spyOn(document, 'getElementById').mockImplementation(() => null);
        render(<BalanceCard {...mockProps} />);
        const helpLink = screen.getByText(mockProps.helpLinkText);

        fireEvent.click(helpLink);
        expect(scrollToElement).not.toHaveBeenCalled();
    });

    it('should display multiple currencies info when multiple tabs have positive balance', () => {
        mockProps.tabs = [
            { currency: 'CHF', balance: 100, flag: { value: { scr: 'src' } } },
            { currency: 'GBP', balance: 200, flag: { value: { scr: 'src' } } },
        ];
        mockProps.MultipleCreditsInfo = { value: 'Multiple credits info text' };
        render(<BalanceCard {...mockProps} />);

        expect(screen.getByTestId('multiple-currencies-info')).toBeInTheDocument();
    });

    it('should NOT display multiple currencies info when only one tab has positive balance and the other is not active currency', () => {
        mockProps.tabs = [
            { currency: 'CHF', balance: 0, flag: { value: { scr: 'src' } } },
            { currency: 'GBP', balance: 200, flag: { value: { scr: 'src' } } },
        ];
        mockProps.activeCurrency = 'GBP';
        mockProps.MultipleCreditsInfo = { value: 'Multiple credits info text' };
        render(<BalanceCard {...mockProps} />);

        expect(screen.queryByTestId('multiple-currencies-info')).not.toBeInTheDocument();
    });

    it('should display multiple currencies info when zero-balance tab is the active currency', () => {
        mockProps.tabs = [
            { currency: 'CHF', balance: 0, flag: { value: { scr: 'src' } } },
            { currency: 'GBP', balance: 200, flag: { value: { scr: 'src' } } },
        ];
        mockProps.activeCurrency = 'CHF';
        mockProps.MultipleCreditsInfo = { value: 'Multiple credits info text' };
        render(<BalanceCard {...mockProps} />);

        expect(screen.getByTestId('multiple-currencies-info')).toBeInTheDocument();
    });

    it('should NOT display multiple currencies info when tabs have no balance', () => {
        mockProps.MultipleCreditsInfo = { value: 'Multiple credits info text' };
        render(<BalanceCard {...mockProps} />);

        expect(screen.queryByTestId('multiple-currencies-info')).not.toBeInTheDocument();
    });
});
