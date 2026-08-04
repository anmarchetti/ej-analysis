import * as arrayUtils from 'frontend/utils/array.utils';
import { DestinationType } from 'models/enum/DestinationType';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';

import * as destinationUtils from './destinations.utils';
import {
    convertSitecoreItemsToIDestinations,
    getHotelsIDestinations,
    getPromoPackageThemesFilters,
    getPromoPageDestinationByUrl,
} from './promoPage.utils';
import * as urlUtils from './url.utils';

describe('promoPage.utils', () => {
    const destinations = [
        {
            code: 'ES',
            name: 'Spain',
            type: DestinationType.Country,
            showOnSearchPod: true,
            children: [],
        },
        {
            code: '',
            name: 'Coral Teide Mar',
            type: DestinationType.Hotel,
            showOnSearchPod: false,
        },
    ];

    describe('getPromoPageDestinationByUrl', () => {
        const url = '/en/holidays/luxury-beach-holiday/spain';
        const getLastUrlSegment = jest.spyOn(urlUtils, 'getLastUrlSegment').mockReturnValue('spain');
        const getIDestinationByName = jest
            .spyOn(destinationUtils, 'getIDestinationByName')
            .mockReturnValue(destinations[0]);

        it('should return destination', () => {
            const res = getPromoPageDestinationByUrl(url, destinations);
            expect(getLastUrlSegment).toHaveBeenCalledWith(url);
            expect(getIDestinationByName).toHaveBeenCalledWith(destinations, 'spain');
            expect(res).toBe(destinations[0]);
        });

        it('should return null', () => {
            const res = getPromoPageDestinationByUrl(url, []);
            expect(res).toBeNull();
        });
    });

    describe('getHotelsIDestinations', () => {
        let sitecoreItems: ISitecoreCompositeField<any>[];

        beforeEach(() => {
            sitecoreItems = [
                {
                    fields: {
                        PageCategory: { value: DestinationType.Hotel },
                        Code: { value: 'hotel_1' },
                        Name: { value: 'hotel_1' },
                        ShowOnSearchPod: { value: true },
                    },
                },
                {
                    fields: {
                        PageCategory: { value: DestinationType.Country },
                        Code: { value: 'country' },
                    },
                },
                {
                    fields: {
                        PageCategory: null,
                        HotelDescription: { value: null },
                        Code: { value: 'hotel_2' },
                    },
                },
            ] as ISitecoreCompositeField<any>[];
        });

        it('should return only hotels', () => {
            const res = getHotelsIDestinations(sitecoreItems);

            expect(res).toEqual([
                { type: DestinationType.Hotel, code: 'hotel_1', name: 'hotel_1', showOnSearchPod: true },
                { type: DestinationType.Hotel, code: 'hotel_2' },
            ]);
        });

        it('should set GiataCode if the hotel has empty Code field', () => {
            sitecoreItems[0].fields.Code.value = '';
            sitecoreItems[0].fields.GiataCode = { value: 'hotel_1' };
            const res = getHotelsIDestinations(sitecoreItems);

            expect(res).toEqual([
                { type: DestinationType.Hotel, code: 'hotel_1', name: 'hotel_1', showOnSearchPod: true },
                { type: DestinationType.Hotel, code: 'hotel_2' },
            ]);
        });
    });

    describe('convertSitecoreItemsToIDestinations', () => {
        it('should return IDestination[]', () => {
            const getIDestinationByCode = jest
                .spyOn(destinationUtils, 'getIDestinationByCode')
                .mockImplementation((_, code) => (code === 'ES' ? destinations[0] : (undefined as any)));
            const getIDestinationByName = jest
                .spyOn(destinationUtils, 'getIDestinationByName')
                .mockImplementation((_, name) => (name === 'Coral Teide Mar' ? destinations[1] : (undefined as any)));

            const res = convertSitecoreItemsToIDestinations(
                [
                    {
                        fields: {
                            PageCategory: { value: DestinationType.Country },
                            Code: { value: 'ES' },
                        },
                    },
                    {
                        fields: {
                            PageCategory: { value: DestinationType.Hotel },
                            Code: { value: '' },
                            Name: { value: 'Coral Teide Mar' },
                        },
                    },
                    {
                        fields: {
                            PageCategory: { value: DestinationType.Country },
                            Code: { value: 'unknown' },
                        },
                    },

                    {
                        fields: {
                            PageCategory: { value: DestinationType.Country },
                            Code: null,
                        },
                    },
                ] as ISitecoreCompositeField<any>[],
                destinations,
            );

            expect(getIDestinationByCode).toHaveBeenCalledTimes(2);
            expect(getIDestinationByName).toHaveBeenCalledTimes(1);
            expect(res).toEqual(destinations);
        });
    });

    describe('getPromoPackageThemesFilters', () => {
        it('should call removePrefixes when selectedThemes and promoThemes are provided', () => {
            const mockRemovePrefixes = jest.spyOn(arrayUtils, 'removePrefixes').mockReturnValue([]);
            const selectedThemes = ['A', 'B', 'C', 'DE'];
            const promoThemes = ['AB', '', 'CD', 'D'];

            const result = getPromoPackageThemesFilters(selectedThemes, promoThemes);

            expect(mockRemovePrefixes).toHaveBeenCalledWith([...selectedThemes, ...promoThemes]);
            expect(result).toStrictEqual([]);
        });

        it('should return promoThemes when selectedThemes are NOT provided', () => {
            const selectedThemes = [];
            const promoThemes = ['AB', '', 'CD', 'D'];

            const result = getPromoPackageThemesFilters(selectedThemes, promoThemes);

            expect(result).toStrictEqual(promoThemes);
        });

        it('should return selectedThemes when promoThemes are NOT provided', () => {
            const selectedThemes = ['AB', '', 'CD', 'D'];
            const promoThemes = [];

            const result = getPromoPackageThemesFilters(selectedThemes, promoThemes);

            expect(result).toStrictEqual(selectedThemes);
        });
    });
});
