import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';

import PillsBlock, { IPillsBlockProps } from './PillsBlock';

jest.mock('./components/CountdownPill/CountdownPill', () => ({
    __esModule: true,
    default: () => <div data-tid='countdown-pill' />,
}));

jest.mock('./components/RemainingBalancePill/RemainingBalancePill', () => ({
    __esModule: true,
    default: () => <div data-tid='remaining-balance-pill' />,
}));

const resetMocks = () =>
    ({
        departureDate: null,
        remainingBalance: 0,
        dueDate: '2029-12-12',
        currency: CurrencyCode.GBP,
    } as IPillsBlockProps);

let mocks;

describe('<PillsBlock />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should be render Countdown pill', () => {
        mocks.departureDate = '2020-12-12';
        render(<PillsBlock {...mocks} />);

        expect(screen.getByTestId('countdown-pill')).toBeInTheDocument();
    });

    it('should be render Remaining Balance Pill', () => {
        mocks.remainingBalance = 12;
        render(<PillsBlock {...mocks} />);

        expect(screen.getByTestId('remaining-balance-pill')).toBeInTheDocument();
    });

    it('should not be render Remaining Balance Pill if it is external agency booking', () => {
        mocks.isExternalAgency = true;
        render(<PillsBlock {...mocks} />);

        expect(screen.queryByTestId('remaining-balance-pill')).not.toBeInTheDocument();
    });
});
