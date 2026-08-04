import { mockBooking } from 'frontend/__mocks__';
import { mockReplaceTokens } from 'frontend/__mocks__/utils/tokenizer';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IHotel } from 'models/data/IHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import {
    buildHotelDetailsUrl,
    distanceInfo,
    getHotelAddress,
    getHotelCoordinates,
    getHotelLocation,
    getHotelLocationHrefs,
} from './getHotelLocation';
import { joinNonEmptyWordsWithComma } from './string.utils';

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceTokens: mockReplaceTokens,
    },
}));

jest.mock('frontend/utils/string.utils', () => ({
    joinNonEmptyWordsWithComma: jest.fn(),
}));

describe('getHotelLocation', () => {
    let mockHotel: IHotel;

    beforeEach(() => {
        mockHotel = {
            name: 'Hard Rock Hotel Tenerife',
            country: { code: 'ES', name: 'Spain' },
            location: { code: 'ESTF', name: 'Tenerife' },
            resort: { code: 'ESTFPP', name: 'Playa Paraiso' },
        } as IHotel;
    });

    describe('getHotelLocation()', () => {
        it('should return empty string when no hotel destinations', () => {
            const hotelLocation = getHotelLocation({} as IHotel);
            expect(hotelLocation).toBe('');
        });

        it('should return full hotel location', () => {
            const hotelLocation = getHotelLocation(mockHotel);
            expect(hotelLocation).toBe('Playa Paraiso, Tenerife, Spain');
        });

        it('should return only country', () => {
            const hotel = { country: { ...mockHotel.country } } as IHotel;

            const hotelLocation = getHotelLocation(hotel);
            expect(hotelLocation).toBe('Spain');
        });

        it('should return only hotel region', () => {
            const hotel = { location: { ...mockHotel.location } } as IHotel;

            const hotelLocation = getHotelLocation(hotel);
            expect(hotelLocation).toBe('Tenerife');
        });

        it('should return only hotel resort', () => {
            const hotel = { resort: { ...mockHotel.resort } } as IHotel;

            const hotelLocation = getHotelLocation(hotel);
            expect(hotelLocation).toBe('Playa Paraiso');
        });

        it('should return hotel location without country when includeCountry is false', () => {
            const hotelLocation = getHotelLocation(mockHotel, false);
            expect(hotelLocation).toBe('Playa Paraiso, Tenerife');
        });
    });

    describe('getHotelLocationHrefs()', () => {
        it('should return empty array when no hotel', () => {
            const hotel = null;
            expect(getHotelLocationHrefs(hotel)).toEqual([]);
        });

        it('should build destinations urls by "name" values', () => {
            expect(getHotelLocationHrefs(mockHotel)).toEqual([
                {
                    key: 'ESTFPP',
                    value: {
                        code: 'ESTFPP',
                        href: '/spain/tenerife/playa-paraiso',
                        linktype: SitecoreLinkType.Internal,
                        target: '_blank',
                        text: 'Playa Paraiso',
                    },
                },
                {
                    key: 'ESTF',
                    value: {
                        code: 'ESTF',
                        href: '/spain/tenerife',
                        linktype: SitecoreLinkType.Internal,
                        target: '_blank',
                        text: 'Tenerife',
                    },
                },
                {
                    key: 'ES',
                    value: {
                        code: 'ES',
                        href: '/spain',
                        linktype: SitecoreLinkType.Internal,
                        target: '_blank',
                        text: 'Spain',
                    },
                },
            ]);
        });

        it('should return purified destinations urls from api', () => {
            mockHotel.country.url = '/country-url';
            mockHotel.location.url = '/region-url';
            mockHotel.resort.url = '/resort-url';

            expect(getHotelLocationHrefs(mockHotel)).toEqual([
                {
                    key: 'ESTFPP',
                    value: expect.objectContaining({ href: '/resort-url' }),
                },
                {
                    key: 'ESTF',
                    value: expect.objectContaining({ href: '/region-url' }),
                },
                {
                    key: 'ES',
                    value: expect.objectContaining({ href: '/country-url' }),
                },
            ]);
        });
    });

    describe('buildHotelDetailsUrl()', () => {
        it('should return purified hotel url from api', () => {
            mockHotel.url = '/hotel-url';
            const url = buildHotelDetailsUrl(mockHotel);
            expect(url).toBe('/hotel-url');
        });

        it('should build hotel url by "name" values', () => {
            const url = buildHotelDetailsUrl(mockHotel);
            expect(url).toBe('/spain/tenerife/playa-paraiso/hard-rock-hotel-tenerife');
        });

        it('should return empty sting when no hotel', () => {
            const url = buildHotelDetailsUrl(null);
            expect(url).toBe('');
        });

        it('should return empty sting when no hotel data', () => {
            const url = buildHotelDetailsUrl({} as IHotel);
            expect(url).toBe('');
        });
    });

    describe('distanceInfo', () => {
        const closestFacility = {
            code: 'Beach',
            distance: 3500,
            groupCode: 'groupCode',
            name: 'name',
        };

        const getFormattedNumber = jest.fn(number => `${number}`);

        it('should return distance info', () => {
            const res = distanceInfo(
                closestFacility,
                SitecoreDictionary.HolidayDistanceLabelsLongDistanceBeach,
                false,
                getFormattedNumber,
            );

            expect(res).toBe(
                `${SitecoreDictionary.HolidayDistanceLabelsLongDistanceBeach} ${closestFacility.name},${
                    closestFacility.distance / 1000
                }`,
            );
        });

        it('should return distance text on editor mode', () => {
            const res = distanceInfo(
                closestFacility,
                SitecoreDictionary.HolidayDistanceLabelsLongDistanceBeach,
                true,
                getFormattedNumber,
            );

            expect(res).toBe(`${SitecoreDictionary.HolidayDistanceLabelsLongDistanceBeach}`);
        });
    });

    describe('getHotelAddress', () => {
        it('should return correct hotel address', () => {
            const resAddress = 'Pinias Street, 5295 Protaras, Larnaca, Cyprus';

            (joinNonEmptyWordsWithComma as jest.Mock).mockReturnValueOnce(resAddress);

            expect(getHotelAddress(mockBooking)).toBe(resAddress);
            expect(joinNonEmptyWordsWithComma).toHaveBeenCalledWith(['Protaras', 'Larnaca', 'Cyprus']);
        });

        it('should return hotel address without postcode when it is not defined in booking fullHotelAddress', () => {
            getHotelAddress({
                package: {
                    accom: {
                        hotel: {
                            fullHotelAddress: {
                                street: 'Pinias Street',
                                city: 'Protaras',
                                region: 'Larnaca',
                                country: 'Cyprus',
                            },
                        },
                    },
                },
            } as IBookingInfo);
            expect(joinNonEmptyWordsWithComma).toHaveBeenCalledWith(['Protaras', 'Larnaca', 'Cyprus']);
        });

        it('should return empty string if booking empty', () => {
            expect(getHotelAddress(null)).toBe('');
            expect(joinNonEmptyWordsWithComma).not.toHaveBeenCalled();
        });

        it('should return empty string if booking hotel address is empty', () => {
            mockBooking.package.accom.hotel.fullHotelAddress = undefined;

            expect(getHotelAddress(mockBooking)).toBe('');
            expect(joinNonEmptyWordsWithComma).not.toHaveBeenCalled();
        });
    });
});

