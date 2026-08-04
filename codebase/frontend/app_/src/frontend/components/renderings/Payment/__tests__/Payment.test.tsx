import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockLuggageListFields } from 'frontend/__mocks__/luggage';
import { PaymentType } from 'models/enum/PaymentType';
import Payment from 'frontend/components/renderings/Payment/Payment';

const createProps = () => ({
    amount: 1000,
    amountToPay: 1000,
    canPay: true,
    canPayDeposit: false,
    commitBooking: jest.fn(),
    confirmPolicy: false,
    fatalPaymentError: false,
    clearPaymentUI: jest.fn(),
    fields: {
        ...mockLuggageListFields,
        AmountToPayByCard: { value: 'amout to pay by card' },
        CvvInfo: { value: '' },
        CvvInfoAMEX: { value: '' },
        EnablePriceJumpInfoBox: { value: true },
        IconCreditInfoBlock: { value: { src: 'src' } },
        ImportantInformation: { value: '' },
        ImportantInformationConfirmation: { value: 'tick' },
        IsUseCreditShown: { value: true },
        IssueNumberInfo: { value: { src: 'src2' } },
        PayFullDescription: { value: 'full description' },
        PayWithDepositAttention: { value: 'deposit attention' },
        PayWithDepositDescription: { value: 'deposit description' },
        PayWithDepositDescriptionOnePassenger: { value: 'one passenger' },
        PaymentDeny: { value: 'payment deny' },
        PaymentImages: [],
        ProtectionImage: { value: {} },
        ProtectionTitle: { value: 'protection' },
        TextCreditInfoBlock: { value: 'credit info' },
        UseCreditDescription: { value: 'credit description' },
        UseCreditFormTitle: { value: 'form title' },
        UseCreditLogInText: { value: 'log in text' },
        UseCreditTitle: { value: 'credit title' },
    },
    forceErrors: false,
    getPhrase: jest.fn(),
    initialize: jest.fn(),
    hasGuestInStorage: () => false,
    isCommittingBooking: false,
    isDeposit: false,
    isHolidayDataAvailable: true,
    isPaymentInformationValid: true,
    isTradePortal: false,
    isTransfersHidden: false,
    onForceErrors: jest.fn(),
    packageInfo: {},
    params: {},
    paymentAuthorization: null,
    promoCode: '',
    rendering: {},
    requirePaymentAuthorization: false,
    shouldConfirmPolicy: false,
    togglePolicy: jest.fn(),
    transferErrors: [],
    usedCredit: 0,
});

const createStores = () => ({
    trackingStore: {},
    layoutStore: {
        getPhrase: jest.fn(),
        isTradePortal: false,
        getSettingAsBoolean: jest.fn(),
    },
    appStore: { isScreenLessMedium: false },
    bookingStore: {
        promoCode: { value: null },
        isHolidayDataAvailable: true,
        totalPrice: 2000,
        previousPrice: 2000,
        applyingPromoCode: false,
        commitBooking: jest.fn(),
    },
    paymentStore: { initialize: jest.fn(), clearPaymentUI: jest.fn() },
    payStore: { nameOnCard: '', onForceErrors: jest.fn(), isPaymentAllowed: true },
    guestDetailsStore: { hasGuestInStorage: jest.fn(() => false) },
    routerStore: {},
    marketStore: { formatMoney: jest.fn(a => `£${a}`), getCurrencySymbol: jest.fn(() => '£') },
    airportParkingStore: {
        selectedAirportParking: null,
    },
    paymentTypeStore: {
        selectedPaymentType: PaymentType.Card,
        setSelectedPaymentType: jest.fn(),
        setApplePayUnavailable: jest.fn(),
    },
    queryParamStore: { isFlightPlusHotelFunnel: false },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/Payment/components/PaymentForm', () => () => <div className='form' />);

jest.mock('frontend/components/common/ErrorMessage', () => () => <div data-tid='error' />);

describe('<Payment />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should call clearPaymentUI on unmount', () => {
        const { unmount } = render(<Payment {...mockProps} />);

        expect(mockStores.paymentStore.clearPaymentUI).not.toHaveBeenCalled();

        unmount();

        expect(mockStores.paymentStore.clearPaymentUI).toHaveBeenCalled();
    });

    it('should NOT render price change info when price did not change', () => {
        render(<Payment {...mockProps} />);

        expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    });

    it('should render price change info twice when price change', () => {
        mockStores.bookingStore.totalPrice = 2000;
        mockStores.bookingStore.previousPrice = 1000;

        render(<Payment {...mockProps} />);

        expect(screen.getAllByTestId('error').length).toBe(2);
    });

    it('should render price change info after price change when clicking pay button', async () => {
        mockStores.bookingStore.commitBooking = jest.fn(() => {
            mockStores.bookingStore.previousPrice = 1000;
        });

        render(<Payment {...mockProps} />);

        const button = screen.getByRole('button');
        expect(screen.queryByTestId('error')).not.toBeInTheDocument();

        await userEvent.click(button);

        expect(mockStores.bookingStore.commitBooking).toBeCalled();

        render(<Payment {...mockProps} />);

        expect(screen.getAllByTestId('error').length).toBe(2);
    });
});
