import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { CardInfo } from 'models/data/payment/CardInfo';
import { PaymentType } from 'models/enum/PaymentType';
import { gaCreditDebitCardPaymentOptionClicked } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import CreditDebitCardPaymentOption from './CreditDebitCardPaymentOption';
import { IPaymentDetailsFormProps } from './interfaces';

// ResizeObserver is mocked globally in jest.setup.js

const setup = jsx => ({
    user: userEvent.setup(),
    ...render(jsx),
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPushTrackingEvent = jest.fn();

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: jest.fn(() => ({
        pushTrackingEvent: mockPushTrackingEvent,
    })),
}));

const createProps = (): IPaymentDetailsFormProps => ({
    fields: undefined,
    isDisabled: false,
});

jest.mock('frontend/components/common/Callout/Callout', () => () => <div data-tid='callout' />);

let props;
let mockStores;

const COUNT_OF_VALIDATABLE_FIELDS = 5;

describe('CreditDebitCardPaymentOption', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            payStore: {
                cardInfo: new CardInfo(),
                forceFieldErrors: false,
                paymentBlockInFocus: false,
                toggleFocusPaymentBlock: jest.fn(),
                highlightFields: false,
                clearCardInfo: jest.fn(),
                formRerenderTrigger: 0.5,
                isAtcomError: false,
                paymentErrors: [],
                expirationDateWaterMask: 'MM/YY',
            },
            paymentTypeStore: {
                selectedPaymentType: PaymentType.Card,
                setSelectedPaymentType: jest.fn(),
                paymentTypes: [PaymentType.Card],
            },
            trackingStore: {
                trackValidation: jest.fn(),
            },
        });
    });

    it('should NOT render radio button when only card payment is available', () => {
        const { queryByRole } = setup(<CreditDebitCardPaymentOption {...props} />);

        const radioButton = queryByRole('radio');
        expect(radioButton).not.toBeInTheDocument();
    });

    it('should render radio button when multiple payment types are available', () => {
        mockStores.paymentTypeStore.paymentTypes = [PaymentType.Card, PaymentType.ApplePay];
        const { container } = setup(<CreditDebitCardPaymentOption {...props} />);

        const selectCardPaymentType = container.querySelector('[data-tid="card-payment-type"]') as HTMLElement;
        expect(selectCardPaymentType).toBeInTheDocument();
    });

    it('should trim name on card on blur', () => {
        const { container } = setup(<CreditDebitCardPaymentOption {...props} />);

        const nameOnCard = container.querySelector('#nameOnCard') as HTMLInputElement;

        fireEvent.change(nameOnCard, { target: { value: '     test name      ' } });
        fireEvent.blur(nameOnCard);

        expect(nameOnCard!.value).toBe('test name');
    });

    it('should render card number according to american express mask', () => {
        const { container } = setup(<CreditDebitCardPaymentOption {...props} />);

        const cardNumberInput = container.querySelector('#cardNumber') as HTMLInputElement;

        fireEvent.change(cardNumberInput, { target: { value: '344238716403663' } });

        expect(cardNumberInput?.value).toBe('3442 387164 03663');
    });

    it('should render card number according to mastercard mask', () => {
        const { container } = setup(<CreditDebitCardPaymentOption {...props} />);

        const cardNumberInput = container.querySelector('#cardNumber') as HTMLInputElement;

        fireEvent.change(cardNumberInput, { target: { value: '2243084603101624' } });

        expect(cardNumberInput?.value).toBe('2243 0846 0310 1624');
    });

    it('should NOT render issue number field for mastercard', () => {
        mockStores.payStore.cardInfo.cardNumber = '2300410825982428';
        const { container } = setup(<CreditDebitCardPaymentOption {...props} />);
        const issueNumberInput = container.querySelector('#issueNumber') as HTMLInputElement;
        expect(issueNumberInput).toBe(null);
    });

    it('should render issue number field for reissued cards', () => {
        mockStores.payStore.cardInfo.cardNumber = '5018552191091734';
        const { container } = setup(<CreditDebitCardPaymentOption {...props} />);
        const issueNumberInput = container.querySelector('#issueNumber') as HTMLInputElement;

        fireEvent.change(issueNumberInput, { target: { value: '3' } });

        expect(issueNumberInput).toBeInTheDocument();
        expect(issueNumberInput.value).toBe('3');
    });

    it('should observe the issue number field once it mounts after switching to a Maestro card', () => {
        const observeMock = jest.fn();
        const originalResizeObserver = window.ResizeObserver;
        window.ResizeObserver = jest.fn().mockImplementation(() => ({
            observe: observeMock,
            unobserve: jest.fn(),
            disconnect: jest.fn(),
        }));

        const { container, rerender } = setup(<CreditDebitCardPaymentOption {...props} />);

        expect(container.querySelector('#issueNumber')).toBe(null);
        expect(observeMock).not.toHaveBeenCalledWith(expect.objectContaining({ id: 'issueNumber' }));

        mockStores.payStore.cardInfo.cardNumber = '5018552191091734';
        rerender(<CreditDebitCardPaymentOption {...props} />);

        const issueNumberInput = container.querySelector('#issueNumber') as HTMLInputElement;
        expect(issueNumberInput).toBeInTheDocument();
        expect(observeMock).toHaveBeenCalledWith(issueNumberInput);

        window.ResizeObserver = originalResizeObserver;
    });

    it('should use 4-digit cvv mask for american express cards', () => {
        const { container } = setup(<CreditDebitCardPaymentOption {...props} />);

        const cvvInput = container.querySelector('#cvv') as HTMLInputElement;
        const cardNumberInput = container.querySelector('#cardNumber') as HTMLInputElement;

        fireEvent.change(cardNumberInput, { target: { value: '343356345219853' } });
        fireEvent.change(cvvInput, { target: { value: '1234' } });

        expect(cvvInput.value).toBe('1234');
    });

    it('should use 3-digit cvv mask for NOT american express cards', () => {
        const { container } = setup(<CreditDebitCardPaymentOption {...props} />);

        const cvvInput = container.querySelector('#cvv') as HTMLInputElement;
        const cardNumberInput = container.querySelector('#cardNumber') as HTMLInputElement;

        fireEvent.change(cardNumberInput, { target: { value: '2309570265696910' } });
        fireEvent.change(cvvInput, { target: { value: '123' } });

        expect(cvvInput.value).toBe('123');
    });

    it('should clear cvv number field on change card number', () => {
        const { container } = setup(<CreditDebitCardPaymentOption {...props} />);

        const cvvInput = container.querySelector('#cvv') as HTMLInputElement;
        const cardNumberInput = container.querySelector('#cardNumber') as HTMLInputElement;

        fireEvent.change(cardNumberInput, { target: { value: '2309570265696910' } });
        fireEvent.change(cvvInput, { target: { value: '123' } });

        expect(cvvInput.value).toBe('123');
        expect(cardNumberInput.value).toBe('2309 5702 6569 6910');

        fireEvent.change(cardNumberInput, { target: { value: '' } });
        fireEvent.change(cardNumberInput, { target: { value: '2243084603101624' } });

        expect(cvvInput.value).toBe('');
        expect(cardNumberInput.value).toBe('2243 0846 0310 1624');
    });

    it('should not disable inputs if isAtcomError is falsy', () => {
        mockStores.payStore.cardInfo.cardNumber = '344238716403663';
        const { container } = setup(<CreditDebitCardPaymentOption {...props} />);
        const inputs = container.querySelectorAll('input[disabled]');
        expect(inputs.length).toBe(0);
    });

    it('should disable inputs if isAtcomError is truthy', () => {
        mockStores.payStore.cardInfo.cardNumber = '5018552191091734';
        mockStores.payStore.isAtcomError = true;

        const { container } = setup(<CreditDebitCardPaymentOption {...props} />);
        const inputs = container.querySelectorAll('input[disabled]');
        expect(inputs.length).toBe(COUNT_OF_VALIDATABLE_FIELDS);
    });

    it('should disable inputs if isDisabled is truthy', () => {
        mockStores.payStore.cardInfo.cardNumber = '5018552191091734';
        props.isDisabled = true;

        const { container } = setup(<CreditDebitCardPaymentOption {...props} />);
        const inputs = container.querySelectorAll('input[disabled]');
        expect(inputs.length).toBe(COUNT_OF_VALIDATABLE_FIELDS);
    });

    it('Booking errors shouldn`t be render', () => {
        mockStores.payStore.cardInfo.cardNumber = '344238716403663';
        setup(<CreditDebitCardPaymentOption {...props} />);
        expect(screen.queryByTestId('validatable-field-error')).not.toBeInTheDocument();
    });

    describe('expiration date', () => {
        it('should render expiration date according to UK mask', () => {
            const { container } = setup(<CreditDebitCardPaymentOption {...props} />);

            const expirationDateInput = container.querySelector('#expirationDate') as HTMLInputElement;

            fireEvent.change(expirationDateInput, { target: { value: '1120' } });

            expect(expirationDateInput?.value).toBe('11/20');
        });

        it('should render expiration date according to French mask', () => {
            mockStores.payStore.expirationDateWaterMask = 'MM.AA';
            const { container } = setup(<CreditDebitCardPaymentOption {...props} />);

            const expirationDateInput = container.querySelector('#expirationDate') as HTMLInputElement;

            fireEvent.change(expirationDateInput, { target: { value: '1120' } });

            expect(expirationDateInput?.value).toBe('11.20');
        });

        it('should NOT input extra numbers in expiration date field', () => {
            mockStores.payStore.cardInfo.expirationDate = '1';

            const { container } = setup(<CreditDebitCardPaymentOption {...props} />);

            const expirationDateInput = container.querySelector('#expirationDate') as HTMLInputElement;

            fireEvent.change(expirationDateInput, { target: { value: '12/211' } });

            expect(expirationDateInput?.value).toBe('12/21');
        });
    });

    describe('force field errors', () => {
        it('should NOT show errors when forceFieldErrors is disabled', () => {
            setup(<CreditDebitCardPaymentOption {...props} />);

            expect(screen.queryByTestId('validatable-field-error')).not.toBeInTheDocument();
        });

        it('should show errors when forceFieldErrors is enabled and selected payment is Card', () => {
            mockStores.payStore.forceFieldErrors = true;
            setup(<CreditDebitCardPaymentOption {...props} />);

            const inputs = screen.getAllByTestId('validatable-field-error');
            expect(inputs.length).toBe(COUNT_OF_VALIDATABLE_FIELDS - 1); //Exclude issueNumber
        });

        it('should NOT show errors when forceFieldErrors is enabled and selected payment is Apple Pay', () => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            mockStores.payStore.forceFieldErrors = true;
            setup(<CreditDebitCardPaymentOption {...props} />);

            expect(screen.queryByTestId('validatable-field-error')).not.toBeInTheDocument();
        });
    });

    describe('PaymentOptionWrapper interaction', () => {
        it('should render PaymentOptionWrapper with correct props when multiple payment types available', () => {
            mockStores.paymentTypeStore.paymentTypes = [PaymentType.Card, PaymentType.ApplePay];
            const { container } = setup(<CreditDebitCardPaymentOption {...props} dataTid='card-payment-type' />);

            const wrapper = container.querySelector('[data-tid="card-payment-type"]');
            expect(wrapper).toBeInTheDocument();

            const clickableButton = screen.getByTestId('clickable-card-payment-type-option');
            expect(clickableButton).toBeInTheDocument();
            expect(clickableButton?.className).toContain('creditCard');
        });

        it('should call setSelectedPaymentType when PaymentOptionWrapper is clicked', async () => {
            mockStores.paymentTypeStore.paymentTypes = [PaymentType.Card, PaymentType.ApplePay];
            const { user } = setup(<CreditDebitCardPaymentOption {...props} dataTid='card-payment-type' />);

            const clickableButton = screen.getByTestId('clickable-card-payment-type-option');
            await user.click(clickableButton);

            expect(mockStores.paymentTypeStore.setSelectedPaymentType).toHaveBeenCalledWith(PaymentType.Card);
        });
    });

    it('should render all four payment method icons (Maestro, Visa, Mastercard, AmericanExpress)', () => {
        const { container } = setup(<CreditDebitCardPaymentOption {...props} />);

        const cardLogos = container.querySelector('[data-tid="card-logos"]');
        expect(cardLogos).toBeInTheDocument();
        expect(cardLogos?.children).toHaveLength(4);
        expect(cardLogos?.querySelector('[data-tid="Maestro"]')).toBeInTheDocument();
        expect(cardLogos?.querySelector('[data-tid="Visa"]')).toBeInTheDocument();
        expect(cardLogos?.querySelector('[data-tid="Mastercard"]')).toBeInTheDocument();
        expect(cardLogos?.querySelector('[data-tid="AmericanExpress"]')).toBeInTheDocument();
    });

    it('should fire a Google Analytics event with gaCreditDebitCardPaymentOptionClicked when credit debit payment option is selected from a another payment option', () => {
        mockStores.paymentTypeStore.paymentTypes = [PaymentType.Card, PaymentType.ApplePay];
        mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
        render(<CreditDebitCardPaymentOption {...props} />);

        screen.getByRole('radio').click();

        expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaCreditDebitCardPaymentOptionClicked);
    });
});
