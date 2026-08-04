import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { canPayRemainingBalance } from 'frontend/utils/date.utils';

import { RemainingBalance } from './RemainingBalance';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({
        marketStore: { formatMoney: jest.fn(a => `£${a}`) },
        layoutStore: { getPhrase: jest.fn(p => p) },
    }),
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children }) => <button data-tid='pay-button'>{children}</button>,
}));

jest.mock('frontend/utils/date.utils');

const createProps = () => ({
    balanceDueDate: '2020-08-02T00:00:00+00:00',
    allowPayBalanceDueDate: '2020-08-02T00:00:00+00:00',
    departureDate: '2020-08-02T00:00:00+00:00',
    balanceDueAmount: 100,
    currency: CurrencyCode.GBP,
});

let props;

describe('<RemainingBalance />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('Should render remaining balance with pay button', () => {
        (canPayRemainingBalance as jest.MockedFn<typeof canPayRemainingBalance>).mockReturnValueOnce(true);
        render(<RemainingBalance {...props} />);

        expect(screen.getByTestId('view-booking-cost-remaining-balance')).toBeInTheDocument();
        expect(screen.getByTestId('remaining-balance-subtitle')).toBeInTheDocument();
        expect(screen.getByTestId('pay-button')).toBeInTheDocument();
    });

    it('Should NOT render pay button', () => {
        (canPayRemainingBalance as jest.MockedFn<typeof canPayRemainingBalance>).mockReturnValueOnce(false);
        render(<RemainingBalance {...props} />);

        expect(screen.queryByTestId('pay-button')).not.toBeInTheDocument();
    });

    it('should apply subtitleClassName to subtitle element', () => {
        (canPayRemainingBalance as jest.MockedFn<typeof canPayRemainingBalance>).mockReturnValueOnce(false);
        render(<RemainingBalance {...props} subtitleClassName='custom-subtitle' />);

        expect(screen.getByTestId('remaining-balance-subtitle')).toHaveClass('custom-subtitle');
    });
});
