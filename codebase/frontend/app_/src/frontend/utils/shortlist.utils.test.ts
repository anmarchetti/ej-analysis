import { IOffer } from 'models/data/IOffer';
import { ShortlistType } from 'models/enum/ShortlistType';

import {
    getOfferAccomCode,
    isShortlistedOfferUnavailableForBooking,
    isShortlistOffer,
    isShortlistOfferUnavailable,
} from './shortlist.utils';

describe('shortlist.utils', () => {
    describe.each([
        [{ shortlist: { id: 'test' } }, true],
        [{ shortlist: { id: null } }, false],
    ])('isShortlistOffer', (offer, expected) => {
        it(`should return ${expected}`, () => {
            expect(isShortlistOffer(offer as IOffer)).toBe(expected);
        });
    });

    describe.each([
        [{ shortlist: { id: 'test' }, price: 0 }, true],
        [{ shortlist: { id: 'test' }, price: 100 }, false],
    ])('isShortlistOfferUnavailable', (offer, expected) => {
        it(`should return ${expected}`, () => {
            expect(isShortlistOfferUnavailable(offer as IOffer)).toBe(expected);
        });
    });

    describe.each([
        [1, { shortlist: { id: 'test', type: ShortlistType.Hotel }, price: 0 }, true],
        [2, { shortlist: { id: 'test', type: ShortlistType.Hotel }, price: 100 }, true],
        [3, { shortlist: { id: 'test', type: ShortlistType.Offer }, price: 0 }, true],
        [4, { shortlist: { id: 'test', type: ShortlistType.Offer }, price: 100 }, false],
        [5, { shortlist: { id: undefined, type: ShortlistType.Offer }, price: 0 }, false],
    ])('isShortlistOfferUnavailable', (index, offer, expected) => {
        it(`${index}: should return ${expected}`, () => {
            expect(isShortlistedOfferUnavailableForBooking(offer as IOffer)).toBe(expected);
        });
    });

    describe.each([
        [
            'accom id is defined 1',
            { accom: { id: 'accomId', code: 'accomCode' }, hotel: { giataCode: 'hotelGiataCode' } },
            'accomId',
        ],
        [
            'accom code is defined 2',
            { accom: { id: undefined, code: 'accomCode' }, hotel: { giataCode: 'hotelGiataCode' } },
            'accomCode',
        ],
        [
            'hotel giata code is defined 3',
            { accom: { id: undefined, code: undefined }, hotel: { giataCode: 'hotelGiataCode' } },
            'hotelGiataCode',
        ],
        ['accom id, accom code & hotel giata code are not defined', null, undefined],
    ])('getOfferAccomCode', (description, offer, expected) => {
        it(`should return ${expected} when ${description}`, () => {
            expect(getOfferAccomCode(offer as IOffer)).toBe(expected);
        });
    });
});
