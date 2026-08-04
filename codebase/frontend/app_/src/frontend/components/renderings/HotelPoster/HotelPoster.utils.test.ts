import { mockFlightsOffers, mockHotel } from 'frontend/__mocks__';
import * as taxUtils from 'frontend/utils/touristTax.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { getPosterMeta, getTouristTaxLabelForPoster } from './HotelPoster.utils';

describe('HotelPoster.utils', () => {
    describe('getPosterMeta', () => {
        it('should return null response', () => {
            expect(getPosterMeta({ hotelInfo: null, offer: null, getPhrase: p => p })).toBeNull();
        });

        it('should return correct data', () => {
            const selectedUnit = mockFlightsOffers[0].accom.unit[0];

            expect(getPosterMeta({ hotelInfo: mockHotel, offer: mockFlightsOffers[0], getPhrase: p => p })).toEqual({
                boardType: selectedUnit.boardType,
                departureDate: '26th Aug 2023',
                holidayDuration: '5 Globals.Labels.NightsPlural',
                hotelLocation: 'Resort Example, United States, United States',
                outbound: mockFlightsOffers[0].transport.routes[0],
                roomType: selectedUnit.roomType,
                selectedUnit: selectedUnit,
                unit: mockFlightsOffers[0].accom.unit,
                theme: mockFlightsOffers[0].accom.theme,
            });
        });

        it('should return correct inbound data', () => {
            const inboundOffer = {
                ...mockFlightsOffers[0],
                transport: { ...mockFlightsOffers[0].transport, routes: [mockFlightsOffers[0].transport.routes[1]] },
            };

            expect(getPosterMeta({ hotelInfo: mockHotel, offer: inboundOffer, getPhrase: p => p })).toEqual(
                expect.objectContaining({
                    departureDate: '',
                }),
            );
        });
    });

    describe('getTouristTaxLabelForPoster', () => {
        const getPhrase = jest.fn(p => p);
        const mockGetTouristTaxPrice = jest.spyOn(taxUtils, 'getTouristTaxPrice');

        it('should return empty string when tourist tax is not enabled', () => {
            const result = getTouristTaxLabelForPoster(false, getPhrase, 10);

            expect(result).toBe('');
            expect(mockGetTouristTaxPrice).not.toHaveBeenCalled();
        });

        it('should return empty message when tax price is undefined', () => {
            const result = getTouristTaxLabelForPoster(true, getPhrase);

            expect(result).toBe('');
            expect(mockGetTouristTaxPrice).not.toHaveBeenCalled();
        });

        it('should return tax not applicable message when tax price is 0', () => {
            const result = getTouristTaxLabelForPoster(true, getPhrase, 0);

            expect(result).toBe(`(${SitecoreDictionary.TouristTaxLabelsTaxNotApplicable})`);
            expect(mockGetTouristTaxPrice).not.toHaveBeenCalled();
        });

        it('should return formatted tax label with price when tax price is provided', () => {
            const result = getTouristTaxLabelForPoster(true, getPhrase, 15);

            expect(result).toBe(`(${SitecoreDictionary.TouristTaxLabelsIncludesLocalTaxPerPerson})`);
            expect(mockGetTouristTaxPrice).toHaveBeenCalledWith(15);
        });

        it('should decode HTML entities in tax not applicable label', () => {
            const getPhraseWithEntities = jest.fn(() => 'No taxes &amp; charges due');
            const result = getTouristTaxLabelForPoster(true, getPhraseWithEntities, 0);

            expect(result).toBe('(No taxes & charges due)');
        });
    });
});
