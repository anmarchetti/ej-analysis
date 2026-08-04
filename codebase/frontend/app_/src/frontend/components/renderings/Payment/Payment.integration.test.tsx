import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'mobx-react';

import { createMockStores, mockPaymentFields } from 'frontend/__mocks__';
import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import { PaymentType } from 'models/enum/PaymentType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import {
    createPaymentPagePartialMockStores,
    IPaymentPagePartialMockStores,
} from 'frontend/components/renderings/Payment/__mocks__/createPaymentPagePartialMockStores';
import { Payment, TPaymentProps } from 'frontend/components/renderings/Payment/Payment';

import styles from './components/ApplePay/ApplePayButton.module.scss';

jest.mock('frontend/utils/ui.utils', () => ({
    ...jest.requireActual('frontend/utils/ui.utils'),
    scrollToErrorBlock: jest.fn(),
}));

const mockPushTrackingEvent = jest.fn();

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => {
    const originalModule = jest.requireActual(
        'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking',
    );

    return {
        ...originalModule,
        usePaymentTracking: () => ({
            pushTrackingEvent: mockPushTrackingEvent,
        }),
    };
});

const createProps = (): TPaymentProps => ({
    fields: mockPaymentFields,
    params: {},
    rendering: {},
});

describe('Payment', () => {
    let mockStores: IPaymentPagePartialMockStores;
    let mockProps: TPaymentProps;

    beforeEach(() => {
        mockStores = createMockStores(createPaymentPagePartialMockStores());
        mockProps = createProps();
    });

    it('should scroll to Terms & Conditions when selecting ApplePay option', async () => {
        const mockScrollTo = jest.fn();
        window.scrollTo = mockScrollTo;

        render(
            <Provider {...mockStores}>
                <Payment {...mockProps} />
            </Provider>,
        );

        await act(async () => await userEvent.click(screen.getByText(SitecoreDictionary.PaymentLabelsApplePay)));

        expect(mockScrollTo).toHaveBeenCalled();
    });

    describe('Apple Pay button errors', () => {
        let mockOnForceErrors: jest.Mock;

        beforeEach(() => {
            mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            mockStores.payStore.isPaymentAllowed = true;
            mockStores.paymentStore.confirmPolicy = false;
            mockStores.payStore.isBillingInfoValid = true;
            mockOnForceErrors = jest.fn();
            mockStores.payStore.onForceErrors = mockOnForceErrors;
        });

        it('should force errors, scroll to error and create event when the T&Cs are not checked and the Apple Pay button is clicked', async () => {
            mockStores.paymentStore.confirmPolicy = false;
            mockStores.payStore.isBillingInfoValid = true;

            render(
                <Provider {...mockStores}>
                    <Payment {...mockProps} />
                </Provider>,
            );

            const buttonContainer = screen.getByTestId('apple-pay-button');
            const applePayButton = buttonContainer.querySelector('apple-pay-button')!;

            await userEvent.click(applePayButton);

            expect(scrollToErrorBlock).toHaveBeenCalled();
            expect(mockPushTrackingEvent).toHaveBeenCalled();
            expect(mockOnForceErrors).toHaveBeenCalled();
        });

        it('should show the ApplePay button as visibly disabled when `canPay` is false', async () => {
            mockStores.paymentStore.canPay = false;

            render(
                <Provider {...mockStores}>
                    <Payment {...mockProps} />
                </Provider>,
            );

            const buttonContainer = screen.getByTestId('apple-pay-button');

            expect(buttonContainer).toHaveClass(styles.applePayButtonDisabled);
        });

        it('should force errors, scroll to error when the billing info is not valid and the Apple Pay button is clicked', async () => {
            mockStores.paymentStore.confirmPolicy = true;
            mockStores.payStore.isBillingInfoValid = false;

            render(
                <Provider {...mockStores}>
                    <Payment {...mockProps} />
                </Provider>,
            );

            const buttonContainer = screen.getByTestId('apple-pay-button');
            const applePayButton = buttonContainer.querySelector('apple-pay-button')!;

            await userEvent.click(applePayButton);

            expect(scrollToErrorBlock).toHaveBeenCalled();
            expect(mockOnForceErrors).toHaveBeenCalled();
        });
    });
});
