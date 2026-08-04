import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import { mockLuggageListFields } from 'frontend/__mocks__/luggage';
import { IPaymentFailureItem } from 'frontend/store/holidays/payment/payment-failures.config';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IPaymentAuthorization } from 'models/data/payment/IPaymentAuthorization';
import { IPaymentAuthorizationCode } from 'models/enum/IPaymentAuthorizationCode';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import {
    gaBalancePaymentSuccess,
    gaClickPayBalancePage,
    gaPaymentError,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentInitialization } from 'frontend/components/renderings/Payment/usePaymentInitialization';

import { PayBalance } from './PayBalance';

jest.mock('frontend/components/renderings/PayBalance/components/ThanksBalancePayment/ThanksBalancePayment', () => ({
    __esModule: true,
    default: () => <div>ThanksBalancePayment</div>,
}));

jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: () => <div>OverlaySpinner</div>,
}));

jest.mock('frontend/components/renderings/Payment/components/PaymentForm', () => ({
    __esModule: true,
    default: () => <div>PaymentForm</div>,
}));
jest.mock('frontend/components/renderings/Payment/components/ThreeDSecure/ThreeDSecure', () => ({
    __esModule: true,
    default: () => <div>ThreeDSecure</div>,
}));
const mockPayBlockProps = jest.fn();

jest.mock('frontend/components/renderings/Payment/components/PayBlock/PayBlock', () => ({
    __esModule: true,
    default: (props: any) => {
        mockPayBlockProps(props);
        const { onPay } = props;

        return (
            <button onClick={onPay} data-tid='pay-block'>
                PayBlock
            </button>
        );
    },
}));

jest.mock('frontend/components/common/AmountForPay', () => ({
    __esModule: true,
    default: () => <div>AmountForPay</div>,
}));
const mockBookingDetails = jest.fn();
jest.mock('frontend/components/renderings/Payment/components/BookingDetails/BookingDetails', () => ({
    __esModule: true,
    default: props => {
        mockBookingDetails(props);

        return <div data-tid='booking-details' />;
    },
}));
jest.mock('frontend/components/common/BackToPage', () => ({
    __esModule: true,
    default: () => <div>BackToPage</div>,
}));

const mockPushTrackingEvent = jest.fn();

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

jest.mock('frontend/components/renderings/Payment/usePaymentInitialization');

const mockUsePaymentInitialization = jest.mocked(usePaymentInitialization);

const departureDate = 'test';
const countryName = 'test';
const bookingReference = 'test';
const flightReference = 'test';

const createStores = () => ({
    queryParamsStore: {
        getPhrase: jest.fn(),
    },
    layoutStore: {
        getPhrase: jest.fn(k => k),
        getSettingAsBoolean: jest.fn(() => false),
    },
    payStore: {
        setAmount: jest.fn(),
        paymentAuthorization: null as Nullable<IPaymentAuthorization>,
        requirePaymentAuthorization: false,
        amountToPay: 100,
        amount: 100,
        usedCredit: 0,
        fatalPaymentError: false,
        transferErrors: [] as IPaymentFailureItem[],
        currency: CurrencyCode.GBP,
    } as any,
    trackingStore: {
        getTrackPaymentData: jest.fn(),
    },
    payBalanceStore: {
        initialize: jest.fn(),
        reinitializeAfterLogin: jest.fn(),
        canPay: true,
        booking: {
            package: {
                accom: {
                    hotel: {
                        name: '',
                        country: {
                            name: countryName,
                        },
                        location: {
                            name: '',
                        },
                        region: {
                            name: '',
                        },
                    },
                    rooms: [],
                },
                transport: {
                    routes: [
                        {
                            extRefId: flightReference,
                            depDate: departureDate,
                        },
                    ],
                },
                location: {
                    region: '',
                },
            },
            guests: [],
            bookingReference,
            paymentInfo: {
                currency: CurrencyCode.CHF,
            },
        } as any,
        payRemainingBalance: jest.fn(),
        remainingAmount: 0,
        isPaying: false,
        isPaySuccess: false,
        goBackToViewBooking: jest.fn(),
        paidDetails: {
            creditAmount: 0,
        },
        isFromCheckAndConfirm: false,
    },
    paymentTypeStore: {
        setApplePayUnavailable: jest.fn(),
    },
});

