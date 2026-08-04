import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import isBackend from 'frontend/utils/isBackend';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { PromoCodeVariant } from 'models/enum/PromoCodeVariant';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { priceBreakdownMock, validationErrorOnBlurMock } from './__mocks__/promocodeInput.mocks';
import PromoCodeInput from './PromocodeInput';

jest.mock('frontend/utils/isBackend');

const mockedGetPromocodeErrors = jest.fn().mockImplementation(() => [validationErrorOnBlurMock]);
jest.mock('frontend/components/renderings/PromocodeInput/promocodeInput.utils', () => ({
    getPromocodeErrors: (...params) => mockedGetPromocodeErrors(...params),
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

const mockPromocodeForm = jest.fn();
jest.mock('./components/PromocodeForm/PromocodeForm', () => ({
    __esModule: true,
    default: ({ clearPromo, clearError, setCodeFromInput, setError, setIsApplying, ...restProps }) => {
        mockPromocodeForm(restProps);

        return (
            <div data-tid='promocode-form'>
                <button data-tid='clear-promo-trigger' onClick={clearPromo} />
                <button data-tid='set-code-trigger' onClick={() => setCodeFromInput('promocode by trigger')} />
            </div>
        );
    },
}));

const mockErrorMessageProps = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: ({ icon, ...restProps }) => {
        mockErrorMessageProps(restProps);

        return <div data-tid='error-message' />;
    },
}));

const mockGreatNewsBannerProps = jest.fn();
jest.mock('frontend/components/renderings/PromocodeInput/components/GreatNewsBanner/GreatNewsBanner', () => ({
    __esModule: true,
    default: props => {
        mockGreatNewsBannerProps(props);

        return <div data-tid='great-news-banner' />;
    },
}));

const createProps = () => ({
    fields: {
        IconGreatNewsBanner: mockSitecoreField(mockSitecoreImageField('source')),
        TextGreatNewsBanner: mockSitecoreField('TextGreatNewsBanner'),
        TitleGreatNewsBanner: mockSitecoreField('TitleGreatNewsBanner'),
        Subtitle: mockSitecoreField('I have a promo code or gift card. test'),
        AppliedLabel: mockSitecoreField('{content} was successfully applied test'),
    },
    params: {
        Variant: PromoCodeVariant.NoDropDown,
    },
    rendering: {},
});

