import bookingService from 'frontend/services/booking.service';
import createRootStore from 'frontend/store/holidays/booking/__mocks__/createRootStore';
import * as freeNightsUtils from 'frontend/utils/freeNights.utils';
import * as formActions from 'frontend/utils/submitForm';
import * as viewBookingUtils from 'frontend/utils/viewBooking.utils';
import { IApplePayBookingPaymentInfo, ICommitBookingRequestBody } from 'models/data/ICommitBookingRequestBody';
import { ApiErrors } from 'models/enum/ApiErrors';
import { PaymentType } from 'models/enum/PaymentType';

import { BookingStore } from './BookingStore';

jest.mock('frontend/utils/submitForm', () => ({
    submitForm: jest.fn(),
}));
jest.mock('frontend/services/booking.service', () => ({
    __esModule: true,
    default: {
        commitBooking: jest.fn(),
    },
}));

const mockGetFreeNightsIncludedInOffer = jest.spyOn(freeNightsUtils, 'getFreeNightsIncludedInOffer');

describe('BookingStore Apple Pay actions', () => {
    let rootStore: any = createRootStore();

    beforeEach(() => {
        rootStore = createRootStore();
    });

    describe('commitApplePayBooking', () => {
        let store: BookingStore;

        beforeEach(() => {
            rootStore = createRootStore();
            rootStore.payStore.selectedPaymentType = PaymentType.ApplePay;
            store = new BookingStore(rootStore);

            jest.spyOn(store, 'buildApplePayCommitBookingRequestBody').mockReturnValue({
                paymentInfo: {
                    billingInfo: { fullName: 'Test User', address: '1 St' },
                    cardType: 'visa',
                    paymentType: 'ApplePay',
                },
            } as any);

            (bookingService.commitBooking as jest.Mock).mockResolvedValue({
                data: { bookingReference: 'ABC123' },
            });

            jest.spyOn(viewBookingUtils, 'getBookingPayload').mockImplementation(() => ({ lastName: 'Doe' } as any));
            mockGetFreeNightsIncludedInOffer.mockReturnValue(1);
            jest.spyOn(store, 'availableRooms', 'get').mockReturnValue(0);
            store.selectedOffer = {} as any;
            store.promoCode.value = 'test-code';
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should call submitForm', () => {
            const mockedBookingBody = {
                paymentInfo: {
                    billingInfo: { fullName: 'Test User', address: '1 St' },
                    paymentType: 'ApplePay',
                },
                discount: 'test-code',
            } as any;

            store.booking = {
                bookingReference: 'TEST123',
                paymentInfo: {
                    balanceDueAmount: 100,
                    balanceDueDate: '2050-01-01T00:00:00',
                },
                package: { transport: [] },
            } as any;

            store.redirectToBookingConfirmation(mockedBookingBody as ICommitBookingRequestBody);

            expect(formActions.submitForm).toHaveBeenCalledWith(
                '/en/holidays/booking/confirmation',
                'booking-info-payload',
                {
                    avail: 0,
                    billingInfo: { fullName: 'Test User', address: '1 St' },
                    freeNightsIncluded: 1,
                    lastName: 'Doe',
                    paymentType: 'ApplePay',
                    cardType: '',
                    promoCode: 'test-code',
                },
            );
        });

        it('should commit booking', async () => {
            const mockedBookingBody = {
                paymentInfo: {
                    billingInfo: { fullName: 'Test User', address: '1 St' },
                    cardType: 'visa',
                    paymentType: 'ApplePay',
                },
                promoCode: 'test-code',
            } as any;

            jest.spyOn(store, 'buildApplePayCommitBookingRequestBody').mockReturnValue(mockedBookingBody);
            (bookingService.commitBooking as jest.Mock).mockResolvedValue({
                data: { bookingReference: 'ABC123' },
            });
            // isTradePortal=true so redirectToBookingConfirmation resolves normally (spinner cleared in finally)
            rootStore.layoutStore.isTradePortal = true;

            const bookingBody = await store.commitApplePayBooking({
                token: { paymentMethod: { network: 'visa' } },
            } as any);

            expect(bookingBody.paymentInfo.billingInfo.fullName).toEqual('Test User');
            expect(bookingBody.paymentInfo.billingInfo.address).toEqual('1 St');
            expect(bookingBody.paymentInfo.cardType).toEqual('visa');
            expect((bookingBody.paymentInfo as IApplePayBookingPaymentInfo).paymentType).toEqual('ApplePay');
        });

        it('should not call submitForm if lastName is missing', async () => {
            jest.spyOn(viewBookingUtils, 'getBookingPayload').mockImplementation(
                () =>
                    ({
                        guests: [],
                        leadPassenger: {},
                    } as any),
            );

            await store.commitApplePayBooking({
                token: { paymentMethod: { network: 'visa' } },
            } as any);

            expect(formActions.submitForm).not.toHaveBeenCalled();
        });

        it('should handle known API error and validate package', async () => {
            const error = { errorCode: ApiErrors.PriceNotValid };
            (bookingService.commitBooking as jest.Mock).mockRejectedValue(error);
            jest.spyOn(store, 'validatePackage');

            await expect(
                store.commitApplePayBooking({ token: { paymentMethod: { network: 'visa' } } } as any),
            ).rejects.toEqual(error);

            expect(store.validatePackage).toHaveBeenCalled();
        });

        it('should call handleCommitBookingError if CommitBookingError', async () => {
            const error = { errorCode: ApiErrors.CommitBookingError, correlationId: 'id' };
            (bookingService.commitBooking as jest.Mock).mockRejectedValue(error);
            store.handleCommitBookingError = jest.fn();

            await expect(
                store.commitApplePayBooking({ token: { paymentMethod: { network: 'visa' } } } as any),
            ).rejects.toEqual(error);

            expect(store.handleCommitBookingError).toHaveBeenCalledWith(error);
        });

        it('should throw an error if CommitBookingError', async () => {
            const error = { errorCode: ApiErrors.CommitBookingError, correlationId: 'id' };
            (bookingService.commitBooking as jest.Mock).mockRejectedValue(error);
            store.handleCommitBookingError = jest.fn();

            await expect(
                store.commitApplePayBooking({ token: { paymentMethod: { network: 'visa' } } } as any),
            ).rejects.toEqual(error);

            expect(store.handleCommitBookingError).toHaveBeenCalledWith(error);
        });
    });
});
