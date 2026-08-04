import { ENGLISH, TCmsLang } from 'code/cmsLang';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { isExpired } from 'frontend/utils/date.utils';
import { IOffer } from 'models/data/IOffer';
import { OfferStatus } from 'models/enum/Offer';
import { ShortlistType } from 'models/enum/ShortlistType';
import { EventCategories } from 'models/enum/tracking/GenericEventParams';

import { createShortlistViewProduct, getShortlistOfferStatus } from './shortlist.utils';

jest.mock('frontend/utils/date.utils', () => ({
    isExpired: jest.fn().mockReturnValue(false),
    formatDateToQuery: jest.fn(d => d),
    getDaysDifference: jest.fn().mockReturnValue(1),
}));

describe('shortlistTracking.utils', () => {
    describe('createShortlistViewProduct', () => {
        it('should return a product with all defined values', () => {
            const offer = {
                ...mockedOffer,
                accom: {
                    ...mockedOffer.accom,
                    stay: 1,
                },
                shortlist: {
                    ...mockedOffer.shortlist,
                    language: 'de-DE' as TCmsLang,
                },
            };
            const result = createShortlistViewProduct(offer);

            expect(result).toEqual({
                category: EventCategories.Shortlist,
                dimension126: 1,
                dimension18: offer.transport.routes[0].depItemName,
                dimension20: offer.transport.routes[0].arrItemName,
                dimension35: '2020-09-12T07:25:00+00:00',
                dimension47: offer.accom.stay,
                id: offer.accom.id,
                list: 'Shortlist',
                name: offer.hotel!.name,
                product_status: OfferStatus.Active,
                shortlist_added_location: 'de-DE',
            });
        });

        it('should return array of products with fallback values', () => {
            const offer = {
                ...mockedOffer,
                accom: {},
                shortlist: {},
            } as IOffer;
            const result = createShortlistViewProduct(offer);

            expect(result).toMatchObject({
                id: null,
                shortlist_added_location: ENGLISH,
            });
        });
    });

    describe('getShortlistOfferStatus', () => {
        beforeAll(() => {
            jest.useFakeTimers().setSystemTime(new Date('2024-11-29'));
        });

        it('should return Hotel', () => {
            const offer = {
                ...mockedOffer,
                accom: {
                    ...mockedOffer.accom,
                    stay: 1,
                },
                shortlist: {
                    ...mockedOffer.shortlist,
                    type: ShortlistType.Hotel,
                },
            };
            const result = getShortlistOfferStatus(offer);

            expect(result).toBe(OfferStatus.Hotel);
        });

        it('should return Expired', () => {
            (isExpired as jest.Mock).mockReturnValueOnce(true);
            const offer = {
                ...mockedOffer,
                date: '1990-11-11',

                shortlist: {
                    ...mockedOffer.shortlist,
                    type: ShortlistType.Offer,
                },
            };
            const result = getShortlistOfferStatus(offer);

            expect(result).toBe(OfferStatus.Expired);
        });

        it('should return Unavailable', () => {
            const offer = {
                ...mockedOffer,
                price: 0,
                date: '2025-11-11',
                shortlist: {
                    ...mockedOffer.shortlist,
                    id: '123',
                    type: ShortlistType.Offer,
                },
            };
            const result = getShortlistOfferStatus(offer);

            expect(result).toBe(OfferStatus.Unavailable);
        });

        it('should return Active', () => {
            const offer = {
                ...mockedOffer,
                price: 123,
                date: '2025-11-11',
                shortlist: {
                    ...mockedOffer.shortlist,
                    id: '123',
                    type: ShortlistType.Offer,
                },
            };
            const result = getShortlistOfferStatus(offer);

            expect(result).toBe(OfferStatus.Active);
        });
    });
});
