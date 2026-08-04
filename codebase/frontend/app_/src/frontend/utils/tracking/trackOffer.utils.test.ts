import { TCmsLang } from 'code/cmsLang';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { ShortlistType } from 'models/enum/ShortlistType';

import { createProduct, getProductDimensions } from './trackOffer.utils';

jest.mock('frontend/utils/tracking/tracking.utils', () => ({
    __esModule: true,
    getTimestamp: () => '2020-09-12',
}));

jest.mock('frontend/utils/date.utils', () => ({
    formatDateToQuery: jest.fn(d => d),
    getDaysDifference: jest.fn().mockReturnValue(1),
}));

jest.mock('frontend/utils/shortlist.utils', () => ({
    getOfferAccomCode: jest.fn(offer => offer.accom.id),
}));

describe('trackOffset utils', () => {
    describe('createProduct', () => {
        it('should return a product with all defined values', () => {
            const offer = {
                ...mockedOffer,
                accom: {
                    ...mockedOffer.accom,
                    stay: 1,
                },
            };
            const result = createProduct(offer);

            expect(result).toEqual({
                dimension126: 1,
                dimension18: offer.transport.routes[0].depItemName,
                dimension20: offer.transport.routes[0].arrItemName,
                dimension35: '2020-09-12T07:25:00+00:00',
                dimension47: offer.accom.stay,
                id: `ej:${offer.accom.id}`,
            });
        });
    });

    describe('getProductDimensions', () => {
        it('should return product dimensions with all defined values', () => {
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
            const result = getProductDimensions(offer);

            expect(result).toEqual({
                dimension126: 1,
                dimension18: offer.transport.routes[0].depItemName,
                dimension20: offer.transport.routes[0].arrItemName,
                dimension35: '2020-09-12T07:25:00+00:00',
                dimension47: offer.accom.stay,
            });
        });

        it('should return product dimensions with fallback values', () => {
            const offer = {
                ...mockedOffer,
                accom: {
                    ...mockedOffer.accom,
                    stay: 0,
                },
                transport: {
                    ...mockedOffer.transport,
                    routes: [
                        {
                            ...mockedOffer.transport.routes[0],
                            depDate: '',
                            depItemName: '',
                            arrItemName: '',
                        },
                    ],
                },
            };
            const result = getProductDimensions(offer);

            expect(result).toEqual({
                dimension126: null,
                dimension35: null,
                dimension18: null,
                dimension20: null,
                dimension47: null,
            });
        });

        it('should return product dimensions with fallback values when calls with offer from HotelBrowse page (shortcutted)', () => {
            const offer = {
                hotel: {
                    name: undefined,
                    code: 'hotelCode',
                    theme: undefined,
                    type: undefined,
                },
                price: undefined,
                pricePP: undefined,
                shortlist: {
                    id: undefined,
                    type: ShortlistType.Hotel,
                },
                transfers: undefined,
                extraLuggageInfo: undefined,
            } as any;
            const result = getProductDimensions(offer);

            expect(result).toEqual({
                dimension126: null,
                dimension35: null,
                dimension18: null,
                dimension20: null,
                dimension47: null,
            });
        });
    });
});
