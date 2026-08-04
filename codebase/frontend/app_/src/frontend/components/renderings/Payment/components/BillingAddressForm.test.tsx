import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import equal from 'fast-deep-equal';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { BillingInfo } from 'models/data/payment/BillingInfo';
import {
    gaClickEditBillingAddress,
    gaUpdatedEditBillingAddress,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import BillingAddressForm, { IBillingAddressFormProps } from './BillingAddressForm';

const createProps = (): IBillingAddressFormProps => ({
    isDisabled: false,
    isOpen: false,
});

const mockValidatableFieldComponent = jest.fn();
const mockPushTrackingEvent = jest.fn();
let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));
jest.mock('frontend/components/common/ValidatableField/ValidatableField', () => ({ children, ...props }) => {
    mockValidatableFieldComponent(props);

    return <div data-tid='validatable-field'>{children}</div>;
});

jest.mock('fast-deep-equal', () => jest.fn());

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

describe('<BillingAddressForm />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            payStore: {
                billingInfo: new BillingInfo('test', 'test1', 'test2', 'test3'),
                forceErrors: false,
                highlightFields: false,
                toggleFocusBillingAddressBlock: jest.fn(),
            },
        });
    });

    it('editInfo should enable edit mode', async () => {
        render(<BillingAddressForm {...mockProps} />);

        const linkElement = screen.getByRole('link');
        expect(linkElement).toBeInTheDocument();
        expect(mockValidatableFieldComponent).not.toHaveBeenCalled();

        await userEvent.click(linkElement);

        expect(mockValidatableFieldComponent).toHaveBeenCalled();
    });

    it('should NOT render Edit Address link if block is disabled', () => {
        mockProps.isDisabled = true;
        render(<BillingAddressForm {...mockProps} />);

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('editInfo should enable edit mode and trigger pushTrackingEvent', async () => {
        render(<BillingAddressForm {...mockProps} />);

        const linkElement = screen.getByRole('link');
        expect(linkElement).toBeInTheDocument();
        expect(mockValidatableFieldComponent).not.toHaveBeenCalled();

        await userEvent.click(linkElement);

        expect(mockValidatableFieldComponent).toHaveBeenCalled();
        expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickEditBillingAddress);
    });

    it('should initialize initialStateRef when edit mode is enabled', async () => {
        render(<BillingAddressForm isDisabled={false} isOpen={false} />);

        const linkElement = screen.getByRole('link');
        await userEvent.click(linkElement); // Enable edit mode

        const initialStateRef = new BillingInfo('test', 'test1', 'test2', 'test3');
        expect(mockStores.payStore.billingInfo).toEqual(initialStateRef);
    });

    it('should detect form changes and set hasFormChanged to true', async () => {
        jest.mocked(equal).mockReturnValue(false);

        render(<BillingAddressForm isDisabled={false} isOpen={false} />);

        const linkElement = screen.getByRole('link');
        await userEvent.click(linkElement);

        mockStores.payStore.billingInfo.fullName = 'new name';

        await userEvent.click(linkElement);

        expect(equal).toHaveBeenCalledWith(expect.any(BillingInfo), mockStores.payStore.billingInfo);
        expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaUpdatedEditBillingAddress);
    });

    it('should NOT trigger pushTrackingEvent if NO changes were detected', async () => {
        jest.mocked(equal).mockReturnValue(true);

        render(<BillingAddressForm isDisabled={false} isOpen={false} />);

        const linkElement = screen.getByRole('link');
        await userEvent.click(linkElement);

        expect(mockPushTrackingEvent).not.toHaveBeenCalledWith(gaUpdatedEditBillingAddress);
    });

    it('should NOT reinitialize initialStateRef if it is already set', async () => {
        render(<BillingAddressForm isDisabled={false} isOpen={false} />);

        const linkElement = screen.getByRole('link');
        await userEvent.click(linkElement);

        const initialStateRef = new BillingInfo('test', 'test1', 'test2', 'test3');
        expect(mockStores.payStore.billingInfo).toEqual(initialStateRef);

        mockStores.payStore.billingInfo.fullName = 'another name';

        await userEvent.click(linkElement);

        expect(equal).toHaveBeenCalledWith(initialStateRef, mockStores.payStore.billingInfo);
    });
});
