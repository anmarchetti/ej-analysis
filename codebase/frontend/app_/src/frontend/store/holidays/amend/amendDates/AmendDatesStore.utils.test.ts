import { mockBooking, mockFlightsOffers } from 'frontend/__mocks__';
import { mockAmendDatesOfferWithPrice } from 'frontend/__mocks__/stores/amendDatesStore';

import {
    clearSeatSelectionFromOffer,
    getAmendmentItemsFromAlternativeOffers,
    getRoomDetailsForAmendDates,
} from './AmendDatesStore.utils';

describe('getRoomDetailsForAmendDates', () => {
    it('should return room details', () => {
        const expected = [
            {
                adults: 2,
                children: 0,
                infants: 0,
                childrenAges: [],
                roomCode: 'DB01',
            },
        ];
        expect(getRoomDetailsForAmendDates(mockBooking)).toEqual(expected);
    });
});

describe('getAmendmentItemsFromAlternativeOffers', () => {
    const amendmentItems = [
        mockAmendDatesOfferWithPrice,
        { ...mockAmendDatesOfferWithPrice, offer: mockFlightsOffers[1] },
    ];

    it('returns right items based on provided offers', () => {
        const amendmentItems = [
            mockAmendDatesOfferWithPrice,
            { ...mockAmendDatesOfferWithPrice, offer: mockFlightsOffers[1] },
        ];

        const amendmentItemsFromOffers = getAmendmentItemsFromAlternativeOffers(
            mockFlightsOffers.slice(0, 1),
            amendmentItems,
        );

        expect(amendmentItemsFromOffers).toStrictEqual(amendmentItems.slice(0, 1));
    });

    it('should return empty array if no offers or items are provided', () => {
        //@ts-expect-error null intead offers
        const noOffers = getAmendmentItemsFromAlternativeOffers(null, amendmentItems);
        //@ts-expect-error null intead amendmentItems
        const noAmendmentItems = getAmendmentItemsFromAlternativeOffers(mockFlightsOffers, null);

        expect(noOffers).toStrictEqual([]);
        expect(noAmendmentItems).toStrictEqual([]);
    });
});

describe('clearSeatSelectionFromOffer', () => {
    it('should clear seat selection from offer', () => {
        expect(mockAmendDatesOfferWithPrice.offer.seatSelection).not.toEqual([]);
        const amendedOffer = clearSeatSelectionFromOffer(mockAmendDatesOfferWithPrice);

        expect(amendedOffer.offer.seatSelection).toEqual([]);
    });
});
