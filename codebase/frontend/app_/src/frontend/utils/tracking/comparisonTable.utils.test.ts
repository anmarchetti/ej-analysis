import { mockedOffer } from 'frontend/__mocks__/offer';
import { deepClone } from 'frontend/utils/array.utils';

import { getShortlistOfferIdentifier } from './comparisonTable.utils';

let offer;

describe('comparisonTable.utils', () => {
    beforeEach(() => {
        offer = deepClone(mockedOffer);
    });

    describe('getShortlistOfferIdentifier', () => {
        it('should return null if offer is not defined', () => {
            const result = getShortlistOfferIdentifier(undefined);

            expect(result).toBe(null);
        });

        it('should return string with hotelName & accomId when all fields are defined', () => {
            const result = getShortlistOfferIdentifier(offer);

            expect(result).toBe(`${offer.hotel!.name} | ${offer.accom!.id}`);
        });

        it('should return string with null & accomId when hotel name is not defined', () => {
            offer = { ...offer, hotel: {} };
            const result = getShortlistOfferIdentifier(offer);

            expect(result).toBe(`null | ${offer.accom!.id}`);
        });

        it('should return string with hotelName & accomCode when accom id is not defined', () => {
            offer = { ...offer, accom: { ...offer.accom, id: undefined, code: 'offerAccomCode' } };
            const result = getShortlistOfferIdentifier(offer);

            expect(result).toBe(`${offer.hotel!.name} | ${offer.accom!.code}`);
        });

        it('should return string with hotelName & hotelCode when both accom id & accom code are not defined', () => {
            offer = { ...offer, accom: { ...offer.accom, id: undefined, code: undefined } };
            const result = getShortlistOfferIdentifier(offer);

            expect(result).toBe(`${offer.hotel!.name} | null`);
        });
    });
});
