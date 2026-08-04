import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import * as storeHook from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { PaymentType } from 'models/enum/PaymentType';
import {
    gaApplePayDisplayedOnPage,
    gaApplePayPaymentOptionClicked,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { getMockFunctionCallsWithSpecificParam } from 'frontend/components/renderings/Payment/testUtils';

import ApplePayPaymentOption from './ApplePayPaymentOption';

const mockPushTrackingEvent = jest.fn();

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: jest.fn(() => ({
        pushTrackingEvent: mockPushTrackingEvent,
    })),
}));

jest.mock('frontend/components/icons-new/ApplePayLogo', () => () => <div data-tid='apple-pay-logo' />);
const createStore = () =>
    createMockStores({
        paymentTypeStore: {
            selectedPaymentType: PaymentType.Card,
            setSelectedPaymentType: jest.fn(),
        },
        layoutStore: {
            getPhrase: (key: string) => key,
        },
    });

let mockStores: IHolidaysStores;
const getPhraseMock = jest.fn().mockReturnValue('Pay with Apple Pay');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ApplePayPaymentOption />', () => {
    beforeEach(() => {
        mockStores = createStore();
        jest.spyOn(storeHook, 'default').mockImplementation(() => ({
            getPhrase: getPhraseMock,
            selectedPaymentType: mockStores.paymentTypeStore.selectedPaymentType,
            setSelectedPaymentType: mockStores.paymentTypeStore.setSelectedPaymentType,
        }));
    });

    it('should render with correct label and logo', () => {
        render(<ApplePayPaymentOption />);

        expect(screen.getByTestId('apple-pay-payment-type-option')).toBeInTheDocument();
        expect(screen.getByText('Pay with Apple Pay')).toBeInTheDocument();
        expect(screen.getByTestId('apple-pay-logo')).toBeInTheDocument();
    });

    it('should NOT be checked the RadioButton when ApplePay is not selected payment type', async () => {
        render(<ApplePayPaymentOption />);

        expect(mockStores.paymentTypeStore.selectedPaymentType).not.toBe(PaymentType.ApplePay);
    });

    it('should be checked the RadioButton when ApplePay is the selected payment type', async () => {
        mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;

        render(<ApplePayPaymentOption />);

        expect(mockStores.paymentTypeStore.selectedPaymentType).toBe(PaymentType.ApplePay);
    });

    it('should call setSelectedPaymentType with ApplePay when the RadioButton is checked', async () => {
        render(<ApplePayPaymentOption />);

        await userEvent.click(screen.getByRole('radio'));

        expect(mockStores.paymentTypeStore.setSelectedPaymentType).toHaveBeenCalledWith(PaymentType.ApplePay);
    });

    it('should invoke onPaymentOptionSelected when the payment type is selected', async () => {
        // Arrange
        const mockOnPaymentOptionSelected = jest.fn();

        render(<ApplePayPaymentOption onPaymentOptionSelected={mockOnPaymentOptionSelected} />);

        // Act
        await userEvent.click(screen.getByRole('radio'));

        // Assert
        expect(mockOnPaymentOptionSelected).toHaveBeenCalled();
    });

    it('should fire a Google Analytics event with gaApplePayDisplayedOnPage when the component is rendered', () => {
        render(<ApplePayPaymentOption />);

        const callsWithGaApplePayDisplayedOnPage = getMockFunctionCallsWithSpecificParam(
            mockPushTrackingEvent,
            gaApplePayDisplayedOnPage,
        );

        expect(callsWithGaApplePayDisplayedOnPage).toHaveLength(1);
    });

    it('should fire a Google Analytics event with gaApplePayPaymentOptionClicked when apple pay payment option is clicked', () => {
        render(<ApplePayPaymentOption />);
        screen.getByRole('radio').click();

        const callsWithGaApplePayPaymentOptionClicked = getMockFunctionCallsWithSpecificParam(
            mockPushTrackingEvent,
            gaApplePayPaymentOptionClicked,
        );

        expect(callsWithGaApplePayPaymentOptionClicked).toHaveLength(1);
    });
});
