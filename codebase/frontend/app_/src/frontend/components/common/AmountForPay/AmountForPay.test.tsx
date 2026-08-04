import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { AmountForPay, IAmountForPayProps } from './AmountForPay';

jest.mock('frontend/components/common/ValidatableField/ValidatableField', () => ({ label, onChange, id }) => (
    <label>
        {label} <input data-tid={id} onChange={e => onChange(e.target.value)} type='text' />
    </label>
));

describe('<AmountForPay />', () => {
    const resetMocks = () =>
        ({
            fullAmount: 100,
            residualBalance: 1,
            onAmountChange: jest.fn(),
            title: 'Title',
            currency: CurrencyCode.GBP,
            getPhrase: jest.fn(p => p),
            forceErrors: false,
            onValidationChange: jest.fn(),
            inFocus: false,
            toggleFocus: jest.fn(),
            highlightFields: false,
            formatMoney: jest.fn(a => `£${a}`),
            getCurrencySymbol: jest.fn(() => '£'),
        } as IAmountForPayProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render title and radio options', () => {
        render(<AmountForPay {...mocks} />);

        expect(screen.getByTestId('amount-block')).toBeInTheDocument();
        expect(screen.getByTestId('total-amount-radio')).toBeInTheDocument();
        expect(screen.getByTestId('other-amount-radio')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
        expect(screen.getAllByRole('radio')).toHaveLength(2);
        expect(screen.getByRole('radio', { name: SitecoreDictionary.PaymentLabelsOtherAmount })).toBeInTheDocument();
        expect(
            screen.getByRole('radio', { name: `${SitecoreDictionary.PaymentLabelsTotalAmount} £100` }),
        ).toBeInTheDocument();
    });

    it('should set Total Amount', async () => {
        render(<AmountForPay {...mocks} />);

        const totalOption = screen.getByRole('radio', {
            name: `${SitecoreDictionary.PaymentLabelsTotalAmount} £100`,
        });
        await userEvent.click(totalOption);

        waitFor(() => expect(mocks.onAmountChange).toHaveBeenCalledWith(100));
    });

    it('should set Other Amount', async () => {
        render(<AmountForPay {...mocks} />);

        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

        const otherOption = screen.getByRole('radio', { name: SitecoreDictionary.PaymentLabelsOtherAmount });
        await userEvent.click(otherOption);

        const amountInput = screen.getByRole('textbox', { name: SitecoreDictionary.PaymentLabelsAmountToPay });
        expect(amountInput).toBeInTheDocument();

        await userEvent.type(amountInput, '50');

        waitFor(() => expect(mocks.onAmountChange).toHaveBeenCalledWith(50));
    });

    it('should show total amount radio without label', () => {
        mocks.hideTotalLabel = true;
        render(<AmountForPay {...mocks} />);

        expect(screen.getByRole('radio', { name: `£100` })).toBeInTheDocument();
    });
});
