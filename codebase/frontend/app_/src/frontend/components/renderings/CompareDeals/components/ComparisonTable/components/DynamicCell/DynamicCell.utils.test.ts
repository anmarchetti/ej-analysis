import { luggagePackageIcon, mockHotel } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { deepClone } from 'frontend/utils/array.utils';
import * as luggageUtils from 'frontend/utils/luggage.utils';
import * as offerUtils from 'frontend/utils/offer.utils';
import * as transferUtils from 'frontend/utils/transfer.utils';
import { IExtraLuggageInfo } from 'models/data/IFlightExtras';
import { IFacilityGroup } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { ITransfer } from 'models/data/ITransfer';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import {
    getBagsData,
    getDates,
    getFacilityData,
    getFlightTime,
    getStayData,
    getTransferName,
    isLuxuryContent,
} from './DynamicCell.utils';

jest.mock('frontend/utils/date.utils', () => ({
    formatDateL10n: (date, format) => `${date} in ${format}`,
}));

let offer;

const mockIsMatchingLuggageIcon = jest.spyOn(luggageUtils, 'isMatchingLuggageIcon');
const mockGetExtraLuggageFromLivePriceAndOffer = jest.spyOn(luggageUtils, 'getExtraLuggageFromLivePriceAndOffer');
const mockContainsLuxuryPromoCode = jest.spyOn(offerUtils, 'containsLuxuryPromoCode');
const mockGetTransferFromLivePriceAndOffer = jest.spyOn(transferUtils, 'getTransferFromLivePriceAndOffer');

