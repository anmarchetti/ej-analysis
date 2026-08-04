import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import creditManagementService from 'frontend/services/creditManagement.service';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { validationErrorOnBlurMock } from 'frontend/components/renderings/PromocodeInput/__mocks__/promocodeInput.mocks';

import PromocodeForm, { IPromocodeFormProps } from './PromocodeForm';

jest.mock('frontend/services/creditManagement.service', () => ({
    validateVoucherCode: jest.fn(),
}));

const mockValidatableFieldProps = jest.fn();
let mockOnChange: jest.Mock;
jest.mock('frontend/components/common/ValidatableField/ValidatableField', () => ({
    __esModule: true,
    default: ({ onChange, onError, iconToRender, ...restProps }) => {
        mockValidatableFieldProps(restProps);
        mockOnChange = onChange;

        return (
            <div>
                {iconToRender}
                <button data-tid='validatable-fields-change' onClick={() => onChange('typed promocode')} />
                <button data-tid='validatable-fields-error' onClick={() => onError('wrong promocode')} />
            </div>
        );
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, ...restProps }) => {
        mockButtonProps(restProps);

        return (
            <button data-tid='button' onClick={onClick}>
                {children}
            </button>
        );
    },
}));

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: () => <div data-tid='tooltip-trigger' />,
    TooltipContent: ({ children }) => <div data-tid='tooltip-content'>{children}</div>,
}));

const mockPromocodeErrors = jest.fn();
jest.mock('frontend/components/renderings/PromocodeInput/components/PromocodeErrors/PromocodeErrors', () => ({
    __esModule: true,
    default: props => {
        mockPromocodeErrors(props);

        return <div data-tid='promocode-errors' />;
    },
}));

const createProps = (): IPromocodeFormProps => ({
    codeFromInput: 'codeFromInput',
    label: 'Promo code or gift card test',
    tooltipText:
        'Please note that promo codes are case sensitive. Please enter your code exactly as you received it. test',
    setCodeFromInput: jest.fn(),
    clearPromo: jest.fn(),
});

