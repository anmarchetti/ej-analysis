import { CurrencyCode } from 'code/currency';
import { BookingStore } from 'frontend/store/holidays/booking/BookingStore';
import { IPaymentFailureItem } from 'frontend/store/holidays/payment/payment-failures.config';
import TrackingStore from 'frontend/store/holidays/tracking/TrackingStore';
import { ITradePortalPaymentFailureItem } from 'frontend/store/tradePortal/payment/payment-failures.config';
import { BillingInfo } from 'models/data/payment/BillingInfo';
import { CardInfo } from 'models/data/payment/CardInfo';
import { PaymentType } from 'models/enum/PaymentType';

export interface IPaymentPagePartialMockStores {
    airportParkingStore: Partial<{
        selectedAirportParking: object;
    }>;
    bookingStore: Partial<{
        commitApplePayBooking: jest.Mock;
        commitBooking: jest.Mock;
        isHolidayDataAvailable: boolean;
        promoCode: Pick<BookingStore['promoCode'], 'value'>;
        redirectToBookingConfirmation: jest.Mock;
    }>;
    guestDetailsStore: Partial<{
        hasGuestInStorage: jest.Mock;
    }>;
    layoutStore: Partial<{
        getPhrase: jest.Mock;
        getSettingAsBoolean: jest.Mock;
        isTradePortal: boolean;
    }>;
    marketStore: Partial<{
        currency: CurrencyCode;
        formatMoney: jest.Mock;
        getCurrencySymbol: jest.Mock;
    }>;
    payStore: Partial<{
        billingInfo: BillingInfo;
        canPay: boolean;
        cardInfo: CardInfo;
        isBillingInfoValid: boolean;
        isPaymentAllowed: boolean;
        isUseCreditActive: boolean;
        onForceErrors: jest.Mock;
        paymentAuthorization: boolean;
        paymentErrors: (IPaymentFailureItem | ITradePortalPaymentFailureItem)[];
        requirePaymentAuthorization: boolean;
        toggleFocusBillingAddressBlock: jest.Mock;
        toggleFocusPaymentBlock: jest.Mock;
        transferErrors: (IPaymentFailureItem | ITradePortalPaymentFailureItem)[];
        usedCredit: number;
    }>;
    paymentStore: Partial<{
        canPay: boolean;
        canPayDeposit: boolean;
        clearPaymentUI: jest.Mock;
        confirmPolicy: boolean;
        initialize: jest.Mock;
        isDeposit: boolean;
        shouldConfirmPolicy: boolean;
        togglePolicy: jest.Mock;
    }>;
    paymentTypeStore: Partial<{
        paymentTypes: PaymentType[];
        selectedPaymentType: PaymentType;
        setApplePayUnavailable: jest.Mock;
        setSelectedPaymentType: jest.Mock;
    }>;
    routerStore: Partial<{
        referralUrl: string;
    }>;
    trackingStore: Partial<Pick<TrackingStore, 'getTrackPaymentData'>>;
}

export const createPaymentPagePartialMockStores = (): IPaymentPagePartialMockStores => ({
    airportParkingStore: {
        selectedAirportParking: {},
    },
    bookingStore: {
        commitBooking: jest.fn(),
        isHolidayDataAvailable: true,
        promoCode: { value: '' },
        redirectToBookingConfirmation: jest.fn(),
        commitApplePayBooking: jest.fn(),
    },
    trackingStore: {
        getTrackPaymentData: jest.fn(),
    },
    paymentTypeStore: {
        selectedPaymentType: PaymentType.ApplePay,
        paymentTypes: [PaymentType.ApplePay, PaymentType.Card],
        setApplePayUnavailable: jest.fn(),
        setSelectedPaymentType: jest.fn(),
    },
    payStore: {
        isUseCreditActive: false,
        cardInfo: new CardInfo(),
        paymentErrors: [],
        usedCredit: 0,
        requirePaymentAuthorization: false,
        paymentAuthorization: false,
        transferErrors: [],
        isBillingInfoValid: true,
        toggleFocusPaymentBlock: jest.fn(),
        toggleFocusBillingAddressBlock: jest.fn(),

        billingInfo: new BillingInfo('mockFullName', 'mockAddress', 'mockCity', 'mockPostcode', 'mockAddress2'),
    },
    paymentStore: {
        initialize: jest.fn(),
        canPay: false,
        isDeposit: false,
        canPayDeposit: false,
        confirmPolicy: true,
        shouldConfirmPolicy: false,
        clearPaymentUI: jest.fn(),
    },
    layoutStore: {
        isTradePortal: false,
        getSettingAsBoolean: jest.fn(),
    },
    routerStore: {
        referralUrl: 'https://mockurl.com',
    },
    guestDetailsStore: {
        hasGuestInStorage: jest.fn(() => false),
    },
    marketStore: {
        currency: CurrencyCode.GBP,
        getCurrencySymbol: jest.fn(() => '£'),
    },
});
