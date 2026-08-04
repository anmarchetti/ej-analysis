import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { PaymentOption } from 'frontend/store/base/amend/BaseAmendPaymentStore';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { gaClickPayAmend } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import PaymentOptions from './PaymentOptions';

const createProps = () => ({
    fields: {
        PayFeeAmendDescription: mockSitecoreField('PayFeeAmendDescription'),
        PayFullAmendDescription: mockSitecoreField('PayFullAmendDescription'),
    },
});

let mockProps;
let mockStores;

const mockPushTrackingEvent = jest.fn();

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPaymentOptionsFullProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendPayment/components/PaymentOptions/PaymentOptionsFull/PaymentOptionsFull',
    () => ({
        __esModule: true,
        default: props => {
            mockPaymentOptionsFullProps(props);

            return <div data-tid='payment-options-full' />;
        },
    }),
);

const mockPaymentOptionAddToBalanceProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendPayment/components/PaymentOptions/PaymentOptionAddToBalance/PaymentOptionAddToBalance',
    () => ({
        __esModule: true,
        default: props => {
            mockPaymentOptionAddToBalanceProps(props);

            return <div data-tid='payment-option-add-to-balance' />;
        },
    }),
);

describe('<PaymentOptions />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            amendPaymentStore: {
                paymentOption: PaymentOption.Full,
                totalPrice: 10,
                onChangePaymentOption: jest.fn(),
                canAddToBalance: true,
            },
        });
    });

    it('should NOT render PaymentOptionAddToBalance when canAddToBalance is false', () => {
        mockStores.amendPaymentStore.canAddToBalance = false;
        render(<PaymentOptions {...mockProps} />);

        expect(screen.queryByTestId('payment-option-add-to-balance')).not.toBeInTheDocument();
        expect(screen.getByTestId('payment-options-full')).toBeInTheDocument();
    });

    it('should NOT render when no totalPrice', () => {
        mockStores.amendPaymentStore.totalPrice = 0;
        const { container } = render(<PaymentOptions {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render components', () => {
        render(<PaymentOptions {...mockProps} />);

        expect(screen.getByTestId('payment-options-full')).toBeInTheDocument();
        expect(mockPaymentOptionsFullProps).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.fields,
                isSelected: false,
                onChange: expect.any(Function),
            }),
        );
        expect(screen.getByTestId('payment-option-add-to-balance')).toBeInTheDocument();
        expect(mockPaymentOptionAddToBalanceProps).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.fields,
                isSelected: false,
                onChange: expect.any(Function),
            }),
        );
    });

    it('should push tracking gaClickPayAmend event onChangePaymentOption with "Part" on onChange call', () => {
        render(<PaymentOptions {...mockProps} />);

        const [[fullProps]] = mockPaymentOptionsFullProps.mock.calls;

        // Simulate user click by calling onChange directly
        fullProps.onChange();

        expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickPayAmend(PaymentOption.Part));
        expect(mockStores.amendPaymentStore.onChangePaymentOption).toHaveBeenCalledWith(PaymentOption.Part);
    });

    it('should push tracking gaClickPayAmend event onChangePaymentOption with "AddToBalance" on onChange call', () => {
        render(<PaymentOptions {...mockProps} />);

        const [[addToBalanceProps]] = mockPaymentOptionAddToBalanceProps.mock.calls;

        // Simulate user click by calling onChange directly
        addToBalanceProps.onChange();

        expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickPayAmend(PaymentOption.AddToBalance));
        expect(mockStores.amendPaymentStore.onChangePaymentOption).toHaveBeenCalledWith(PaymentOption.AddToBalance);
    });
});
