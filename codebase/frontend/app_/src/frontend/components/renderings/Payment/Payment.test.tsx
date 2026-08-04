import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import { createMockStores, mockPaymentFields } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import { PaymentType } from 'models/enum/PaymentType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { gaClickToPayPaymentPage, gaPaymentError } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import { createPaymentPagePartialMockStores } from './__mocks__/createPaymentPagePartialMockStores';
import { Payment } from './Payment';
import { usePaymentInitialization } from './usePaymentInitialization';

const mockPushTrackingEvent = jest.fn();

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

const mockPayBlockComponent = jest.fn();

jest.mock('./components/PayBlock/PayBlock', () => ({
    __esModule: true,
    default: ({ onPay, ...props }) => {
        mockPayBlockComponent(props);

        return (
            <div data-tid='pay-block'>
                <button onClick={() => onPay()}>onPay</button>
            </div>
        );
    },
}));

const mockTouristTaxBannerComponent = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock', () => ({
    __esModule: true,
    default: props => {
        mockTouristTaxBannerComponent(props);

        return <div data-tid='tourist-tax-banner' />;
    },
}));

jest.mock('frontend/utils/ui.utils', () => ({
    __esModule: true,
    scrollToErrorBlock: jest.fn(),
    scrollToElementWithOffset: jest.fn(),
    setBodyOverflow: jest.fn(),
}));

const mockPaymentFormProps = jest.fn();
jest.mock('frontend/components/renderings/Payment/components/PaymentForm', () => ({
    __esModule: true,
    default: props => {
        mockPaymentFormProps(props);

        return <div data-tid='payment-form'>PaymentForm</div>;
    },
}));

const mockPaymentMethodsProps = jest.fn();
jest.mock('frontend/components/renderings/Payment/components/PaymentMethods', () => ({
    __esModule: true,
    default: props => {
        mockPaymentMethodsProps(props);

        return <div data-tid='payment-methods' />;
    },
}));

const mockThreeDSecureProps = jest.fn();
jest.mock('frontend/components/renderings/Payment/components/ThreeDSecure/ThreeDSecure', () => ({
    __esModule: true,
    default: props => {
        mockThreeDSecureProps(props);

        return <div data-tid='three-d-secure' />;
    },
}));

jest.mock('frontend/components/renderings/Payment/components/InfoBlock', () => ({
    __esModule: true,
    default: ({ children }) => (
        <div>
            InfoBlock
            {children}
        </div>
    ),
}));

jest.mock('frontend/components/renderings/Payment/components/ApplePay/ApplePayEnabler', () => ({
    __esModule: true,
    default: () => <div data-tid='apple-pay-enabler'>ApplePayEnabler</div>,
}));

jest.mock('next/dynamic', () => () => {
    const DynamicComponent = () => null;
    DynamicComponent.displayName = 'DynamicFeesPopupComponent';
    (DynamicComponent as any).preload = jest.fn();

    return DynamicComponent;
});

const createProps = () =>
    ({
        canPayDeposit: false,
        canPay: false,
        isPackageValid: false,
        packageInfo: null,
        initialize: jest.fn(() => {}),
        commitBooking: () => {},
        history: {},
        location: {},
        match: () => {},
        fields: mockPaymentFields,
        params: null,
        rendering: {},
        getPhrase: () => '',
        isHolidayDataAvailable: true,
        hasGuestInStorage: () => true,
        paymentErrors: [],
        isDeposit: undefined,
        usedCredit: 0,
        isTradePortal: false,
    } as any);

jest.mock('next/dynamic', () => () => {
    const DynamicComponent = () => null;
    DynamicComponent.displayName = 'DynamicFeesPopupComponent';
    DynamicComponent.preload = jest.fn();

    return DynamicComponent;
});