describe('getHotelCoordinates', () => {
    it('should return empty coordinates when hotel is null', () => {
        const coordinates = getHotelCoordinates(null);

        expect(coordinates).toEqual({ latitude: '', longitude: '' });
    });

    it('should return hotel coordinates when hotel is not null', () => {
        const hotelMock = { latitude: '123.456', longitude: '789.012' };

        const coordinates = getHotelCoordinates(hotelMock as IHotel);

        expect(coordinates).toEqual({ latitude: hotelMock.latitude, longitude: hotelMock.longitude });
    });

    it('should return empty coordinates when hotel latitude is null', () => {
        const hotelMock = { latitude: null, longitude: '789.012' };

        const coordinates = getHotelCoordinates(hotelMock as IHotel & { latitude: null });

        expect(coordinates).toEqual({ latitude: '', longitude: hotelMock.longitude });
    });

    it('should return empty coordinates when hotel longitude is null', () => {
        const hotelMock = { latitude: '123.456', longitude: null };

        const coordinates = getHotelCoordinates(hotelMock as IHotel & { longitude: null });

        expect(coordinates).toEqual({ latitude: hotelMock.latitude, longitude: '' });
    });

    it('should return empty coordinates when hotel latitude and longitude are null', () => {
        const hotelMock = { latitude: null, longitude: null };

        const coordinates = getHotelCoordinates(hotelMock as IHotel & { latitude: null; longitude: null });

        expect(coordinates).toEqual({ latitude: '', longitude: '' });
    });
});
