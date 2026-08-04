import { createMockStores } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IOffer } from 'models/data/IOffer';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { useLuggageTextFromOfferAndFields } from './useLuggageTextFromOfferAndFields';

const extraLuggageFields = {
    DefaultText: mockSitecoreField('LUSText'),
    HoldBagText: mockSitecoreField('{number}LUGText'),
};

let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useLuggageTextFromOfferAndFields', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('should return HoldBagText with number token changed when extraLuggage is provided', () => {
        const offer = {
            ...mockedOffer,
            extraLuggageInfo: {
                items: [
                    { itemCode: 'LUG', name: '23kg test' },
                    { itemCode: 'LUG', name: '23kg test' },
                ],
            },
        } as IOffer;

        const result = useLuggageTextFromOfferAndFields(offer, extraLuggageFields);

        expect(result).toBe('23LUGText');
    });

    it('should return DefaultText when extraLuggage is NOT provided', () => {
        const offer = {
            ...mockedOffer,
            extraLuggageInfo: {},
        } as IOffer;

        const result = useLuggageTextFromOfferAndFields(offer, extraLuggageFields);

        expect(result).toBe('LUSText');
    });

    it('should return empty string when extraLuggage and fields are NOT provided', () => {
        const offer = {
            ...mockedOffer,
            extraLuggageInfo: {},
        } as IOffer;

        const result = useLuggageTextFromOfferAndFields(offer, undefined);

        expect(result).toBe('');
    });

    it('should return LuxuryLabelsLuxuryHoldBagIncluded for luxury flights', () => {
        const offer = {
            promoCollections: [OfferPromotionCodes.Luxury],
        } as IOffer;

        const result = useLuggageTextFromOfferAndFields(offer, extraLuggageFields);

        expect(result).toBe(SitecoreDictionary.LuxuryLabelsLuxuryHoldBagIncluded);
    });

    it('should return LuggageLabels26kgHoldBagSingular for luxury flights when isShortText is true', () => {
        const offer = {
            promoCollections: [OfferPromotionCodes.Luxury],
        } as IOffer;

        const result = useLuggageTextFromOfferAndFields(offer, extraLuggageFields, true);

        expect(result).toBe(SitecoreDictionary.LuggageLabels26kgHoldBagSingular);
    });
});
