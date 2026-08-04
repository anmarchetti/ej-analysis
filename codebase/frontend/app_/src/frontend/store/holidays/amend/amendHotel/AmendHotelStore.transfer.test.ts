import Axios from 'axios';

import { createMockStores, mockAmendHotelOffer, mockBooking, mockTransfer } from 'frontend/__mocks__';
import { ApiError } from 'models/data/ApiError';
import { ITransferWithAmendmentCharges } from 'models/data/ITransfer';

import { AmendHotelStoreTransfer } from './AmendHotelStore.transfer';

const mockGetAmendHotelTransfers = jest.fn().mockResolvedValue([
    {
        amendHotelOffer: {
            ...mockAmendHotelOffer,
            amendmentChargesInfo: {
                ...mockAmendHotelOffer.amendmentChargesInfo,
                fullAmendmentCharges: 100,
            },
        },
        bookingRef: 'bookingRef',
    },
]);
jest.mock('frontend/services/booking.service', () => ({
    __esModule: true,
    default: {
        getAmendHotelTransfers: (...params) => mockGetAmendHotelTransfers(...params),
    },
}));

const mockGetAmendmentRoundedPrice = jest.fn().mockImplementation(price => price);
jest.mock('frontend/utils/amendBooking.utils', () => ({
    __esModule: true,
    getAmendmentRoundedPrice: (...params) => mockGetAmendmentRoundedPrice(...params),
}));

describe('AmendHotelStoreTransfer', () => {
    let hotelTransferStore: AmendHotelStoreTransfer;
    let rootStore;

    beforeEach(() => {
        rootStore = createMockStores({
            amendHotelStore: {
                newlySelectedHotelOffer: mockAmendHotelOffer,
            },
            viewBookingStore: {
                booking: mockBooking,
            },
        });
        hotelTransferStore = new AmendHotelStoreTransfer(rootStore);
    });

    it('initialize', () => {
        expect(hotelTransferStore.alternativeTransfers).toStrictEqual([]);
        expect(hotelTransferStore.isLoading).toBe(false);
        expect(hotelTransferStore.error).toBe(null);
    });

    describe('fetchAlternativeTransfers', () => {
        it('should be run successfully', () => {
            const cancelSource = Axios.CancelToken.source();

            hotelTransferStore.fetchAlternativeTransfers(cancelSource).then(result => {
                expect(result).toBe(undefined);
                expect(mockGetAmendHotelTransfers).toHaveBeenCalledWith(
                    hotelTransferStore.rootStore.viewBookingStore.booking!.bookingReference,
                    hotelTransferStore.rootStore.amendHotelStore.newlySelectedHotelOffer,
                    cancelSource,
                );
                expect(hotelTransferStore.alternativeHotelOffers[0].amendmentChargesInfo!.fullAmendmentCharges).toBe(
                    100,
                );
                expect(hotelTransferStore.isLoading).toBe(false);
            });

            expect(hotelTransferStore.isLoading).toBe(true);
        });

        it('should return an error', async () => {
            const error = new Error('Test Error');
            mockGetAmendHotelTransfers.mockRejectedValueOnce(error);

            const result = await hotelTransferStore.fetchAlternativeTransfers();

            expect(result).toStrictEqual({ error });
        });

        it('should NOT call bookingService.getAmendHotelTransfers if no booking', async () => {
            rootStore.viewBookingStore.booking = null;

            await hotelTransferStore.fetchAlternativeTransfers();

            expect(mockGetAmendHotelTransfers).not.toHaveBeenCalled();
        });

        it('should NOT call bookingService.getAmendHotelTransfers if no newlySelectedHotelOffer', async () => {
            rootStore.amendHotelStore.newlySelectedHotelOffer = null;

            await hotelTransferStore.fetchAlternativeTransfers();

            expect(mockGetAmendHotelTransfers).not.toHaveBeenCalled();
        });
    });

    describe('dropStoreState', () => {
        it('should reset store state', () => {
            hotelTransferStore.alternativeHotelOffers = [mockAmendHotelOffer];
            hotelTransferStore.isLoading = true;
            hotelTransferStore.error = new ApiError(new Error('error') as any);

            hotelTransferStore.dropStoreState();

            expect(hotelTransferStore.alternativeTransfers).toStrictEqual([]);
            expect(hotelTransferStore.isLoading).toBe(false);
            expect(hotelTransferStore.error).toBe(null);
        });
    });

    describe('alternativeTransfers', () => {
        it('should return transfers array', () => {
            hotelTransferStore.alternativeHotelOffers = [mockAmendHotelOffer];

            const result = hotelTransferStore.alternativeTransfers;
            expect(mockGetAmendmentRoundedPrice).toHaveBeenCalledWith(
                mockAmendHotelOffer.amendmentChargesInfo!.amendmentCharges,
                false,
            );
            expect(result).toStrictEqual([
                {
                    transfer: mockAmendHotelOffer.transfers[0],
                    amendmentCharges: mockAmendHotelOffer.amendmentChargesInfo!.amendmentCharges,
                },
            ]);
        });
    });

    describe('changeTransfer', () => {
        it('should update newlySelectedHotelOffer', () => {
            const mockSelectedTransfer: ITransferWithAmendmentCharges = {
                transfer: { ...mockTransfer, code: 'transfer-code' },
                amendmentCharges: 30,
            };
            const mockAltHotelOffer = {
                ...mockAmendHotelOffer,
                transfers: [{ ...mockAmendHotelOffer.transfers[0], code: 'transfer-code' }],
            };
            hotelTransferStore.alternativeHotelOffers = [mockAltHotelOffer];

            hotelTransferStore.changeTransfer(mockSelectedTransfer);

            expect(hotelTransferStore.rootStore.amendHotelStore.newlySelectedHotelOffer).toStrictEqual(
                mockAltHotelOffer,
            );
            expect(hotelTransferStore.rootStore.amendHotelStore.prevSelectedHotelOffer).toStrictEqual(
                mockAltHotelOffer,
            );
        });
    });

    describe('selectedTransfer', () => {
        it('should return transfer from amendHotelOffer', () => {
            hotelTransferStore.rootStore.amendHotelStore.newlySelectedHotelOffer = mockAmendHotelOffer;

            const result = hotelTransferStore.selectedTransfer;

            expect(result).toStrictEqual(mockAmendHotelOffer.transfers[0]);
        });
    });
});