const createStores = () =>
    createMockStores({
        bookingStore: {
            onApplyPromoCode: jest.fn(),
            promoCode: {
                isPromocodeApplying: false,
                promocodeForceError: false,
                promocodeValidationErrors: [validationErrorOnBlurMock],
                clearPromoCode: jest.fn(),
                setIsPromocodeApplying: jest.fn(),
                clearPromocodeError: jest.fn(),
                onPromocodeErrorCallback: jest.fn(),
            },
        },
        trackingStore: { trackValidation: jest.fn() },
        holidayCreditStore: { isCreditEnabledApiSettings: true },
        redeemVoucherStore: {
            cleanupRedeemStore: jest.fn(),
            initiateVoucherExtrasFlow: jest.fn(),
        },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PromocodeForm />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockValidatableFieldProps.mockClear();
        mockButtonProps.mockClear();
        mockPromocodeErrors.mockClear();
    });

    it('should render default', () => {
        render(<PromocodeForm {...mockProps} />);

        expect(mockValidatableFieldProps).toHaveBeenCalledWith({
            label: mockProps.label,
            value: mockProps.codeFromInput,
            name: 'promoCode',
            autoComplete: false,
            isVertical: true,
            errors: [validationErrorOnBlurMock],
            notShowValidIcon: true,
            forceError: false,
            hideErrorDetails: true,
            id: 'promoCode',
            disabled: false,
        });
        expect(mockButtonProps).toHaveBeenNthCalledWith(1, {
            className: 'btn-clear-input',
            isText: true,
        });
        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(SitecoreDictionary.GlobalsButtonsApply);
        expect(mockStores.layoutStore.getPhrase).not.toHaveBeenCalledWith(
            SitecoreDictionary.PaymentErrorMessagesCantUsePromocode,
        );
        expect(mockPromocodeErrors).not.toHaveBeenCalled();
        expect(mockButtonProps).toHaveBeenNthCalledWith(2, {
            isFullWidth: true,
            isLoading: false,
            className: 'applyButton',
            disabled: false,
            type: 'submit',
        });
        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(SitecoreDictionary.GlobalsButtonsApply);
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
        expect(screen.getByText(mockProps.tooltipText)).toBeInTheDocument();
    });

    it('should render warning when isCreditEnabledApiSettings is false', () => {
        mockStores.holidayCreditStore.isCreditEnabledApiSettings = false;

        render(<PromocodeForm {...mockProps} />);

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(
            SitecoreDictionary.PaymentErrorMessagesCantUsePromocode,
        );

        expect(mockButtonProps).toHaveBeenNthCalledWith(2, {
            isFullWidth: true,
            isLoading: false,
            className: 'applyButton',
            disabled: true,
            type: 'submit',
        });
    });

    it('should render PromocodeErrors when error triggered', async () => {
        render(<PromocodeForm {...mockProps} />);

        await userEvent.click(screen.getByTestId('validatable-fields-error'));

        expect(creditManagementService.validateVoucherCode).toHaveBeenCalledWith('codeFromInput');
        expect(mockPromocodeErrors).toHaveBeenCalledWith({
            errorText: 'wrong promocode',
        });
    });

    it('should call setCodeFromInput AND onApplyPromo on validatable field change', async () => {
        render(<PromocodeForm {...mockProps} />);

        await userEvent.click(screen.getByTestId('validatable-fields-change'));

        expect(mockStores.bookingStore.promoCode.onPromocodeErrorCallback).toHaveBeenCalled();
        expect(mockProps.setCodeFromInput).toHaveBeenCalledWith('typed promocode');
        expect(mockStores.bookingStore.promoCode.clearPromocodeError).not.toHaveBeenCalled();
    });

    it('should call onApply when PROMO_VOUCHER applied', async () => {
        creditManagementService.validateVoucherCode = jest
            .fn()
            .mockReturnValueOnce(Promise.resolve({ voucherType: 'PROMO_VOUCHER' }));

        render(<PromocodeForm {...mockProps} />);

        await userEvent.click(screen.getByTestId('validatable-fields-change'));

        expect(mockStores.bookingStore.onApplyPromoCode).toHaveBeenCalledWith(
            'codeFromInput',
            expect.any(Function),
            mockStores.bookingStore.promoCode.onPromocodeErrorCallback,
        );
    });

    it('should call initiateVoucherExtrasFlow when GIFT_VOUCHER applied', async () => {
        creditManagementService.validateVoucherCode = jest
            .fn()
            .mockReturnValueOnce(Promise.resolve({ voucherType: 'GIFT_VOUCHER' }));

        render(<PromocodeForm {...mockProps} />);

        await userEvent.click(screen.getByTestId('validatable-fields-change'));

        expect(mockStores.bookingStore.promoCode.clearPromocodeError).toHaveBeenCalled();
        expect(mockStores.redeemVoucherStore.initiateVoucherExtrasFlow).toHaveBeenCalledWith({
            voucherType: 'GIFT_VOUCHER',
        });
        expect(mockStores.bookingStore.promoCode.setIsPromocodeApplying).toHaveBeenCalledWith(false);
    });

    it('should call setCodeFromInput, clearError, AND onApplyPromo on validatable field change when forceError is true', async () => {
        mockStores.bookingStore.promoCode.promocodeForceError = true;

        render(<PromocodeForm {...mockProps} />);

        await userEvent.click(screen.getByTestId('validatable-fields-change'));

        expect(mockStores.bookingStore.promoCode.clearPromocodeError).toHaveBeenCalled();
    });

    it('should clear promocode errors when input becomes empty and has validation errors', () => {
        mockStores.bookingStore.promoCode.promocodeForceError = false;
        mockStores.bookingStore.promoCode.promocodeValidationErrors = [validationErrorOnBlurMock];

        render(<PromocodeForm {...mockProps} />);

        mockOnChange('');

        expect(mockStores.bookingStore.promoCode.clearPromocodeError).toHaveBeenCalled();
        expect(mockProps.setCodeFromInput).toHaveBeenCalledWith('');
    });

    it('should NOT clear promocode errors when input has value even with validation errors', () => {
        mockStores.bookingStore.promoCode.promocodeForceError = false;
        mockStores.bookingStore.promoCode.promocodeValidationErrors = [validationErrorOnBlurMock];

        render(<PromocodeForm {...mockProps} />);

        mockOnChange('TESTCODE');

        expect(mockStores.bookingStore.promoCode.clearPromocodeError).not.toHaveBeenCalled();
        expect(mockProps.setCodeFromInput).toHaveBeenCalledWith('TESTCODE');
    });

    it('should NOT clear promocode errors when input becomes empty but has no validation errors', () => {
        mockStores.bookingStore.promoCode.promocodeForceError = false;
        mockStores.bookingStore.promoCode.promocodeValidationErrors = [];

        render(<PromocodeForm {...mockProps} />);

        mockOnChange('');

        expect(mockStores.bookingStore.promoCode.clearPromocodeError).not.toHaveBeenCalled();
        expect(mockProps.setCodeFromInput).toHaveBeenCalledWith('');
    });

    it('should NOT render tooltip when tooltipText is not provided', () => {
        mockProps.tooltipText = undefined;

        render(<PromocodeForm {...mockProps} />);

        expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
        expect(screen.queryByTestId('tooltip-trigger')).not.toBeInTheDocument();
        expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument();
    });
});
