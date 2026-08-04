import TradePortalPaymentStore from './TradePortalPaymentStore';
jest.mock('frontend/services/booking.service');
jest.mock('frontend/utils/paymentTransaction');

describe('TradePortalPaymentStore', () => {
    const createRootStore = () => ({
        payStore: {
            getCredit: jest.fn(),
            setAmount: jest.fn(),
            setCurrency: jest.fn(),
            setBillingInfo: jest.fn(),
            setCustomerEmail: jest.fn(),
            clearStore: jest.fn(),
            clearUI: jest.fn(),
            canPay: true,
        },
        bookingStore: {
            commitBooking: jest.fn(),
            fetchOffer: jest.fn(),
            paymentInfo: { depositPrice: 0, totalPrice: 100 },
            clearPaymentInfo: jest.fn(),
            guestsInfoPayload: {
                guests: [
                    {
                        firstName: 'Full',
                        lastName: 'Name',
                        address: 'Address',
                        address2: 'Address 2',
                        city: 'City',
                        postCode: 'Postcode',
                        email: 'test@email.com',
                        isLead: true,
                    },
                ],
            },
        },
        guestDetailsStore: {
            initializeGuests: jest.fn(),
            hasGuestInStorage: jest.fn().mockReturnValue(true),
        },
    });
    let rootStore;
    let paymentStore;

    beforeEach(() => {
        rootStore = createRootStore();
        paymentStore = new TradePortalPaymentStore(rootStore);
    });

    describe('initialize', () => {
        it('should fetchOffer', async () => {
            await paymentStore.initialize();

            expect(rootStore.bookingStore.fetchOffer).toBeCalled();
        });

        it('should initializeGuests', async () => {
            await paymentStore.initialize();

            expect(rootStore.guestDetailsStore.initializeGuests).toBeCalled();
        });
    });

    describe('pay store setamount', () => {
        it('should call setAmount from pay store for full amount', () => {
            paymentStore.selectFullPayment();
            expect(paymentStore.rootStore.payStore.setAmount).toBeCalled();
        });
    });

    describe('clear store', () => {
        it('should clear payment store', () => {
            paymentStore.clearPaymentStore();
            expect(paymentStore.confirmPolicy).toBeFalsy();
            expect(paymentStore.bookingReference).toBe(undefined);
            expect(rootStore.payStore.clearStore).toBeCalled();
        });

        it('should clear hard clearPaymentUI', () => {
            paymentStore.clearPaymentUI(true);
            expect(rootStore.payStore.clearUI).toBeCalled();
            expect(paymentStore.confirmPolicy).toBeFalsy();
        });
    });

    describe('balanceDueDate', () => {
        it('should be empty if no paymentInfo', () => {
            rootStore.bookingStore.paymentInfo = null;
            expect(paymentStore.balanceDueDate).toEqual('');
        });

        it('should show date if we have balanceDueDate', () => {
            rootStore.bookingStore.paymentInfo.balanceDueDate = '2020-08-02T00:00:00+00:00';
            expect(paymentStore.balanceDueDate).toEqual('2020-08-02T00:00:00+00:00');
        });
    });

    describe('canPay', () => {
        it('should return true if all forms are valid and confirm policy checked', () => {
            paymentStore.confirmPolicy = true;
            expect(paymentStore.canPay).toBeTruthy();
        });

        it('should return false if confirm policy not checked', () => {
            paymentStore.confirmPolicy = false;
            expect(paymentStore.canPay).toBeFalsy();
        });
    });

    describe('togglePolicy', () => {
        it('should toggle confirm policy', () => {
            expect(paymentStore.confirmPolicy).toBeFalsy();
            paymentStore.togglePolicy(true);
            expect(paymentStore.confirmPolicy).toBeTruthy();
        });
    });

    it('selectDefaultPaymentOption should call setAmount', () => {
        paymentStore.selectDefaultPaymentOption();

        expect(rootStore.payStore.setAmount).toBeCalledWith(100);
    });
});