const createStores = () =>
    createMockStores({
        bookingStore: {
            priceBreakdown: [],
            packageInfo: null,
            promoCode: {
                isPromocodeApplying: false,
                promocodeValidationErrors: [],
                clearPromocodeError: jest.fn(),
                setPromocodeError: jest.fn(),
            },
        },
        layoutStore: { isPromoCodeEnabled: true, isExtrasPage: true },
        redeemVoucherStore: {
            isCreditRedeemedOnExtrasPage: false,
            error: validationErrorOnBlurMock,
            setIsCreditRedeemedOnExtrasPage: jest.fn(),
        },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PromoCodeInput />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        jest.mocked(isBackend).mockReturnValue(false);
        sessionStorage.setItem(WebStorageKeys.IsVoucherRedeemedBookingFlow, '');
    });

    it('should render default', () => {
        render(<PromoCodeInput {...mockProps} />);

        expect(screen.getByText(mockProps.fields.Subtitle.value)).toBeInTheDocument();
        expect(mockPromocodeForm).toHaveBeenCalledWith({
            codeFromInput: '',
        });

        expect(mockErrorMessageProps).not.toHaveBeenCalled();
        expect(mockButtonProps).not.toHaveBeenCalled();
        expect(mockGreatNewsBannerProps).not.toHaveBeenCalled();
    });

    it('should skip render when isPromoCodeEnabled is false', () => {
        mockStores.layoutStore.isPromoCodeEnabled = false;

        const { container } = render(<PromoCodeInput {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should skip render when promocode is specific', () => {
        mockStores.bookingStore.priceBreakdown = [priceBreakdownMock];

        const { container } = render(<PromoCodeInput {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render applied promocode', () => {
        mockStores.bookingStore.promoCode.value = 'ADULTONE';

        render(<PromoCodeInput {...mockProps} />);

        expect(mockErrorMessageProps).toHaveBeenCalledWith({
            dataTid: 'promocode-applied-success-message',
            errorMessageClass: 'successLabel',
            message: 'ADULTONE was successfully applied test',
            IsSuccess: true,
        });

        expect(screen.queryByText(SitecoreDictionary.PaymentLabelsHavePromoCode)).not.toBeInTheDocument();
        expect(mockButtonProps).not.toHaveBeenCalled();
        expect(mockPromocodeForm).not.toHaveBeenCalled();
        expect(mockGreatNewsBannerProps).not.toHaveBeenCalled();
    });

    it('should render promo banner', () => {
        sessionStorage.setItem(WebStorageKeys.IsVoucherRedeemedBookingFlow, 'true');

        render(<PromoCodeInput {...mockProps} />);

        expect(mockGreatNewsBannerProps).toHaveBeenCalledWith({ fields: mockProps.fields });
    });

    it('should NOT render promo banner on backend side', () => {
        sessionStorage.setItem(WebStorageKeys.IsVoucherRedeemedBookingFlow, 'true');
        jest.mocked(isBackend).mockReturnValueOnce(true);

        render(<PromoCodeInput {...mockProps} />);

        expect(mockGreatNewsBannerProps).not.toHaveBeenCalled();
    });

    describe('dropdown mode', () => {
        beforeEach(() => {
            mockProps.params.Variant = PromoCodeVariant.DropDown;
        });

        it('should render default', () => {
            render(<PromoCodeInput {...mockProps} />);

            expect(screen.getByText(mockProps.fields.Subtitle.value)).toBeInTheDocument();
            expect(mockButtonProps).toHaveBeenCalledWith({
                'aria-controls': undefined,
                'aria-expanded': false,
                className: 'button',
                isLink: true,
                isText: true,
            });

            expect(mockPromocodeForm).not.toHaveBeenCalled();
            expect(mockErrorMessageProps).not.toHaveBeenCalled();
            expect(mockGreatNewsBannerProps).not.toHaveBeenCalled();
            expect(mockStores.layoutStore.getPhrase).not.toHaveBeenCalledWith(
                SitecoreDictionary.PaymentLabelsPromoCodeApplied,
            );
        });

        it('should render PromocodeForm when dropdown expanded', async () => {
            render(<PromoCodeInput {...mockProps} />);

            await userEvent.click(screen.getByTestId('button'));

            expect(mockPromocodeForm).toHaveBeenCalledWith({
                codeFromInput: '',
            });
        });
    });

    it('should render set and clean promocode', async () => {
        render(<PromoCodeInput {...mockProps} />);

        await userEvent.click(screen.getByTestId('set-code-trigger'));

        expect(mockPromocodeForm).toHaveBeenNthCalledWith(2, {
            codeFromInput: 'promocode by trigger',
        });

        await userEvent.click(screen.getByTestId('clear-promo-trigger'));

        expect(mockPromocodeForm).toHaveBeenNthCalledWith(3, {
            codeFromInput: '',
        });
    });

    it('should clear promocode errors when input field is empty and has validation errors', () => {
        mockStores.bookingStore.promoCode.promocodeValidationErrors = [validationErrorOnBlurMock];

        render(<PromoCodeInput {...mockProps} />);

        expect(mockStores.bookingStore.promoCode.clearPromocodeError).toHaveBeenCalled();
    });

    it('should NOT clear promocode errors when input field has value', () => {
        mockStores.bookingStore.promoCode.promocodeValidationErrors = [validationErrorOnBlurMock];
        mockStores.bookingStore.promoCode.value = 'TESTCODE';

        render(<PromoCodeInput {...mockProps} />);

        expect(mockStores.bookingStore.promoCode.clearPromocodeError).not.toHaveBeenCalled();
    });

    it('should NOT clear promocode errors when input field is empty but has no validation errors', () => {
        mockStores.bookingStore.promoCode.promocodeValidationErrors = [];

        render(<PromoCodeInput {...mockProps} />);

        expect(mockStores.bookingStore.promoCode.clearPromocodeError).not.toHaveBeenCalled();
    });

    it('should NOT clear promocode errors when input field is empty but there is a merchandised promotion on Extras page', () => {
        mockStores.bookingStore.promoCode.promocodeValidationErrors = [validationErrorOnBlurMock];
        mockStores.layoutStore.isExtrasPage = true;
        mockStores.bookingStore.merchandisedPromotion = { title: 'MERCHANDISED10' };

        render(<PromoCodeInput {...mockProps} />);

        expect(mockStores.bookingStore.promoCode.clearPromocodeError).not.toHaveBeenCalled();
    });
});