describe('ComparisonTable utils', () => {
    beforeEach(() => {
        offer = deepClone(mockedOffer);
        offer.accom.stay = 4;
    });

    describe('getDates', () => {
        it('should return departure and return dates', () => {
            const result = getDates(offer);
            expect(result).toBe(
                '2020-09-12T12:00:00+00:00 in DayAndMonthAbbr - 2020-09-19T23:20:00+00:00 in DayAndMonthAbbr',
            );
        });

        it('should return null when no departure date', () => {
            // @ts-ignore
            offer.transport.routes[0].arrDate = null;
            const result = getDates(offer);
            expect(result).toBe(null);
        });

        it('should return null when no return date', () => {
            // @ts-ignore
            offer.transport.routes[1].arrDate = null;
            const result = getDates(offer);
            expect(result).toBe(null);
        });
    });

    describe('getFlightTime', () => {
        it('should return outbound flight time', () => {
            const result = getFlightTime(offer, 0);
            expect(result).toBe('2020-09-12T07:25:00+00:00 in HH:mm - 2020-09-12T12:00:00+00:00 in HH:mm');
        });

        it('should return return flight time', () => {
            const result = getFlightTime(offer, 1);
            expect(result).toBe('2020-09-19T19:10:00+00:00 in HH:mm - 2020-09-19T23:20:00+00:00 in HH:mm');
        });

        it('should return null when no start time', () => {
            // @ts-ignore
            offer.transport.routes[0].depDate = null;
            const result = getFlightTime(offer, 0);
            expect(result).toBe(null);
        });

        it('should return null when no end time', () => {
            // @ts-ignore
            offer.transport.routes[0].arrDate = null;
            const result = getFlightTime(offer, 0);
            expect(result).toBe(null);
        });
    });

    describe('getStayData', () => {
        it('should return plural label when offer with few nights', () => {
            const mockGetPhrase = jest.fn(p => p);
            const result = getStayData(offer, mockGetPhrase);
            expect(result).toBe(`4 ${SitecoreDictionary.GlobalsLabelsNightsPlural}`);
        });

        it('should return single label when offer with few nights', () => {
            const mockGetPhrase = jest.fn(p => p);
            offer.accom.stay = 1;
            const result = getStayData(offer, mockGetPhrase);
            expect(result).toBe(`1 ${SitecoreDictionary.GlobalsLabelsNightSingular}`);
        });

        it('should return null when no data', () => {
            const mockGetPhrase = jest.fn(p => p);
            // @ts-ignore
            offer.accom.stay = null;
            const result = getStayData(offer, mockGetPhrase);
            expect(result).toBe(null);
        });
    });

    describe('getBagsData', () => {
        beforeEach(() => {
            mockGetExtraLuggageFromLivePriceAndOffer.mockReturnValue(undefined);
            mockIsMatchingLuggageIcon.mockReturnValue(false);
            mockContainsLuxuryPromoCode.mockReturnValue(false);
        });

        it('should return an empty arr when packageIcons are NOT provided', () => {
            const result = getBagsData(mockedOffer, false, jest.fn());

            expect(result).toMatchObject([]);
            expect(mockGetExtraLuggageFromLivePriceAndOffer).toHaveBeenCalledWith(mockedOffer?.livePrice, mockedOffer);
        });

        it('should return matching bag name', () => {
            mockIsMatchingLuggageIcon.mockReturnValue(true);
            mockedOffer.accom.theme = mockHotel.theme;

            const result = getBagsData(mockedOffer, true, jest.fn());

            expect(result).toMatchObject([luggagePackageIcon.name]);
            expect(mockGetExtraLuggageFromLivePriceAndOffer).not.toHaveBeenCalled();
        });

        it('should return underSeatBag name when there are no matching icons and bag is included', () => {
            mockGetExtraLuggageFromLivePriceAndOffer.mockReturnValue({ items: [] } as IExtraLuggageInfo);
            mockedOffer.accom.theme = mockHotel.theme;

            const result = getBagsData(mockedOffer, false, jest.fn());

            expect(result).toMatchObject(['Under seat bag']);
        });

        it('should return LuggageLabels26kgHoldBagPlural when containsLuxuryPromoCode returns true', () => {
            mockContainsLuxuryPromoCode.mockReturnValue(true);

            const result = getBagsData(
                mockedOffer,
                false,
                jest.fn(p => p),
            );

            expect(result).toMatchObject([SitecoreDictionary.LuggageLabels26kgHoldBagPlural]);
        });
    });

    describe('getFacilityData', () => {
        it('should render first 4 overview facility', () => {
            const facilities = [
                {
                    name: 'Overview',
                    code: 'OV',
                    items: [
                        {
                            name: 'Bar',
                        },
                        {
                            name: 'Outdoor pool',
                        },
                        {
                            name: 'Gym',
                        },
                        {
                            name: 'Spa centre',
                        },
                        {
                            name: 'Air conditioning',
                        },
                    ],
                } as IFacilityGroup,
            ];
            const result = getFacilityData(facilities);
            expect(result).toMatchObject(['Bar', 'Outdoor pool', 'Gym', 'Spa centre']);
        });

        it('should return empty array when no overview facility', () => {
            const facilities = [
                {
                    name: 'Test',
                    code: 'DF',
                    items: [
                        {
                            name: 'WI-FI',
                        },
                    ],
                } as IFacilityGroup,
            ];
            const result = getFacilityData(facilities);
            expect(result.length).toBe(0);
        });
    });

    describe('isLuxuryContent', () => {
        it('should call containsLuxuryPromoCode with promoCollections from offer', () => {
            isLuxuryContent({ promoCollections: [OfferPromotionCodes.Luxury] } as IOffer);

            expect(mockContainsLuxuryPromoCode).toHaveBeenCalledWith([OfferPromotionCodes.Luxury]);
        });

        it('should call containsLuxuryPromoCode with promoCollections from hotel', () => {
            isLuxuryContent({
                promoCollections: undefined,
                hotel: { promoCollections: [OfferPromotionCodes.Luxury] },
            } as IOffer);

            expect(mockContainsLuxuryPromoCode).toHaveBeenCalledWith([OfferPromotionCodes.Luxury]);
        });

        it('should call containsLuxuryPromoCode with promotionsCollections from livePrice', () => {
            isLuxuryContent({
                promoCollections: undefined,
                hotel: { promoCollections: undefined },
                livePrice: { promoCollections: [OfferPromotionCodes.Luxury] },
            } as IOffer);

            expect(mockContainsLuxuryPromoCode).toHaveBeenCalledWith([OfferPromotionCodes.Luxury]);
        });

        it('should call containsLuxuryPromoCode with undefined when all sources are NOT provided', () => {
            isLuxuryContent({} as IOffer);

            expect(mockContainsLuxuryPromoCode).toHaveBeenCalledWith(undefined);
        });
    });

    describe('getTransferName', () => {
        beforeEach(() => {
            mockContainsLuxuryPromoCode.mockReturnValue(false);
        });

        it('should return TransferLabelsPrivateTransfer when containsLuxuryPromoCode returns true', () => {
            mockContainsLuxuryPromoCode.mockReturnValue(true);

            const result = getTransferName(
                undefined,
                mockedOffer,
                false,
                jest.fn(p => p),
            );

            expect(result).toBe(SitecoreDictionary.TransferLabelsPrivateTransfer);
        });

        it('should return null when isOfferFromAnotherMarket is true', () => {
            const result = getTransferName(
                undefined,
                mockedOffer,
                true,
                jest.fn(p => p),
            );

            expect(result).toBe(null);
        });

        it('should return name from getTransferFromLivePriceAndOffer', () => {
            mockGetTransferFromLivePriceAndOffer.mockReturnValue({ name: 'transfer name' } as ITransfer);

            const result = getTransferName(
                undefined,
                mockedOffer,
                false,
                jest.fn(p => p),
            );

            expect(result).toBe('transfer name');
        });

        it('should return udefined when getTransferFromLivePriceAndOffer does NOT have name', () => {
            mockGetTransferFromLivePriceAndOffer.mockReturnValue({} as ITransfer);

            const result = getTransferName(
                undefined,
                mockedOffer,
                false,
                jest.fn(p => p),
            );

            expect(result).toBe(undefined);
        });
    });
});
