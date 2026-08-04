import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { NumberFormatPartTypes } from 'frontend/store/base';
import { PaymentType } from 'models/enum/PaymentType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IPayBlockProps } from './interfaces';
import { PayBlock } from './PayBlock';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = (): IPayBlockProps => ({
    onPay: jest.fn(),
    canPay: true,
    fatalPaymentError: false,
    requirePaymentAuthorization: false,
    amountToPay: 120,
    amount: 150,
    usedCredit: 30,
    amountLabel: 'Total amount',
    applePayPaymentAuthorization: jest.fn(),
    applePayPaymentFormValidation: jest.fn(),
});

const createStores = () =>
    createMockStores({
        payStore: {
            isPaymentAllowed: true,
            currency: 'GBP',
        },
        paymentTypeStore: {
            selectedPaymentType: PaymentType.Card,
        },
        paymentStore: {
            confirmPolicy: true,
        },
        marketStore: {
            formatMoneyToIntegerAndDecimalWithTypes: (amount: number) => [
                { type: NumberFormatPartTypes.Integer, value: String(amount) },
            ],
        },
    });

let props: IPayBlockProps;
let mockStores: ReturnType<typeof createStores>;

describe('<PayBlock />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    describe(' Pay Buttons', () => {
        it('should show the correct button when the selected payment option is Card', () => {
            render(<PayBlock {...props} />);
            expect(screen.getByTestId('pay-with-card')).toBeInTheDocument();
            expect(screen.getByTestId('pay-block-holiday-summary')).toBeInTheDocument();
        });

        it('should show the correct  if the user has paid in full with credit even if Apple Pay option has previously been selected', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            props.amountToPay = 0;
            props.usedCredit = 1;
            render(<PayBlock {...props} />);

            expect(screen.getByText(SitecoreDictionary.PaymentButtonsPayNow)).toBeInTheDocument();
            expect(screen.queryByTestId('apple-pay-button')).not.toBeInTheDocument();
        });

        it('should show yje Apple Pay button when selected payment option is Apple Pay', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            render(<PayBlock {...props} />);
            expect(screen.getByTestId('apple-pay-button-component')).toBeInTheDocument();
        });

        it('should not show the pay with card button if payment authorised is required', () => {
            props.requirePaymentAuthorization = true;
            render(<PayBlock {...props} />);
            expect(screen.queryByTestId('pay-with-card')).not.toBeInTheDocument();
        });
    });

    describe('getPhrase integration', () => {
        it('should call getPhrase for button and total', () => {
            render(<PayBlock {...props} />);
            expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(SitecoreDictionary.PaymentButtonsPayNow);
            expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(
                SitecoreDictionary.PaymentTitlesYouAboutToPay,
            );
        });
    });

    describe('error message rendering', () => {
        it('should render error if isPaymentAllowed is false', () => {
            mockStores.payStore.isPaymentAllowed = false;
            render(<PayBlock {...props} />);
            expect(screen.getByText('This site is not secure, you cannot proceed with payment')).toBeInTheDocument();
        });
    });

    describe('integration', () => {
        it('should pass amount, currency and formatters to AmountToPay and PriceBreakdown', () => {
            render(<PayBlock {...props} />);
            expect(screen.getByTestId('total-payable-amount')).toBeInTheDocument();
            expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(
                SitecoreDictionary.PaymentLabelsHolidayCredit,
            );
        });
    });

    describe('interactions', () => {
        it('should execute onPay when button clicked', () => {
            render(<PayBlock {...props} />);
            fireEvent.click(screen.getByTestId('pay-with-card'));
            expect(props.onPay).toHaveBeenCalled();
        });

        it('should execute onPay when button is visually disabled (canPay=false) but not truly disabled', () => {
            // hasDisabledStyles={!canPay} → button looks disabled but remains clickable
            // so that form validation errors are shown to the user on click
            props.canPay = false;
            render(<PayBlock {...props} />);
            fireEvent.click(screen.getByTestId('pay-with-card'));
            expect(props.onPay).toHaveBeenCalled();
        });

        it('should NOT execute onPay when button is truly disabled (isPaymentAllowed=false)', () => {
            // disabled={!isPaymentAllowed} → HTML disabled, click is fully blocked
            mockStores.payStore.isPaymentAllowed = false;
            render(<PayBlock {...props} />);
            fireEvent.click(screen.getByTestId('pay-with-card'));
            expect(props.onPay).not.toHaveBeenCalled();
        });
    });
});