const createStores = () => createMockStores(createPaymentPagePartialMockStores());

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPaymentJumpPopup = jest.fn();
jest.mock('frontend/components/renderings/Payment/components/PaymentJumpPopup/PaymentJumpPopup.tsx', () => ({
    __esModule: true,
    default: props => {
        mockPaymentJumpPopup(props);

        return <div data-tid='payment-jump-popup' />;
    },
}));

jest.mock('frontend/components/renderings/Payment/usePaymentInitialization');

const mockUsePaymentInitialization = jest.mocked(usePaymentInitialization);

let props: any;

describe('Payment', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            trackingStore: {
                getTrackPaymentData: jest.fn(),
            },
            payStore: {
                isUseCreditActive: false,
                cardInfo: {},
            },
            paymentTypeStore: {
                setApplePayUnavailable: jest.fn(),
                selectedPaymentType: PaymentType.Card,
            },
            layoutStore: {
                isTradePortal: false,
                getSettingAsBoolean: jest.fn(),
            },
            guestDetailsStore: {
                hasGuestInStorage: jest.fn(() => false),
            },
            marketStore: {
                currency: CurrencyCode.GBP,
                getCurrencySymbol: jest.fn(() => '£'),
            },
            bookingStore: {
                packageInfo: null,
                isCommittingBooking: false,
                isHolidayDataAvailable: true,
                promoCode: { value: '' },
                commitBooking: jest.fn(),
                isTransfersHidden: false,
                commitApplePayBooking: jest.fn(),
                redirectToBookingConfirmation: jest.fn(),
                selectedOffer: mockedOffer,
                extraLuggage: {
                    totalHoldLuggageItemsNumber: 1,
                },
            },
            paymentStore: {
                clearPaymentUI: jest.fn(),
                canPay: true,
                confirmPolicy: true,
                shouldConfirmPolicy: false,
                initialize: jest.fn(),
                togglePolicy: jest.fn(),
                isDeposit: false,
                canPayDeposit: false,
            },
        });
    });

    it('should render payment type selector if canPayDeposit passed true', () => {
        mockStores.paymentStore.canPayDeposit = true;

        render(<Payment {...props} />);

        expect(screen.getByTestId('payment-methods')).toBeInTheDocument();
    });

    it('should not render when no data available', () => {
        mockStores.layoutStore.isTradePortal = true;
        props.isHolidayDataAvailable = false;

        const { container } = render(<Payment {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render when on Trade portal and no guest', () => {
        const props = createProps();
        mockStores.layoutStore.isTradePortal = true;
        mockStores.bookingStore.isHolidayDataAvailable = false;

        render(<Payment {...props} />);

        expect(mockUsePaymentInitialization).toHaveBeenCalled();
    });

    it('should call initialize func', async () => {
        render(<Payment {...props} />);

        expect(mockUsePaymentInitialization).toHaveBeenCalled();
    });

    it('should not render payment type selector if canPayDeposit passed false', () => {
        props.isPackageValid = true;
        props.packageInfo = {};
        props.canPayDeposit = false;

        render(<Payment {...props} />);

        expect(screen.queryByTestId('payment-methods')).not.toBeInTheDocument();
    });

    it('should not render 3D Secure block if payment authorization is not required', () => {
        props.canPayDeposit = true;
        props.requirePaymentAuthorization = false;

        render(<Payment {...props} />);

        expect(screen.queryByTestId('three-d-secure')).not.toBeInTheDocument();
    });

    it('should not render 3D Secure block if payment authorization is empty', () => {
        props.canPayDeposit = true;
        props.requirePaymentAuthorization = true;
        props.paymentAuthorization = null;

        render(<Payment {...props} />);

        expect(screen.queryByTestId('three-d-secure')).not.toBeInTheDocument();
    });

    it('should render 3D Secure block if payment authorization is required and not empty', () => {
        mockStores.payStore.requirePaymentAuthorization = true;
        mockStores.payStore.paymentAuthorization = {};
        mockStores.paymentStore.canPayDeposit = true;

        render(<Payment {...props} />);

        expect(screen.getByTestId('three-d-secure')).toBeInTheDocument();
        expect(mockThreeDSecureProps).toHaveBeenCalledWith(
            expect.objectContaining({ paymentAuthorization: mockStores.payStore.paymentAuthorization }),
        );
    });

    it('should not disable payment fields if payment authorization is not required', () => {
        mockStores.paymentStore.canPayDeposit = true;
        mockStores.payStore.requirePaymentAuthorization = false;

        render(<Payment {...props} />);

        expect(mockPaymentMethodsProps).toHaveBeenLastCalledWith(expect.objectContaining({ isDisabled: false }));
        expect(mockPaymentFormProps).toHaveBeenLastCalledWith(expect.objectContaining({ isDisabled: false }));
    });

    it('should not disable payment fields if payment authorization is empty', () => {
        mockStores.paymentStore.canPayDeposit = true;
        mockStores.payStore.requirePaymentAuthorization = true;
        mockStores.payStore.paymentAuthorization = null;

        render(<Payment {...props} />);

        expect(mockPaymentMethodsProps).toHaveBeenLastCalledWith(expect.objectContaining({ isDisabled: false }));
        expect(mockPaymentFormProps).toHaveBeenLastCalledWith(expect.objectContaining({ isDisabled: false }));
    });

    it('should disable payment fields if payment authorization is require and not empty', () => {
        mockStores.paymentStore.canPayDeposit = true;
        mockStores.payStore.requirePaymentAuthorization = true;
        mockStores.payStore.paymentAuthorization = {};

        render(<Payment {...props} />);

        expect(mockPaymentMethodsProps).toHaveBeenLastCalledWith(expect.objectContaining({ isDisabled: true }));
        expect(mockPaymentFormProps).toHaveBeenLastCalledWith(expect.objectContaining({ isDisabled: true }));
    });

    describe('Payment tracking', () => {
        it('should call analytics event for click to payment when onPay is triggered and button is not enabled', async () => {
            mockStores.paymentStore.canPay = false;

            render(<Payment {...props} />);

            const payBlock = screen.getByTestId('pay-block');
            const payNowButton = within(payBlock).getByRole('button', { name: 'onPay' });

            await userEvent.click(payNowButton);

            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickToPayPaymentPage(false));
        });

        it('should call analytics event with correct generic value when onPay is triggered and button is enabled', async () => {
            mockStores.paymentStore.canPay = true;

            render(<Payment {...props} />);

            const payBlock = screen.getByTestId('pay-block');
            const payNowButton = within(payBlock).getByRole('button', { name: 'onPay' });

            await userEvent.click(payNowButton);
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickToPayPaymentPage(true));
        });

        it('should call analytics event with correct generic value when data about deposit and credit is passed', async () => {
            const props = createProps();
            mockStores.paymentStore.canPay = true;
            mockStores.paymentStore.isDeposit = true;
            mockStores.payStore.usedCredit = 100;

            render(<Payment {...props} />);

            const payBlock = screen.getByTestId('pay-block');
            const payNowButton = within(payBlock).getByRole('button', { name: 'onPay' });

            await userEvent.click(payNowButton);
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickToPayPaymentPage(true, true, 100));
        });

        it('should NOT call analytics event for click to payment when onPay is not triggered', async () => {
            render(<Payment {...props} />);

            expect(mockPushTrackingEvent).not.toHaveBeenCalled();
        });

        it('should call analytics event for payment error when transferErrors are present', async () => {
            props.transferErrors = [
                { messageKey: 'error1', descriptionKey: 'Error 1 description' },
                { messageKey: 'error2', descriptionKey: 'Error 2 description' },
            ];

            render(<Payment {...props} />);

            const payBlock = screen.getByTestId('pay-block');
            const payNowButton = within(payBlock).getByRole('button', { name: 'onPay' });

            await userEvent.click(payNowButton);

            expect(mockPushTrackingEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...gaPaymentError,
                }),
            );
        });

        it('should NOT call analytics event for payment error when transferErrors are present', () => {
            render(<Payment {...props} />);

            expect(mockPushTrackingEvent).not.toHaveBeenCalled();
        });

        it('should render PaymentJumpPopup with correct data', () => {
            const props = createProps();

            render(<Payment {...props} />);

            expect(screen.getByTestId('payment-jump-popup')).toBeInTheDocument();
            expect(mockPaymentJumpPopup).toHaveBeenCalledWith({
                acceptButton: props.fields.PriceJumpPopupAccept,
                declineButton: props.fields.PriceJumpPopupDecline,
                description: props.fields.PriceJumpPopupDescription,
                title: props.fields.PriceJumpPopupTitle,
            });
        });
    });

    describe('Page Title', () => {
        it('should render title when isFLightPlusHotelFunnel is false', () => {
            render(<Payment {...props} />);

            expect(screen.getByText(SitecoreDictionary.PaymentTitlesBookHoliday)).toBeInTheDocument();
        });

        it('should NOT render title when isFLightPlusHotelFunnel is true', () => {
            mockStores.queryParamStore.isFlightPlusHotelFunnel = true;

            render(<Payment {...props} />);

            expect(screen.queryByText(SitecoreDictionary.PaymentTitlesBookHoliday)).not.toBeInTheDocument();
        });
    });

    describe('ApplePay', () => {
        it('should render ApplePayEnabler when not in Trade Portal', () => {
            const props = createProps();
            mockStores.layoutStore.isTradePortal = false;

            render(<Payment {...props} />);

            expect(screen.getByTestId('apple-pay-enabler')).toBeInTheDocument();
        });

        it('should NOT render ApplePayEnabler when in Trade Portal', () => {
            const props = createProps();
            mockStores.layoutStore.isTradePortal = true;

            render(<Payment {...props} />);

            expect(screen.queryByTestId('apple-pay-enabler')).not.toBeInTheDocument();
        });

        describe('Apple Pay callbacks in Payment', () => {
            const getLastPayBlockProps = () => {
                const lastCall = mockPayBlockComponent.mock.calls[mockPayBlockComponent.mock.calls.length - 1];

                return lastCall?.[0] || {};
            };

            beforeEach(() => {
                mockPayBlockComponent.mockClear();
                mockPushTrackingEvent.mockClear();
            });

            it('should call commitApplePayBooking on authorization', async () => {
                const props = createProps();
                mockStores.bookingStore.commitApplePayBooking = jest.fn().mockResolvedValue({ ok: true });
                mockStores.payStore.isBillingInfoValid = true;
                mockStores.paymentStore.confirmPolicy = true;

                render(<Payment {...props} />);

                const { applePayPaymentAuthorization } = getLastPayBlockProps();
                expect(typeof applePayPaymentAuthorization).toBe('function');

                const mockPayment = {
                    token: { paymentData: 'data' },
                    paymentMethod: { network: 'Visa' },
                };

                await applePayPaymentAuthorization({ payment: mockPayment } as any);

                expect(mockStores.bookingStore.commitApplePayBooking).toHaveBeenCalledTimes(1);
                expect(mockStores.bookingStore.commitApplePayBooking).toHaveBeenCalledWith(mockPayment);
            });

            it('should call redirectToBookingConfirmation on redirect', () => {
                const props = createProps();

                render(<Payment {...props} />);

                const { applePayRedirect } = getLastPayBlockProps();
                expect(typeof applePayRedirect).toBe('function');

                const bookingBody = { bookingReference: 'ABC123' } as any;
                applePayRedirect(bookingBody);

                expect(mockStores.bookingStore.redirectToBookingConfirmation).toHaveBeenCalledTimes(1);
                expect(mockStores.bookingStore.redirectToBookingConfirmation).toHaveBeenCalledWith(bookingBody);
            });
        });
    });

    describe('Pay button disabled-state behaviour', () => {
        const clickPayButton = async () => {
            const payNowButton = within(screen.getByTestId('pay-block')).getByRole('button', { name: 'onPay' });
            await userEvent.click(payNowButton);
        };

        beforeEach(() => {
            mockStores.bookingStore.commitBooking = jest.fn();
            mockStores.payStore.onForceErrors = jest.fn();
        });

        it('when form is invalid (paymentStore.canPay=false), clicking Pay calls commitBooking with force=false — the guard in the store validates and blocks the API call', async () => {
            // paymentStore.canPay=false → button has hasDisabledStyles (visually disabled)
            // but the button is NOT truly disabled, so onClick fires and commitBooking is reached.
            // force=false ensures the internal guard (canPay check + onForceErrors) applies.
            mockStores.paymentStore.canPay = false;

            render(<Payment {...props} />);
            await clickPayButton();

            expect(mockStores.bookingStore.commitBooking).toHaveBeenCalledWith(undefined, false);
        });

        it('when form is invalid, clicking Pay does NOT call commitBooking with force=true — the validation guard must not be bypassed', async () => {
            mockStores.paymentStore.canPay = false;

            render(<Payment {...props} />);
            await clickPayButton();

            expect(mockStores.bookingStore.commitBooking).not.toHaveBeenCalledWith(expect.anything(), true);
        });

        it('when billing info is valid but T&C not accepted, clicking Pay scrolls to T&C error and does NOT call commitBooking', async () => {
            // isPaymentInformationValid (payStore.canPay) = true
            // isConfirmPolicyValid (shouldConfirmPolicy === false) = false → shouldConfirmPolicy=true means T&C not accepted
            mockStores.payStore.canPay = true;
            mockStores.paymentStore.shouldConfirmPolicy = true;

            render(<Payment {...props} />);
            await clickPayButton();

            expect(scrollToErrorBlock).toHaveBeenCalled();
            expect(mockStores.bookingStore.commitBooking).not.toHaveBeenCalled();
        });
    });

    describe('Banner', () => {
        it('should render when isTouristTaxEnabled is true and touristTax is 0', () => {
            mockStores.layoutStore.isTouristTaxEnabled = true;
            mockStores.bookingStore.selectedOffer.touristTax = 0;

            const props = createProps();

            render(<Payment {...props} />);

            expect(mockTouristTaxBannerComponent).toHaveBeenCalledWith({
                contentClass: 'content',
                iconClass: 'icon',
                text: mockSitecoreField('TouristTaxNoPaymentRequiredBannerText'),
                title: mockSitecoreField('TouristTaxNoPaymentRequiredBannerTitle'),
            });
            expect(screen.getByTestId('tourist-tax-banner')).toBeInTheDocument();
        });

        it('should render when isTouristTaxEnabled is true and touristTax is 10', () => {
            mockStores.layoutStore.isTouristTaxEnabled = true;
            mockStores.bookingStore.selectedOffer.touristTax = 10;

            const props = createProps();

            render(<Payment {...props} />);

            expect(mockTouristTaxBannerComponent).toHaveBeenCalledWith({
                contentClass: 'content',
                iconClass: 'icon',
                text: mockSitecoreField('TouristTaxPaymentRequiredBannerText'),
                title: mockSitecoreField('TouristTaxPaymentRequiredBannerTitle'),
            });
            expect(screen.getByTestId('tourist-tax-banner')).toBeInTheDocument();
        });

        it('should NOT render when isTouristTaxEnabled is true and touristTax is -1', () => {
            mockStores.layoutStore.isTouristTaxEnabled = true;
            mockStores.bookingStore.selectedOffer.touristTax = -1;

            const props = createProps();

            render(<Payment {...props} />);

            expect(screen.queryByTestId('tourist-tax-banner')).toBeNull();
        });

        it('should NOT render when isTouristTaxEnabled is false', () => {
            mockStores.layoutStore.isTouristTaxEnabled = false;

            const props = createProps();

            render(<Payment {...props} />);

            expect(screen.queryByTestId('tourist-tax-banner')).toBeNull();
        });
    });
});
