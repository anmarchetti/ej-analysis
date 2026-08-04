import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode, SignDisplay } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { PaymentType } from 'models/enum/PaymentType';
import styles from 'frontend/components/renderings/Payment/components/ApplePay/ApplePayButton.module.scss';
import { gaClickToAmendPaymentPage } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import AmendPaymentTotalBlock from './AmendPaymentTotalBlock';

const mockPushTrackingEvent = jest.fn();

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

jest.mock('frontend/components/icons-new/LockFilled', () => ({
    __esModule: true,
    default: () => <div>SVGLockFilled</div>,
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return (
            <div data-tid='rich-text'>
                RichTextWithLinks<div>{props.field.value}</div>
            </div>
        );
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return (
            <button data-tid='button' onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendPaymentTotalBlock />', () => {
    const resetMocks = () => ({
        hasError: false,
        price: 20,
        updatedBalanceAmount: 100,
        subtitle: mockSitecoreField('Remaining balance: {balanceAmount} due by {date}'),
        title: mockSitecoreField('You are about to pay').value,
        confirmLabel: mockSitecoreField('Confirm & Pay').value,
        isFullCreditPayment: false,
        shouldPayNow: true,
    });
    let mocks = resetMocks();

    beforeEach(() => {
        jest.resetAllMocks();
        mocks = resetMocks();
        mockStores = createMockStores({
            payStore: {
                isPaymentAllowed: true,
            },
            amendPaymentStore: {
                onPay: jest.fn(),
                canPay: false,
                addToBalanceDueDate: '01/01/2024',
                currency: CurrencyCode.GBP,
                isRefund: false,
                totalPrice: 100,
            },
            paymentTypeStore: {
                selectedPaymentType: PaymentType.ApplePay,
            },
        });
    });

    it('Should render component', () => {
        mockStores.paymentTypeStore.selectedPaymentType = PaymentType.Card;

        render(
            <AmendPaymentTotalBlock {...mocks}>
                <div data-tid='children' />
            </AmendPaymentTotalBlock>,
        );

        expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(20, {
            currency: CurrencyCode.GBP,
            signDisplay: SignDisplay.AUTO,
        });

        expect(screen.getByTestId('amend-payment-total')).toBeInTheDocument();
        expect(screen.getByText('You are about to pay £20')).toBeInTheDocument();
        expect(screen.getByTestId('children')).toBeInTheDocument();

        expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(100, {
            currency: CurrencyCode.GBP,
            signDisplay: SignDisplay.AUTO,
        });

        expect(screen.getByTestId('rich-text')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: {
                value: 'Remaining balance: <strong data-cs-mask="true">£100</strong> due by <strong data-cs-mask="true">01/01/2024</strong>',
            },
            dataId: 'amend-payment-total-subtitle',
            className: 'subtitle',
        });
        expect(screen.getByRole('button')).toHaveTextContent('Confirm & Pay');
        expect(screen.getByText('SVGLockFilled')).toBeInTheDocument();
    });

    it('should NOT render subtitle when it is not set', () => {
        mocks.subtitle = undefined as any;
        render(<AmendPaymentTotalBlock {...mocks} />);

        expect(screen.queryByTestId('rich-text')).not.toBeInTheDocument();
    });

    it('should NOT render subtitle when title not set', () => {
        mocks.title = undefined as any;
        render(<AmendPaymentTotalBlock {...mocks} />);

        expect(screen.queryByTestId('rich-text')).not.toBeInTheDocument();
    });

    it('should NOT render price if it is undefined', () => {
        mocks.price = undefined as any;
        render(<AmendPaymentTotalBlock {...mocks} />);

        expect(screen.queryByText('£20')).not.toBeInTheDocument();
    });

    describe('Confirm and pay button', () => {
        it('should render button in disabled state when payment is not allowed', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.Card;
            mockStores.payStore.isPaymentAllowed = false;

            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(mockButtonProps).toHaveBeenCalledWith(expect.objectContaining({ disabled: true }));
        });

        it('should render button in hasDisabledStyles state when canPay is false', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.Card;
            mockStores.amendPaymentStore.canPay = false;

            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(mockButtonProps).toHaveBeenCalledWith(expect.objectContaining({ hasDisabledStyles: true }));
        });

        it('should NOT render button when hasError is true', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.Card;
            mocks.hasError = true;

            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(screen.queryByTestId('button')).not.toBeInTheDocument();
        });

        it('should call onPay when button is clicked', async () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.Card;

            render(<AmendPaymentTotalBlock {...mocks} />);

            await userEvent.click(screen.getByRole('button'));

            expect(mockStores.amendPaymentStore.onPay).toHaveBeenCalled();
        });

        it('should render button when selected payment type is Card', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.Card;
            mocks.confirmLabel = mockSitecoreField('Confirm & Pay').value;

            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(screen.getByRole('button')).toHaveTextContent('Confirm & Pay');
            expect(screen.getByRole('button', { name: /confirm & pay/i })).toBeInTheDocument();
        });

        it('should render button when it is a full credit payment', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            mocks.isFullCreditPayment = true;
            mocks.confirmLabel = mockSitecoreField('Confirm changes').value;

            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(screen.getByRole('button')).toHaveTextContent('Confirm changes');
            expect(screen.getByRole('button', { name: /confirm changes/i })).toBeInTheDocument();
        });

        it('should render button when it is a refund', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            mocks.isFullCreditPayment = false;
            mockStores.amendPaymentStore.isRefund = true;
            mocks.confirmLabel = mockSitecoreField('Confirm changes').value;

            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(screen.getByRole('button')).toHaveTextContent('Confirm changes');
            expect(screen.getByRole('button', { name: /confirm changes/i })).toBeInTheDocument();
        });

        it('should render button when total price is 0', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.Card;
            mocks.isFullCreditPayment = false;
            mockStores.amendPaymentStore.isRefund = false;
            mockStores.amendPaymentStore.totalPrice = 0;
            mocks.confirmLabel = mockSitecoreField('Confirm changes').value;

            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(screen.getByRole('button')).toHaveTextContent('Confirm changes');
            expect(screen.getByRole('button', { name: /confirm changes/i })).toBeInTheDocument();
        });

        it('should render button when the user has to pay now', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.Card;
            mocks.isFullCreditPayment = false;
            mockStores.amendPaymentStore.isRefund = false;
            mockStores.amendPaymentStore.totalPrice = 100;
            mocks.shouldPayNow = true;
            mocks.confirmLabel = mockSitecoreField('Confirm changes').value;

            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(screen.getByRole('button', { name: /confirm changes/i })).toBeInTheDocument();
        });

        it('should push a tracking event when the pay button is clicked and disabled', async () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.Card;

            render(<AmendPaymentTotalBlock {...mocks} />);

            await userEvent.click(screen.getByRole('button'));

            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickToAmendPaymentPage(false));
        });

        it('should push a tracking event when the pay button is clicked and enabled', async () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.Card;
            mockStores.amendPaymentStore.canPay = true;

            render(<AmendPaymentTotalBlock {...mocks} />);

            await userEvent.click(screen.getByRole('button'));

            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickToAmendPaymentPage(true));
        });
    });

    describe('Apple Pay button', () => {
        it('should render the Apple Pay Button when selected payment type is Apple Pay', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(screen.getByTestId('apple-pay-button')).toBeInTheDocument();
        });

        it('should NOT render the Apple Pay Button when selected payment type is NOT Apple Pay', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.Card;
            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(screen.queryByTestId('apple-pay-button')).not.toBeInTheDocument();
        });

        it('should NOT render the Apple Pay Button when it is a full credit payment', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            mocks.isFullCreditPayment = true;

            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(screen.queryByTestId('apple-pay-button')).not.toBeInTheDocument();
        });

        it('should NOT render the Apple Pay Button when it is a refund', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            mocks.isFullCreditPayment = false;
            mockStores.amendPaymentStore.isRefund = true;

            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(screen.queryByTestId('apple-pay-button')).not.toBeInTheDocument();
        });

        it('should NOT render the Apple Pay Button when total price is 0', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            mocks.isFullCreditPayment = false;
            mockStores.amendPaymentStore.isRefund = false;
            mockStores.amendPaymentStore.totalPrice = 0;

            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(screen.queryByTestId('apple-pay-button')).not.toBeInTheDocument();
        });

        it('should NOT render the Apple Pay Button when the user does NOT have to pay now', () => {
            mocks.shouldPayNow = false;
            render(<AmendPaymentTotalBlock {...mocks} />);

            expect(screen.queryByTestId('apple-pay-button')).not.toBeInTheDocument();
        });

        it('should show the ApplePay button as visibly disabled when `canPay` is false', async () => {
            // Arrange
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            mockStores.amendPaymentStore.canPay = false;

            render(<AmendPaymentTotalBlock {...mocks} />);

            // Act
            const buttonContainer = screen.getByTestId('apple-pay-button');

            // Assert
            expect(buttonContainer).toHaveClass(styles.applePayButtonDisabled);
        });
    });
});
