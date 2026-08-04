import React from 'react';
import { render } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import AmendmentPayNowPrices from './AmendmentPayNowPrices';

const createProps = () => ({
    fields: {
        PreviousBalanceLabel: mockSitecoreField('PreviousBalanceLabel'),
        BalanceReduction: mockSitecoreField('BalanceReduction'),
        AdditionalCost: mockSitecoreField('AdditionalCost'),
        DueBalanceLessBlockDaysTotal: mockSitecoreField('DueBalanceLessBlockDaysTotal'),
    },
});

const createStores = () => ({
    amendPaymentStore: { isRefund: false, totalPrice: 1, balanceAmount: 2, currency: 'GBP' },
    appStore: { isScreenLessMedium: false },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendmentPayNowPrices />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render amendPayNowPrices', () => {
        const { getByText } = render(<AmendmentPayNowPrices {...mockProps} />);

        expect(getByText('PreviousBalanceLabel')).toBeInTheDocument();
        expect(getByText('£2')).toBeInTheDocument();
    });

    it('should render AdditionalCost when no refund', () => {
        const { getByText } = render(<AmendmentPayNowPrices {...mockProps} />);

        expect(getByText('AdditionalCost')).toBeInTheDocument();
        expect(getByText('£1')).toBeInTheDocument();
    });

    it('should render BalanceReduction when is refund', () => {
        mockStores.amendPaymentStore.isRefund = true;
        const { getByText } = render(<AmendmentPayNowPrices {...mockProps} />);

        expect(getByText('BalanceReduction')).toBeInTheDocument();
    });

    it('should render desktop description when screen not less medium', () => {
        const { getByText } = render(<AmendmentPayNowPrices {...mockProps} />);

        expect(getByText('DueBalanceLessBlockDaysTotal')).toBeInTheDocument();
    });
});
