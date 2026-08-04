import { mockedOffer } from 'frontend/__mocks__/offer';
import { getOriginalBooking } from 'frontend/utils/originalBooking.utils';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';

let mockOriginalBooking;

jest.mock('frontend/utils/webStorage.utils', () => ({
    getWebStorageItem: jest.fn(() => mockOriginalBooking),
}));

describe('OriginalBooking', () => {
    beforeEach(() => {
        mockOriginalBooking = mockedOffer as IOfferWithoutAltBoards;
    });

    describe('get accommodation', () => {
        it('should return the original accommodation when called', () => {
            const accommodation = getOriginalBooking().accommodation;

            expect(accommodation).toEqual(mockOriginalBooking.accom.unit);
        });

        it('should return undefined when there is no originalBooking', () => {
            mockOriginalBooking = null;

            const accommodation = getOriginalBooking().accommodation;

            expect(accommodation).toBeUndefined();
        });

        it('should return null when the stored accommodation was null', () => {
            mockOriginalBooking.accom.unit = null;

            const accommodation = getOriginalBooking().accommodation;

            expect(accommodation).toBeNull();
        });
    });

    describe('get transferPrice', () => {
        it('should return the original transfer price when it exists', () => {
            const transferPrice = getOriginalBooking().transferPrice;

            expect(transferPrice).toEqual(mockOriginalBooking.transfers[0].price);
        });

        it('should return undefined when there is no originalBooking ', () => {
            mockOriginalBooking = null;

            const transferPrice = getOriginalBooking().transferPrice;

            expect(transferPrice).toBeUndefined();
        });

        it('should return null when there are no transfers in the original booking', () => {
            mockOriginalBooking.transfers = [];

            const transferPrice = getOriginalBooking().transferPrice;

            expect(transferPrice).toBeNull();
        });
    });
});
