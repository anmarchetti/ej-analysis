import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import AmountLeftToPay from 'frontend/components/renderings/Payment/components/AmountLeftToPay';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores: any;

describe('AmountLeftToPay', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            payStore: {
                amountToPay: 100,
                usedCredit: 1,
                currency: 'mockCurrency',
            },
        });
    });

    it('should show the label and the amount left to pay', () => {
        mockStores.payStore.amountToPay = 123;

        render(<AmountLeftToPay amountLeftToPayField={mockSitecoreField('testAmountLeftToPayLabel {amount}')} />);

        expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(123, { currency: 'mockCurrency' });
        expect(screen.getByText('testAmountLeftToPayLabel £123')).toBeInTheDocument();
    });

    it('should NOT show the label and the amount left to pay if the user has not used any credits', () => {
        mockStores.payStore.amountToPay = 123;
        mockStores.payStore.usedCredit = 0;

        const { container } = render(
            <AmountLeftToPay amountLeftToPayField={mockSitecoreField('testAmountLeftToPayLabel {amount}')} />,
        );

        expect(mockStores.marketStore.formatMoney).not.toHaveBeenCalled();
        expect(screen.queryByText('testAmountLeftToPayLabel £123')).not.toBeInTheDocument();
        expect(container.querySelector('.pay-remaining-details')).not.toBeInTheDocument();
    });

    it('should NOT show the label and the amount left to pay if the amountLeftToPay field is not available', () => {
        mockStores.payStore.amountToPay = 123;
        mockStores.payStore.usedCredit = 1;

        const { container } = render(<AmountLeftToPay amountLeftToPayField={undefined} />);

        expect(mockStores.marketStore.formatMoney).not.toHaveBeenCalled();
        expect(container.querySelector('.pay-remaining-details')).not.toBeInTheDocument();
    });
});
