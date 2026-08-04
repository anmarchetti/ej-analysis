import { getTransaction, isTransactionDone, isTransactionProcessing } from 'frontend/utils/paymentTransaction';

import { PaymentStore } from './PaymentStore';
jest.mock('frontend/services/booking.service');
jest.mock('frontend/utils/paymentTransaction');

describe('PaymentStore', () => {
    const createRootStore = () => ({
        payStore: {
            getCredit: jest.fn(),
            setAmount: jest.fn(),
            setCurrency: jest.fn(),
            setBillingInfo: jest.fn(),
            setCustomerEmail: jest.fn(),
            clearStore: jest.fn(),
            clearUI: jest.fn(),
            setIsUseCreditAllowed: jest.fn(),
            canPay: true,
        },
        bookingStore: {
            commitBooking: jest.fn(),
            fetchOffer: jest.fn(),
            paymentInfo: { depositPrice: 0 },
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
        holidayCreditStore: {
            isCreditBookingEnabled: true,
        },
    });
    let rootStore;
    let store;

    beforeEach(() => {
        rootStore = createRootStore();
        store = new PaymentStore(rootStore);
    });

    describe('initialize', () => {
        beforeEach(() => {
            store.selectFullPayment = jest.fn();
            store.selectDepositPayment = jest.fn();
        });

        it('should call all proper functions', async () => {
            await store.initialize();

            expect(rootStore.bookingStore.fetchOffer).toHaveBeenCalled();
            expect(rootStore.payStore.setCurrency).toHaveBeenCalled();
            expect(store.selectFullPayment).toHaveBeenCalled();
            expect(store.selectDepositPayment).not.toHaveBeenCalled();
        });

        describe('Select Payment method', () => {
            it('should select full payment when there is deposit and credit', async () => {
                rootStore.payStore.hasCredit = true;
                rootStore.bookingStore.paymentInfo.depositPrice = 60;

                await store.initialize();

                expect(store.selectFullPayment).toHaveBeenCalled();
                expect(store.selectDepositPayment).not.toHaveBeenCalled();
            });

            it('should select deposit payment when there is deposit and NO credit', async () => {
                rootStore.payStore.hasCredit = false;
                rootStore.bookingStore.paymentInfo.depositPrice = 60;

                await store.initialize();

                expect(store.selectFullPayment).not.toHaveBeenCalled();
                expect(store.selectDepositPayment).toHaveBeenCalled();
            });
        });

        describe('getCredit', () => {
            it('should NOT get credit by default', async () => {
                rootStore.holidayCreditStore = { isCreditBookingEnabled: true };

                await store.initialize();

                expect(rootStore.payStore.getCredit).not.toHaveBeenCalled();
            });

            it('should get credit when argument isCreditShown is true', async () => {
                rootStore.holidayCreditStore = { isCreditBookingEnabled: true };

                await store.initialize(true);

                expect(rootStore.payStore.getCredit).toHaveBeenCalled();
            });

            it('should NOT get credit when credit disabled', async () => {
                rootStore.holidayCreditStore = { isCreditBookingEnabled: false };

                await store.initialize(true);

                expect(rootStore.payStore.getCredit).not.toHaveBeenCalled();
            });
        });

        describe('Billing info', () => {
            it('should set billing info when there is lead guest', async () => {
                await store.initialize();

                expect(rootStore.payStore.setBillingInfo).toHaveBeenCalledWith(
                    'Full Name',
                    'Address',
                    'City',
                    'Postcode',
                    'Address 2',
                );
                expect(rootStore.payStore.setCustomerEmail).toHaveBeenCalledWith('test@email.com');
            });

            it('should set empty string to customer email when it is does NOT passed', async () => {
                rootStore.bookingStore.guestsInfoPayload.guests = [{ isLead: true }];

                await store.initialize();

                expect(rootStore.payStore.setCustomerEmail).toHaveBeenCalledWith('');
            });

            it('should NOT set billing info when there is NO lead guest', async () => {
                rootStore.bookingStore.guestsInfoPayload.guests = [];

                await store.initialize();

                expect(rootStore.payStore.setBillingInfo).not.toHaveBeenCalled();
                expect(rootStore.payStore.setCustomerEmail).not.toHaveBeenCalled();
            });
        });

        describe('Commit Booking', () => {
            it('should NOT commit booking when no transaction', async () => {
                (getTransaction as any).mockReturnValueOnce(null);

                await store.initialize();

                expect(rootStore.bookingStore.commitBooking).not.toHaveBeenCalled();
            });

            it('should commit booking when transaction is done', async () => {
                (getTransaction as any).mockReturnValueOnce('transaction');
                (isTransactionDone as any).mockReturnValueOnce(true);

                await store.initialize();

                expect(rootStore.bookingStore.commitBooking).toHaveBeenCalledWith(undefined, true);
            });

            it('should commit booking when transaction is processing and form is valid', async () => {
                (getTransaction as any).mockReturnValueOnce('transaction');
                (isTransactionProcessing as any).mockReturnValueOnce(true);
                rootStore.payStore.canPay = true;
                store.togglePolicy(true);

                await store.initialize();

                expect(rootStore.bookingStore.commitBooking).toHaveBeenCalledWith(undefined, true);
            });

            it('should NOT commit booking when transaction is processing but form is invalid', async () => {
                (getTransaction as any).mockReturnValueOnce('transaction');
                (isTransactionProcessing as any).mockReturnValueOnce(true);
                rootStore.payStore.canPay = false;
                store.togglePolicy(true);

                await store.initialize();

                expect(rootStore.bookingStore.commitBooking).not.toHaveBeenCalled();
            });
        });
    });

    describe('reselectPayment', () => {
        beforeEach(() => {
            store.selectDepositPayment = jest.fn();
            store.selectFullPayment = jest.fn();
        });

        it('should select deposit', () => {
            store.isDeposit = true;

            store.reselectPayment();

            expect(store.selectDepositPayment).toHaveBeenCalled();
        });

        it('should select full payment', () => {
            store.reselectPayment();

            expect(store.selectFullPayment).toHaveBeenCalled();
        });
    });

    describe('pay store set amount', () => {
        it('should call setAmount from pay store for deposit', () => {
            store.selectDepositPayment();

            expect(store.rootStore.payStore.setAmount).toHaveBeenCalled();
            expect(store.isDeposit).toBeTruthy();
        });

        it('should call setAmount from pay store for full amount', () => {
            store.selectFullPayment();

            expect(store.rootStore.payStore.setAmount).toHaveBeenCalled();
            expect(store.isDeposit).toBeFalsy();
        });
    });

    describe('clear store', () => {
        beforeEach(() => {
            store.togglePolicy = jest.fn();
        });

        it('should clear payment store', () => {
            store.clearPaymentStore();

            expect(store.isDeposit).toBe(false);
            expect(store.confirmPolicy).toBe(false);
            expect(store.bookingReference).toBe(undefined);
            expect(rootStore.payStore.clearStore).toHaveBeenCalled();
        });

        it('should clear hard clearPaymentUI when flag not passed', () => {
            store.clearPaymentUI();

            expect(rootStore.payStore.clearUI).toHaveBeenCalledWith(true);
            expect(store.togglePolicy).toHaveBeenCalledWith(false);
        });

        it('should clear hard clearPaymentUI', () => {
            store.clearPaymentUI(true);

            expect(rootStore.payStore.clearUI).toHaveBeenCalledWith(true);
            expect(store.togglePolicy).toHaveBeenCalledWith(false);
        });

        it('should clear soft clearPaymentUI', () => {
            store.clearPaymentUI(false);

            expect(rootStore.payStore.clearUI).toHaveBeenCalledWith(false);
            expect(store.togglePolicy).not.toHaveBeenCalled();
        });
    });

    describe('depositPrice', () => {
        it('should be 0 when NO paymentInfo', () => {
            rootStore.bookingStore.paymentInfo = null;

            expect(store.depositPrice).toBe(0);
            expect(store.canPayDeposit).toBe(false);
        });

        it('should be 0 on flight plus hotel funnel', () => {
            rootStore.bookingStore.paymentInfo.depositPrice = 100;
            rootStore.bookingStore.isFlightAndHotelPackage = true;

            expect(store.canPayDeposit).toBe(false);
        });

        it('should get deposit when depositPrice is more than 0', () => {
            rootStore.bookingStore.paymentInfo.depositPrice = 100;

            expect(store.depositPrice).toBe(100);
            expect(store.canPayDeposit).toBe(true);
        });
    });

    describe('balanceDueDate', () => {
        it('should be empty when NO paymentInfo', () => {
            rootStore.bookingStore.paymentInfo = null;

            expect(store.balanceDueDate).toEqual('');
        });

        it('should show date when we have balanceDueDate', () => {
            rootStore.bookingStore.paymentInfo.balanceDueDate = '2020-08-02T00:00:00+00:00';

            expect(store.balanceDueDate).toEqual('2020-08-02T00:00:00+00:00');
        });
    });

    describe('depositDueDate', () => {
        it('should be empty when NO paymentInfo', () => {
            rootStore.bookingStore.paymentInfo = null;

            expect(store.depositDueDate).toEqual('');
        });

        it('should show deposit date when we have depositDueDate', () => {
            rootStore.bookingStore.paymentInfo.depositDueDate = '2020-08-02T00:00:00+00:00';

            expect(store.depositDueDate).toEqual('2020-08-02T00:00:00+00:00');
        });
    });

    describe('canPay', () => {
        it('should return true when all forms are valid AND confirm policy checked', () => {
            store.confirmPolicy = true;

            expect(store.canPay).toBe(true);
        });

        it('should return false when confirm policy NOT checked', () => {
            expect(store.canPay).toBe(false);
        });
    });

    describe('togglePolicy', () => {
        it('should toggle confirm policy', () => {
            expect(store.confirmPolicy).toBe(false);

            store.togglePolicy(true);

            expect(store.confirmPolicy).toBe(true);
        });
    });

    describe('setBookingReference', () => {
        it('should set Booking Reference', () => {
            expect(store.bookingReference).toBeUndefined();

            store.setBookingReference('bookingReference');

            expect(store.bookingReference).toBe('bookingReference');
        });
    });

    describe('shouldConfirmPolicy', () => {
        it('should return undefined when NO shouldConfirmPolicy in payStore', () => {
            expect(store.shouldConfirmPolicy).toBeUndefined();
        });

        it('should return true when forceFieldErrors true AND confirmPolicy is false', () => {
            rootStore.payStore.forceFieldErrors = true;

            expect(store.shouldConfirmPolicy).toBe(true);
        });

        it('should return false when forceFieldErrors AND confirmPolicy are true', () => {
            rootStore.payStore.forceFieldErrors = true;
            store.confirmPolicy = true;

            expect(store.shouldConfirmPolicy).toBe(false);
        });
    });
});