let props;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const resetMocks = () =>
    ({
        fields: {
            PaymentDeny: mockSitecoreField('test'),
            AmountToPayByCard: mockSitecoreField('test'),

            PaymentImages: [],
            CvvInfo: mockSitecoreField(mockSitecoreImageField('image.png')),
            CvvInfoAMEX: mockSitecoreField(mockSitecoreImageField('image.png')),
            IssueNumberInfo: mockSitecoreField(mockSitecoreImageField('image.png')),

            ResidualBalance: mockSitecoreField(mockSitecoreImageField('image.png')),
            ShowInstalments: mockSitecoreField('test'),
            ...mockLuggageListFields,
        },
    } as any);

describe('<PayBalance />', () => {
    beforeEach(() => {
        props = resetMocks();
        mockStores = createStores();
    });

    it('should render ThreeDSecure component when booking is defined and isPaySuccess is false', () => {
        const { container } = render(<PayBalance {...props} />);

        expect(screen.queryByText('BackToPage')).toBeInTheDocument();
        expect(screen.getByRole('heading')).toHaveTextContent(SitecoreDictionary.PaymentTitlesPayYourBalance);
        expect(screen.getByTestId('booking-details')).toBeInTheDocument();
        expect(mockBookingDetails).toHaveBeenCalledWith({
            booking: mockStores.payBalanceStore.booking,
            className: 'mb-0',
            isPayRemaining: true,
            disableTouristTax: true,
            fields: props.fields,
        });
        expect(screen.queryByText('PaymentForm')).toBeInTheDocument();
        expect(container.querySelector('.mt-5.pb-3')).toBeInTheDocument();
        expect(screen.queryByText('PayBlock')).toBeInTheDocument();
    });

    it('should NOT render default when isPaySuccess is true', () => {
        mockStores.payBalanceStore.isPaySuccess = true;
        const { container } = render(<PayBalance {...props} />);

        expect(screen.queryByText('BackToPage')).not.toBeInTheDocument();
        expect(screen.queryByTestId('booking-details')).not.toBeInTheDocument();
        expect(mockBookingDetails).not.toHaveBeenCalled();
        expect(screen.queryByText('PaymentForm')).not.toBeInTheDocument();
        expect(container.querySelector('.mt-5.pb-3')).not.toBeInTheDocument();
        expect(screen.queryByText('PayBlock')).not.toBeInTheDocument();
        expect(screen.queryByText('ThreeDSecure')).not.toBeInTheDocument();
        expect(screen.queryByText('OverlaySpinner')).not.toBeInTheDocument();
        expect(screen.queryByText('AmountForPay')).not.toBeInTheDocument();
    });

    it('should NOT render default when no booking', () => {
        mockStores.payBalanceStore.booking = undefined;
        const { container } = render(<PayBalance {...props} />);

        expect(screen.queryByText('BackToPage')).not.toBeInTheDocument();
        expect(screen.queryByText('BookingDetails')).not.toBeInTheDocument();
        expect(screen.queryByText('PaymentForm')).not.toBeInTheDocument();
        expect(container.querySelector('.mt-5.pb-3')).not.toBeInTheDocument();
        expect(screen.queryByText('PayBlock')).not.toBeInTheDocument();
        expect(screen.queryByText('ThreeDSecure')).not.toBeInTheDocument();
        expect(screen.queryByText('OverlaySpinner')).not.toBeInTheDocument();
        expect(screen.queryByText('AmountForPay')).not.toBeInTheDocument();
    });

    it('should call initialize func', async () => {
        render(<PayBalance {...props} />);

        expect(mockUsePaymentInitialization).toHaveBeenCalled();
    });

    it('should push pay balance event with correct arguments when onPay is triggered', async () => {
        const { getByTestId } = render(<PayBalance {...props} />);

        const payNowButton = getByTestId('pay-block');

        await userEvent.click(payNowButton);

        expect(mockPushTrackingEvent).toHaveBeenCalledWith(
            gaClickPayBalancePage(
                mockStores.payBalanceStore.canPay,
                mockStores.payBalanceStore.remainingAmount,
                mockStores.payStore.amountToPay,
                mockStores.payStore.usedCredit,
            ),
        );
    });

    it('should push payment error event when transferErrors are present and onPay handler is called', async () => {
        mockStores.payStore.transferErrors = [
            { messageKey: 'error1', descriptionKey: 'Error 1 description', code: 'error', isFatal: true },
        ];

        render(<PayBalance {...props} />);

        const payNowButton = screen.getByTestId('pay-block');
        await userEvent.click(payNowButton);

        expect(mockPushTrackingEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                ...gaPaymentError,
            }),
        );
    });

    it('should not push payment error event when onPay was not triggered', async () => {
        mockStores.payStore.transferErrors = [
            { messageKey: 'error1', descriptionKey: 'Error 1 description', code: 'error', isFatal: true },
        ];

        render(<PayBalance {...props} />);

        expect(mockPushTrackingEvent).not.toHaveBeenCalled();
    });

    it('should NOT push payment error event when transferErrors are not present', () => {
        render(<PayBalance {...props} />);

        expect(mockPushTrackingEvent).not.toHaveBeenCalled();
    });

    describe('AmountForPay', () => {
        it('should NOT render AmountForPay component when isFromCheckAndConfirm is true', () => {
            mockStores.payBalanceStore.isFromCheckAndConfirm = true;
            render(<PayBalance {...props} />);

            expect(screen.queryByText('AmountForPay')).not.toBeInTheDocument();
        });

        it('should NOT render AmountForPay component when ShowInstalments value is not defined', () => {
            props.fields.ShowInstalments.value = undefined;
            render(<PayBalance {...props} />);

            expect(screen.queryByText('AmountForPay')).not.toBeInTheDocument();
        });

        it('should render AmountForPay component when isFromCheckAndConfirm is false and ShowInstalments value is defined', () => {
            const { getByText } = render(<PayBalance {...props} />);

            expect(getByText('AmountForPay')).toBeInTheDocument();
        });
    });

    describe('ThreeDSecure', () => {
        it('should NOT render ThreeDSecure component when isPaying is false', () => {
            render(<PayBalance {...props} />);

            expect(screen.queryByText('ThreeDSecure')).not.toBeInTheDocument();
        });

        it('should render ThreeDSecure component when isPaying is true', () => {
            mockStores.payStore.requirePaymentAuthorization = true;
            mockStores.payStore.paymentAuthorization = {
                resultCode: IPaymentAuthorizationCode.Identify,
                threeDSServerTransID: 'ThreeDSServerTransID',
                transactionReference: 'transactionReference',
                threeDSMethodURL: 'threeDSMethodURL',
                methodNotificationURL: 'methodNotificationURL',
                acsTransID: 'acsTransID',
                messageVersion: 'messageVersion',
                acsURL: 'acsURL',

                md: 'MD',
                paReq: 'PaReq',
                issuerUrl: 'issuerUrl',
                termUrl: 'termUrl',
                bookingReference: 'bookingReference',
                sessionId: 'sessionId',
                requestId: 'requestId',
            };
            const { getByText } = render(<PayBalance {...props} />);

            expect(getByText('ThreeDSecure')).toBeInTheDocument();
        });
    });

    describe('OverlaySpinner', () => {
        it('should NOT render OverlaySpinner component when isPaying is false', () => {
            render(<PayBalance {...props} />);

            expect(screen.queryByText('OverlaySpinner')).not.toBeInTheDocument();
        });

        it('should render OverlaySpinner component when isPaying is true', () => {
            mockStores.payBalanceStore.isPaying = true;
            const { getByText } = render(<PayBalance {...props} />);

            expect(getByText('OverlaySpinner')).toBeInTheDocument();
        });
    });

    describe('ThanksBalancePayment', () => {
        it('should render ThanksBalancePayment component when isPaySuccess is true', () => {
            mockStores.payBalanceStore.isPaySuccess = true;
            const { getByText } = render(<PayBalance {...props} />);

            expect(getByText('ThanksBalancePayment')).toBeInTheDocument();
        });

        it('should NOT render ThanksBalancePayment component when isPaySuccess is false', () => {
            render(<PayBalance {...props} />);

            expect(screen.queryByText('ThanksBalancePayment')).not.toBeInTheDocument();
        });
    });

    describe('useEffect for isPaySuccess', () => {
        it('should call pushTrackingEvent when isPaySuccess is true', () => {
            mockStores.payBalanceStore.isPaySuccess = true;
            mockStores.payBalanceStore.paidDetails = { creditAmount: 100 };
            mockStores.payBalanceStore.booking.bookingReference = '173654';

            render(<PayBalance {...props} />);

            expect(mockPushTrackingEvent).toHaveBeenCalledWith(
                gaBalancePaymentSuccess({ creditAmount: 100 }, CurrencyCode.GBP, '173654'),
            );
        });

        it('should NOT call pushTrackingEvent if isPaySuccess is false', () => {
            mockStores.payBalanceStore.isPaySuccess = false;

            render(<PayBalance {...props} />);

            expect(mockPushTrackingEvent).not.toHaveBeenCalled();
        });

        it('should call pushTrackingEvent with correct currency if it is included in payStore', () => {
            mockStores.payBalanceStore.isPaySuccess = true;
            mockStores.payBalanceStore.paidDetails = { creditAmount: 100 };
            mockStores.payBalanceStore.booking.bookingReference = '173654';

            render(<PayBalance {...props} />);

            expect(mockPushTrackingEvent).toHaveBeenCalledWith(
                gaBalancePaymentSuccess({ creditAmount: 100 }, CurrencyCode.GBP, '173654'),
            );
        });

        it('should call pushTrackingEvent with correct currency if it is not included in payStore but included in booking paymentInfo', () => {
            mockStores.payBalanceStore.isPaySuccess = true;
            mockStores.payBalanceStore.paidDetails = { creditAmount: 100 };
            mockStores.payStore.currency = undefined;
            mockStores.payBalanceStore.booking.bookingReference = '173654';

            render(<PayBalance {...props} />);

            expect(mockPushTrackingEvent).toHaveBeenCalledWith(
                gaBalancePaymentSuccess({ creditAmount: 100 }, CurrencyCode.CHF, '173654'),
            );
        });
    });

    describe('Apple Pay callbacks from PayBalance to PayBlock', () => {
        beforeEach(() => {
            mockPayBlockProps.mockClear();
        });

        it('should pass applePayPaymentValidation that reflects isBillingInfoValid = true', () => {
            (mockStores as any).payStore.isBillingInfoValid = true;
            render(<PayBalance {...props} />);

            const payBalanceProps = mockPayBlockProps.mock.calls.at(-1)?.[0];
            expect(typeof payBalanceProps.applePayPaymentFormValidation).toBe('function');
            expect(payBalanceProps.applePayPaymentFormValidation()).toBe(true);
        });

        it('should pass applePayPaymentValidation that reflects isBillingInfoValid = false', () => {
            (mockStores as any).payStore.isBillingInfoValid = false;

            render(<PayBalance {...props} />);

            const payBalanceProps = mockPayBlockProps.mock.calls.at(-1)?.[0];
            expect(typeof payBalanceProps.applePayPaymentFormValidation).toBe('function');

            expect(payBalanceProps.applePayPaymentFormValidation()).toBe(false);
        });

        it('should pass applePayPaymentAuthorization that calls payRemainingBalanceWithApplePay(event)', async () => {
            const evt = { payment: { token: { transactionIdentifier: 'tx' } } } as any;
            const spy = jest.fn();
            (mockStores as any).payBalanceStore.payRemainingBalanceWithApplePay = spy;

            render(<PayBalance {...props} />);

            const payBalanceProps = mockPayBlockProps.mock.calls.at(-1)?.[0];
            expect(typeof payBalanceProps.applePayPaymentAuthorization).toBe('function');

            await payBalanceProps.applePayPaymentAuthorization(evt);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(evt);
        });
    });
});
