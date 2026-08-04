import { CurrencyCode } from 'code/currency';
import { mockBooking } from 'frontend/__mocks__';
import { deepClone } from 'frontend/utils/array.utils';
import { getDestinationHierarchy } from 'frontend/utils/destinations.utils';
import { getWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IDestination } from 'models/data/IDestination';
import { IHotel, IThemeType } from 'models/data/IHotel';
import { IOffer, IUnit } from 'models/data/IOffer';
import { ISelectedSeatDetails } from 'models/data/ISeatMapStore';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import { GEOGRAPHY_ALL_CODE } from 'models/enum/RequestConstants';
import { SeatType } from 'models/enum/SeatType';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import { AmendProductPBPostfix } from 'models/enum/tracking/AmendProductPBPostfix';
import { GuestTypes } from 'models/enum/tracking/GuestTypes';
import { TransferType } from 'models/enum/transfer/TransferType';
import { RoomAllocation } from 'models/RoomAllocation';
import { IAirport } from 'models/sitecore/IAirportsData';

import {
    createFromSearchSelectionItem,
    createToSearchSelectionItem,
    createUniquePipedList,
    findOriginNameByCode,
    generateGenericValues,
    getAncillariesPrice,
    getBoardsTypes,
    getBookingEmail,
    getBrand,
    getCategoryLabel,
    getChildrenAge,
    getCreditStatus,
    getDaysToDepartureBucket,
    getDepartureAirportsCodes,
    getDepartureAirportsNames,
    getDestinationCodes,
    getDestinationLevels,
    getDestinationNames,
    getGuests,
    getHotelFacilities,
    getNumberOfRooms,
    getOffersBrands,
    getOffersDestinationAirportsCodes,
    getOffersDestinationAirportsNames,
    getOffersStarRatings,
    getPageLang,
    getPosition,
    getPromoCodeAmount,
    getRoomsTypesTitles,
    getScreenSize,
    getSearchOriginPageTitle,
    getSeason,
    getTotalPrice,
    getTrackingTransferName,
    groupSeatsByActionType,
    I_DONT_MIND,
    normalizeBoardBasis,
    resolveBoardBasis,
    SearchSelectionCategory,
    SearchSelectionVariant,
    shouldTrackPurchase,
} from './tracking.utils';

jest.mock('frontend/utils/webStorage.utils');

jest.mock('frontend/utils/destinations.utils', () => ({
    getDestinationHierarchy: jest.fn(),
    getDestinationTypeByCodeLength: jest.fn(),
    getDestinationTypeByType: jest.fn(({ type }) => type),
}));

describe('tracking.utils', () => {
    describe('getCategoryLabel', () => {
        it('Call with price more then 0', () => {
            const result = getCategoryLabel('Label', 13);

            expect(result).toBe(`Label: ${AmendProductPBPostfix.UPGRADE}`);
        });

        it('Call with price less then 0', () => {
            const result = getCategoryLabel('Label', -13);

            expect(result).toBe(`Label: ${AmendProductPBPostfix.DOWNGRADE}`);
        });

        it('Call with price 0', () => {
            const result = getCategoryLabel('Label', 0);

            expect(result).toBe(`Label: ${AmendProductPBPostfix.CHANGE}`);
        });
    });

    describe('createUniquePipedList', () => {
        it('should return string without duplicates', () => {
            const res = createUniquePipedList(['A', 'B', 'A']);
            expect(res).toBe('A|B');
        });
    });

    describe('getBrand', () => {
        it('should return type item name', () => {
            const res = getBrand({ itemName: 'Luxury', name: 'Test' } as IThemeType, 'EUBO');
            expect(res).toBe('Luxury');
        });

        it('should return type name as fallback when item name does not exist', () => {
            const res = getBrand({ name: 'Test' } as IThemeType, 'EUBO');
            expect(res).toBe('Test');
        });

        it('should return "Other"', () => {
            const res = getBrand(undefined, 'EUBO');
            expect(res).toBe('Other');
        });
    });

    describe('getGuests', () => {
        it('should return adults amount', () => {
            const rooms = [
                { occupation: { [GuestTypes.Adults]: 1 } },
                { occupation: { [GuestTypes.Adults]: 2 } },
            ] as IUnit[];
            const res = getGuests(rooms, GuestTypes.Adults);
            expect(res).toBe(3);
        });
    });

    describe('getHotelFacilities', () => {
        it('should return all hotel failities', () => {
            const hotel = {
                facilities: [{ items: [{ name: 'A' }, { name: 'B' }] }, { items: [{ name: 'C' }] }],
            } as IHotel;
            const res = getHotelFacilities(hotel);
            expect(res).toBe('A|B|C');
        });

        it('should return empty string', () => {
            const res = getHotelFacilities(null);
            expect(res).toBe('');
        });
    });

    describe('getBoardsTypes', () => {
        it('should return all not nullable unique board types', () => {
            const rooms = [
                { boardType: { title: 'A', itemName: 'E' } },
                { boardType: { title: null } },
                { boardType: { title: 'B' } },
            ] as IUnit[];
            const res = getBoardsTypes(rooms);
            expect(res).toBe('E|B');
        });
    });

    describe('getRoomsTypesTitles', () => {
        it('should return all not nullable unique rooms types titles', () => {
            const rooms = [
                { roomType: { title: 'A', itemName: 'E' } },
                { roomType: { name: 'test' } },
                { roomType: { title: 'B' } },
                { roomType: { title: { value: 'C' } } },
            ] as any[];
            const res = getRoomsTypesTitles(rooms);
            expect(res).toBe('E|B|C');
        });
    });

    describe('getDestinationData', () => {
        it('should return Destination Names', () => {
            const destinations = [
                { type: DestinationType.Country, name: 'Spain', itemName: 'Spain' },
                { type: DestinationType.Region, name: 'Region', itemName: 'Region' },
                { type: DestinationType.Country, name: 'Italy', itemName: 'Italy' },
            ] as IDestination[];
            const res = getDestinationNames(destinations, DestinationType.Country);
            expect(res).toBe('Spain|Italy');
        });

        it('should return Destination Codes', () => {
            const destinations = [
                { type: DestinationType.Country, code: 'ES' },
                { type: DestinationType.Region, code: 'R' },
                { type: DestinationType.Country, code: 'IT' },
            ] as IDestination[];
            const res = getDestinationCodes(destinations, DestinationType.Country);
            expect(res).toBe('ES|IT');
        });
    });

    describe('getOffersDestinationAirportsData', () => {
        const offers = [
            { transport: { routes: [{ arrName: 'London Gatwick', arrPt: 'AGP', arrItemName: 'London Gatwick' }] } },
            { transport: { routes: [{ arrName: 'London Luton', arrPt: 'LTN', arrItemName: 'London Luton' }] } },
        ];

        it('should return Destination airports names', () => {
            const res = getOffersDestinationAirportsNames(offers as IOffer[]);
            expect(res).toBe('London Gatwick|London Luton');
        });

        it('should return Destination airports codes', () => {
            const res = getOffersDestinationAirportsCodes(offers as IOffer[]);
            expect(res).toBe('AGP|LTN');
        });
    });

    describe('getOffersStarRatings', () => {
        it('should return unique star ratings', () => {
            const offers = [{ hotel: { starRating: 3 } }, { hotel: null }, { hotel: { starRating: 3 } }];
            const res = getOffersStarRatings(offers as IOffer[]);
            expect(res).toBe('3');
        });
    });

    describe('getNumberOfRooms', () => {
        it("should return `I don't mind` when isAutoAllocation is true", () => {
            const res = getNumberOfRooms(true, 1);
            expect(res).toBe(I_DONT_MIND);
        });

        it('should return number of rooms as  a string when isAutoAllocation is false', () => {
            const res = getNumberOfRooms(false, 1);
            expect(res).toBe('1');
        });
    });

    describe('getOffersBrands', () => {
        it('should return all offers brands', () => {
            const offers = [
                { accom: { type: { itemName: 'Family' } } },
                { accom: { type: { itemName: 'Luxury' } } },
                { accom: { prom: 'EUBO' } },
            ];
            const res = getOffersBrands(offers as IOffer[]);
            expect(res).toBe('Family|Luxury|Other');
        });
    });

    describe('getSeason', () => {
        it('should return S20', () => {
            const res = getSeason('2020-05-01');
            expect(res).toBe('S20');
        });

        it('should return W21 for Nov2020', () => {
            const res = getSeason('2020-11-02');
            expect(res).toBe('W21');
        });

        it('should return empty string', () => {
            const res = getSeason(null);
            expect(res).toBe('');
        });
    });

    describe('getChildrenAge', () => {
        it('should return children ages', () => {
            const rooms = [new RoomAllocation(), new RoomAllocation()];
            rooms[0].addChild();
            rooms[0].addChild();
            rooms[1].addChild();
            rooms[0].children[0].age = 5;
            rooms[0].children[1].age = 6;
            rooms[1].children[0].age = 7;
            const res = getChildrenAge(rooms);
            expect(res).toBe('5|6|7');
        });
    });

    describe('getDestinationLevels', () => {
        it('should return unique destination types', () => {
            const destinations = [
                { code: 'AT', type: 'Country' },
                { code: 'ATAT', type: 'Region' },
                { code: 'ES', type: 'Country' },
            ];
            const res = getDestinationLevels(destinations as any);
            expect(res).toBe('Country|Region');
        });
    });

    describe('Origins Names', () => {
        const originsWithNames = [
            { name: 'Belfast', code: 'BFS', itemName: 'Belfast' },
            {
                name: 'London',
                code: '',
                children: [
                    { name: 'London Gatwick', code: 'LGW', itemName: 'London Gatwick' },
                    { name: 'London Luton', code: 'LTN', itemName: 'London Luton' },
                ],
            },
        ];

        describe('findOriginNameByCode', () => {
            it('should return parent origin name', () => {
                const res = findOriginNameByCode('BFS', originsWithNames);
                expect(res).toBe('Belfast');
            });

            it('should return child origin name', () => {
                const res = findOriginNameByCode('LTN', originsWithNames);
                expect(res).toBe('London Luton');
            });

            it('should return null', () => {
                const res = findOriginNameByCode('Test', originsWithNames);
                expect(res).toBeNull();
            });
        });

        describe('getDepartureAirportsNames', () => {
            it('should return piped origins names', () => {
                const res = getDepartureAirportsNames(['BFS', 'LTN'], originsWithNames);
                expect(res).toBe('Belfast|London Luton');
            });

            it('should return origins names & codes', () => {
                const res = getDepartureAirportsCodes(['BFS', 'LTN'], originsWithNames);
                expect(res).toStrictEqual([
                    { code: 'BFS', name: 'Belfast' },
                    { code: 'LTN', name: 'London Luton' },
                ]);
            });
        });
    });

    describe.each([
        [0, 1, 10, 1],
        [9, 2, 10, 20],
    ])('getPosition', (index, page, itemsPerPage, expected) => {
        it(`should return ${expected}`, () => {
            expect(getPosition(index, page, itemsPerPage)).toBe(expected);
        });
    });

    describe.each([
        [[], 0],
        [[{ code: PriceBreakdownCode.Promotions, amount: -100 }], 100],
    ])('getPromoCodeAmount', (priceBreakdown, expected) => {
        it(`should return ${expected}`, () => {
            expect(getPromoCodeAmount(priceBreakdown as any)).toBe(expected);
        });
    });

    describe.each([
        [{ isScreenExtraLarge: true }, 'Extra large'],
        [{ isScreenLarge: true }, 'Large'],
        [{ isScreenMedium: true }, 'Medium'],
        [{ isScreenSmall: true }, 'Small'],
        [{}, 'Extra small'],
    ])('getScreenSize', (size, expected) => {
        it(`should return ${expected}`, () => {
            expect(getScreenSize(size as any)).toBe(expected);
        });
    });

    describe('shouldTrackPurchase', () => {
        const utils = require('frontend/utils/paymentTransaction');

        it('should return true if there is not transaction', () => {
            jest.spyOn(utils, 'getTransaction').mockReturnValue(null);
            const res = shouldTrackPurchase();
            expect(res).toBeTruthy();
        });

        it("should return true if transaction's done and not been tracked", () => {
            jest.spyOn(utils, 'getTransaction').mockReturnValue({});
            jest.spyOn(utils, 'isTransactionDone').mockReturnValue(true);
            jest.spyOn(utils, 'isTransactionTracked').mockReturnValue(false);
            const res = shouldTrackPurchase();
            expect(res).toBeTruthy();
        });

        it("should return false if transaction's been tracked", () => {
            jest.spyOn(utils, 'getTransaction').mockReturnValue({});
            jest.spyOn(utils, 'isTransactionTracked').mockReturnValue(true);
            const res = shouldTrackPurchase();
            expect(res).toBeFalsy();
        });
    });

    describe('groupSeatsByActionType', () => {
        const newSeats = [
            {
                paxIndex: 1,
                seatNumber: '6D',
                priceBand: SeatType.UpFront,
                price: 42.99,
                products: [],
            },
            {
                paxIndex: 2,
                seatNumber: '10B',
                priceBand: SeatType.Standard,
                price: 42.99, // standard price equal to up front because of downgrade. we don't provide refund
                products: [],
            },
            {
                paxIndex: 3,
                seatNumber: '12C',
                priceBand: SeatType.Standard,
                price: 8.99,
                products: [],
            },
            {
                paxIndex: 4,
                seatNumber: '10D',
                priceBand: SeatType.Standard,
                price: 8.99,
                products: [],
            },
        ] as ISelectedSeatDetails[];
        const prevSeats = [
            {
                paxIndex: 1,
                seatNumber: '10A',
                priceBand: SeatType.Standard,
                price: 8.99,
                products: [],
            },
            {
                paxIndex: 2,
                seatNumber: '6E',
                priceBand: SeatType.UpFront,
                price: 42.99,
                products: [],
            },

            {
                paxIndex: 3,
                seatNumber: '10C',
                priceBand: SeatType.Standard,
                price: 8.99,
                products: [],
            },
            {
                paxIndex: 4,
                seatNumber: '10D',
                priceBand: SeatType.Standard,
                price: 8.99,
                products: [],
            },
        ] as ISelectedSeatDetails[];

        it('should create ADD group when customer added seats', () => {
            const seatsByActionType = groupSeatsByActionType(newSeats, []);

            const ADDGroup = seatsByActionType[AmendProductPBPostfix.ADD];

            expect(ADDGroup).toEqual(newSeats);
            expect(Object.keys(seatsByActionType).length).toEqual(1);
            expect(ADDGroup![0].priceDiff).toBeUndefined();
        });

        it('should create UPGRADE group when customer upgraded their seats', () => {
            const seatsByActionType = groupSeatsByActionType([newSeats[0]], [prevSeats[0]]);

            const UPGRADEGroup = seatsByActionType[AmendProductPBPostfix.UPGRADE];

            expect(UPGRADEGroup).toEqual([newSeats[0]]);
            expect(Object.keys(seatsByActionType).length).toEqual(1);
            expect(UPGRADEGroup![0].priceDiff).toEqual(newSeats[0].price! - prevSeats[0].price!);
        });

        it('should create DOWNGRADE group when customer downgrades their seats', () => {
            const seatsByActionType = groupSeatsByActionType([newSeats[1]], [prevSeats[1]]);

            const DOWNGRADEGroup = seatsByActionType[AmendProductPBPostfix.DOWNGRADE];

            expect(DOWNGRADEGroup).toEqual([newSeats[1]]);
            expect(Object.keys(seatsByActionType).length).toEqual(1);
            expect(DOWNGRADEGroup![0].priceDiff).toEqual(0);
        });

        it('should create DOWNGRADE group when customer downgrades their seats when new price less old one', () => {
            const newDowngradedSeat = { ...newSeats[1], price: 8.99 };
            const seatsByActionType = groupSeatsByActionType([newDowngradedSeat], [prevSeats[1]]);

            expect(seatsByActionType[AmendProductPBPostfix.DOWNGRADE]).toEqual([newDowngradedSeat]);
            expect(Object.keys(seatsByActionType).length).toEqual(1);
        });

        it('should create CHANGE group when customer changed their seats in the same seat band', () => {
            const seatsByActionType = groupSeatsByActionType([newSeats[2]], [prevSeats[2]]);

            const CHANGEGroup = seatsByActionType[AmendProductPBPostfix.CHANGE];

            expect(CHANGEGroup).toEqual([newSeats[2]]);
            expect(Object.keys(seatsByActionType).length).toEqual(1);
            expect(CHANGEGroup![0].priceDiff).toEqual(0);
        });
    });

    describe('getTrackingTransferName', () => {
        it('should return correct tracking name for transfer', () => {
            expect(getTrackingTransferName(TransferType.NoTransfer)).toEqual('Private');
        });
    });

    describe('generateGenericValues', () => {
        it('should fill unused values with null', () => {
            const res = generateGenericValues({
                genericValue1: '123',
                genericValue3: '456',
                destinationUrl: '789',
            });
            expect(res).toMatchObject({
                genericValue1: '123',
                genericValue2: null,
                genericValue3: '456',
                genericValue4: null,
                destinationUrl: '789',
            });
        });
    });

    describe('getTotalPrice', () => {
        it('should return 0 when no items passed', () => {
            expect(getTotalPrice([])).toBe(0);
        });

        it('should return 0 when all items has no price', () => {
            const items = [{}, {}] as any;

            expect(getTotalPrice(items)).toBe(0);
        });

        it('should return sum of all passed items', () => {
            const items = [{ price: 5 }, { price: 10 }] as any;

            expect(getTotalPrice(items)).toBe(15);
        });
    });

    describe('getAncillariesPrice', () => {
        it('should return 0 when no ancillaries in booking', () => {
            const booking = { extraLuggageInfo: { items: [] } } as any;

            expect(getAncillariesPrice(booking)).toBe(0);
        });

        it('should return only bags price when no seat selected', () => {
            const booking = { extraLuggageInfo: { items: [{ price: 35 }, { price: 78 }] } } as any;

            expect(getAncillariesPrice(booking)).toBe(113);
        });

        it('should return only seats price when no extraLuggage selected', () => {
            const booking = {
                extraLuggageInfo: { items: [] },
                seatSelection: [{ seats: [{ price: 45 }] }, { seats: [{ price: 27 }] }],
            } as any;

            expect(getAncillariesPrice(booking)).toBe(72);
        });

        it('should return sum of ancillaries price in booking', () => {
            const booking = {
                extraLuggageInfo: { items: [{ price: 67 }, { price: 34 }] },
                seatSelection: [{}, { seats: [{ price: 27 }] }],
            } as any;

            expect(getAncillariesPrice(booking)).toBe(128);
        });

        it('should return airportParking price included in the sum of ancillaries when it is selected', () => {
            const booking = {
                airportParking: { bookingDetails: { totalPrice: 90 } },
                seatSelection: [{}, { seats: [{ price: 27 }] }],
            } as any;

            expect(getAncillariesPrice(booking)).toBe(117);
        });
    });

    describe('getSearchOriginPageTitle', () => {
        [
            { returnValue: 'prevLayoutName', prevTemplateId: 'HomePage' },
            { returnValue: 'prevLayoutName', prevTemplateId: 'HotelDetailsBrowse' },
            { returnValue: 'prevLayoutName', prevTemplateId: 'AllDestinationsPage' },
            { returnValue: 'prevLayoutName', prevTemplateId: 'ResortBrowsePage' },
            { returnValue: 'prevLayoutName', prevTemplateId: 'DealsPage' },
            { returnValue: 'Promo: Not Found', prevTemplateId: 'PromoPage' },
            { returnValue: 'Promo: Not Found', prevTemplateId: 'DynamicPromoPage' },
            { returnValue: 'Promo: Not Found', prevTemplateId: 'RecurringPromoPage' },
            { returnValue: 'Promo: Not Found', prevTemplateId: 'PeriodDrivenPromoPage' },
            { returnValue: 'Destination Guide: prevLayoutName', prevTemplateId: 'DestinationPage' },
            { returnValue: 'Destination Guide: prevLayoutName', prevTemplateId: 'CountryBrowsePage' },
            { returnValue: 'Destination Guide: prevLayoutName', prevTemplateId: 'RegionBrowsePage' },
            { returnValue: 'Destination Guide: prevLayoutName', prevTemplateId: 'VirtualRegionBrowsePage' },
            { returnValue: null, prevTemplateId: 'CreateAccountPage' },
        ].forEach(({ returnValue, prevTemplateId }) => {
            it(`should return ${returnValue} when prev template id is ${prevTemplateId}`, () => {
                expect(getSearchOriginPageTitle(SitecoreTemplateId[prevTemplateId], 'prevLayoutName')).toBe(
                    returnValue,
                );
            });
        });
    });

    describe('getCreditStatus', () => {
        it('should return Not Available when there is no credit information', () => {
            expect(getCreditStatus([])).toEqual('Not Available');
        });

        it('should return currencies in which user has credits', () => {
            const credits = [
                {
                    balance: 100,
                    currency: CurrencyCode.CHF,
                    hasCreditHistory: true,
                    creditIsEnabled: true,
                },
                {
                    balance: 500,
                    currency: CurrencyCode.GBP,
                    hasCreditHistory: true,
                    creditIsEnabled: true,
                },
            ] as any;
            expect(getCreditStatus(credits)).toEqual('CHF|GBP');
        });

        it('should return No when user do not have any credits', () => {
            const credits = [
                {
                    balance: 0,
                    currency: CurrencyCode.CHF,
                    hasCreditHistory: true,
                    creditIsEnabled: true,
                },
                {
                    balance: 0,
                    currency: CurrencyCode.GBP,
                    hasCreditHistory: true,
                    creditIsEnabled: true,
                },
            ] as any;
            expect(getCreditStatus(credits)).toEqual('No');
        });
    });

    describe('getDaysToDepartureBucket', () => {
        it('return on holiday when booking departure date is in the past', () => {
            const booking = {
                ...mockBooking,
            };
            expect(getDaysToDepartureBucket(booking)).toEqual('On Holiday');
        });

        it('return -24Hr when booking departure date is in the next 24 hours', () => {
            const booking = deepClone(mockBooking);
            booking.package.transport.routes[0].depDate = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString();

            expect(getDaysToDepartureBucket(booking)).toEqual('-24Hr');
        });

        it('return -5 when booking departure date is in the next 5 days', () => {
            const booking = deepClone(mockBooking);
            booking.package.transport.routes[0].depDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();

            expect(getDaysToDepartureBucket(booking)).toEqual('-5');
        });

        it('return -28 when booking departure date is in the next 28 days', () => {
            const booking = deepClone(mockBooking);
            booking.package.transport.routes[0].depDate = new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString();

            expect(getDaysToDepartureBucket(booking)).toEqual('-28');
        });

        it('return 28+ when booking departure date is in the next 28+ days', () => {
            const booking = deepClone(mockBooking);
            booking.package.transport.routes[0].depDate = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString();

            expect(getDaysToDepartureBucket(booking)).toEqual('28+');
        });
    });

    describe('getPageLang', () => {
        it('should return correct lang', () => {
            const lang = getPageLang('ch-fr');

            expect(lang).toBe('FR-CH');
        });

        it('should return default value', () => {
            const lang = getPageLang('');

            expect(lang).toBe('EN');
        });
    });

    describe('getBookingEmail', () => {
        it('should return lowercased email when it is passed', () => {
            expect(getBookingEmail('eXAmple@test.com')).toBe('example@test.com');
            expect(getWebStorageItem).not.toHaveBeenCalled();
        });

        it('should return email from sessionStorage when undefined is passed', () => {
            const email = 'json@test.com';
            jest.mocked(getWebStorageItem).mockReturnValueOnce([{ isLead: true, email: email }]);

            expect(getBookingEmail(undefined)).toBe(email);
            expect(getWebStorageItem).toHaveBeenCalledWith('guestDetails', true, {});
        });

        it('should return undefined from sessionStorage when isLead is false', () => {
            const email = 'json@test.com';
            jest.mocked(getWebStorageItem).mockReturnValueOnce([{ isLead: false, email: email }]);

            expect(getBookingEmail(undefined)).toBe(undefined);
            expect(getWebStorageItem).toHaveBeenCalledWith('guestDetails', true, {});
        });

        it('should return undefined when no data is passed or found in session-storage', () => {
            jest.mocked(getWebStorageItem).mockReturnValueOnce(undefined);

            expect(getBookingEmail(undefined)).toBe(undefined);
            expect(getWebStorageItem).toHaveBeenCalledWith('guestDetails', true, {});
        });
    });

    describe('createFromSearchSelectionItem', () => {
        let airport: IAirport;

        beforeEach(() => {
            airport = {
                code: 'LGW',
                name: 'London Gatwick',
                itemName: 'London Gatwick',
                countryName: 'United Kingdom',
            };
        });

        it('should create a valid selection object from an airport', () => {
            const result = createFromSearchSelectionItem(airport, null);

            expect(result).toEqual({
                item_id: 'LGW',
                item_name: 'London Gatwick',
                item_category: SearchSelectionCategory.Departure,
                item_category2: 'United Kingdom',
                item_category3: null,
                item_category4: null,
                item_category5: null,
                item_variant: SearchSelectionVariant.DepartureAirport,
                item_generic_1: null,
                price: 0,
                quantity: 1,
            });
        });

        it('should use the provided country when the airport has no countryName', () => {
            airport.countryName = undefined;
            const result = createFromSearchSelectionItem(airport, 'United Kingdom');

            expect(result.item_category2).toBe('United Kingdom');
        });

        it('should set item_category2 to null if both airport.countryName and country are missing', () => {
            airport.countryName = undefined;
            const result = createFromSearchSelectionItem(airport, undefined);

            expect(result.item_category2).toBeNull();
        });

        it('should assign an empty string to item_name if itemName is missing', () => {
            airport.itemName = undefined;
            const result = createFromSearchSelectionItem(airport, undefined);

            expect(result.item_name).toBe('');
        });
    });

    describe('createToSearchSelectionItem', () => {
        let destination: IDestination;

        beforeEach(() => {
            destination = {
                code: 'BCN',
                name: 'Barcelona',
                itemName: 'Barcelona',
                type: DestinationType.Region,
            };
        });

        it('should create a valid destination selection with full hierarchy for hotel destination', () => {
            destination.trackingHotelTheme = 'trackingHotelTheme';
            (getDestinationHierarchy as jest.Mock).mockReturnValue({
                [DestinationType.Country]: 'Spain',
                [DestinationType.Region]: 'Catalonia',
                [DestinationType.Resort]: 'Costa Brava',
                [DestinationType.Hotel]: 'Hotel Arts Barcelona',
            });

            const result = createToSearchSelectionItem(destination);

            expect(result).toEqual({
                item_id: 'BCN',
                item_name: 'Barcelona',
                item_category: SearchSelectionCategory.Destination,
                item_category2: 'Spain',
                item_category3: 'Catalonia',
                item_category4: 'Costa Brava',
                item_category5: 'Hotel Arts Barcelona',
                item_variant: DestinationType.Region,
                item_generic_1: destination.trackingHotelTheme,
                price: 0,
                quantity: 1,
            });
        });

        it('should handle missing hierarchy values and hotel theme for not hotel destination', () => {
            (getDestinationHierarchy as jest.Mock).mockReturnValue({
                [DestinationType.Country]: 'Italy',
                [DestinationType.Region]: null,
                [DestinationType.Resort]: null,
                [DestinationType.Hotel]: null,
            });

            const result = createToSearchSelectionItem(destination);

            expect(result.item_category2).toBe('Italy');
            expect(result.item_category3).toBeNull();
            expect(result.item_category4).toBeNull();
            expect(result.item_category5).toBeNull();
            expect(result.item_generic_1).toBeNull();
        });

        it('should use "Anywhere" values when destination code equals GEOGRAPHY_ALL_CODE', () => {
            destination.code = GEOGRAPHY_ALL_CODE;
            (getDestinationHierarchy as jest.Mock).mockReturnValue({});

            const result = createToSearchSelectionItem(destination);

            expect(result).toEqual({
                item_id: SearchSelectionVariant.Anywhere,
                item_name: SearchSelectionVariant.Anywhere,
                item_category: SearchSelectionCategory.Destination,
                item_category2: SearchSelectionVariant.Anywhere,
                item_category3: null,
                item_category4: null,
                item_category5: null,
                item_variant: SearchSelectionVariant.Anywhere,
                item_generic_1: null,
                price: 0,
                quantity: 1,
            });
        });

        it('should use empty string for item_name when itemName is missing', () => {
            destination.itemName = undefined;
            const result = createToSearchSelectionItem(destination);

            expect(result.item_name).toBe('');
        });

        it('should allow null type and return it as item_variant', () => {
            destination.type = undefined;
            const result = createToSearchSelectionItem(destination);

            expect(result.item_variant).toBeNull();
        });

        it('should create a valid destination selection with full hierarchy for resort based in Virtual Country', () => {
            destination = {
                code: 'GBSCED',
                name: 'Edinburgh City',
                itemName: 'Edinburgh City',
                type: DestinationType.Resort,
                trackingHotelTheme: 'trackingTheme',
            };
            (getDestinationHierarchy as jest.Mock).mockReturnValue({
                [DestinationType.Country]: 'United Kingdom',
                [DestinationType.VirtualCountry]: 'Scotland',
                [DestinationType.Resort]: 'Edinburgh City',
            });

            const result = createToSearchSelectionItem(destination);

            expect(result).toEqual({
                item_id: 'GBSCED',
                item_name: 'Edinburgh City',
                item_category: SearchSelectionCategory.Destination,
                item_category2: 'United Kingdom',
                item_category3: 'Scotland',
                item_category4: 'Edinburgh City',
                item_category5: null,
                item_variant: DestinationType.Resort,
                item_generic_1: destination.trackingHotelTheme,
                price: 0,
                quantity: 1,
            });
        });
    });

    describe('normaliseBoardBasis', () => {
        describe('when code matches a known board type', () => {
            it('should normalise "ai" to "allInclusive"', () => {
                expect(normalizeBoardBasis('ai')).toBe('allInclusive');
            });

            it('should normalise "AI" (uppercase) to "allInclusive"', () => {
                expect(normalizeBoardBasis('AI')).toBe('allInclusive');
            });

            it('should normalise "hb" to "halfBoard"', () => {
                expect(normalizeBoardBasis('hb')).toBe('halfBoard');
            });

            it('should normalise "fb" to "fullBoard"', () => {
                expect(normalizeBoardBasis('fb')).toBe('fullBoard');
            });

            it('should normalise "bb" to "bedAndBreakfast"', () => {
                expect(normalizeBoardBasis('bb')).toBe('bedAndBreakfast');
            });

            it('should normalise "sc" to "selfCatering"', () => {
                expect(normalizeBoardBasis('sc')).toBe('selfCatering');
            });

            it('should normalise "ro" to "roomOnly"', () => {
                expect(normalizeBoardBasis('ro')).toBe('roomOnly');
            });

            it('should normalise "ao" to "roomOnly"', () => {
                expect(normalizeBoardBasis('ao')).toBe('roomOnly');
            });
        });

        describe('when code does not match a known board type', () => {
            it('should return lowercase unknown code as-is', () => {
                expect(normalizeBoardBasis('unknown')).toBe('unknown');
            });

            it('should return empty string when passed empty code', () => {
                expect(normalizeBoardBasis('')).toBe('');
            });

            it('should return lowercase of mixed case unknown code', () => {
                expect(normalizeBoardBasis('UnKnOwN')).toBe('unknown');
            });
        });
    });

    describe('resolveBoardBasis', () => {
        describe('when boardFilterOptions is empty', () => {
            it('should normalise code using normaliseBoardBasis when no filter options available', () => {
                expect(resolveBoardBasis('ai', [])).toBe('allInclusive');
            });

            it('should return unmapped code as lowercase when no filter options available', () => {
                expect(resolveBoardBasis('unknown', [])).toBe('unknown');
            });
        });

        describe('when code matches a direct option in boardFilterOptions', () => {
            it('should resolve parent code by normalising matched option code', () => {
                const boardFilterOptions = [
                    {
                        code: 'AI',
                        children: [],
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                        name: 'All Inclusive',
                    },
                    { code: 'HB', children: [], count: 0, groupCode: FilterGroupCodes.BoardType, name: 'Half Board' },
                ];

                expect(resolveBoardBasis('ai', boardFilterOptions)).toBe('allInclusive');
            });

            it('should normalise direct match case-insensitively', () => {
                const boardFilterOptions = [
                    {
                        code: 'AI',
                        children: [],
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                        name: 'All Inclusive',
                    },
                ];

                expect(resolveBoardBasis('AI', boardFilterOptions)).toBe('allInclusive');
                expect(resolveBoardBasis('Ai', boardFilterOptions)).toBe('allInclusive');
            });
        });

        describe('when code matches a child option in boardFilterOptions', () => {
            it('should resolve to parent code when code matches a child option', () => {
                const boardFilterOptions = [
                    {
                        code: 'AI',
                        children: [
                            {
                                code: 'AI+',
                                children: [],
                                count: 0,
                                groupCode: FilterGroupCodes.BoardType,
                                name: 'All Inclusive Plus',
                            },
                            {
                                code: 'AS',
                                children: [],
                                count: 0,
                                groupCode: FilterGroupCodes.BoardType,
                                name: 'All Inclusive Superior',
                            },
                        ],
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                        name: 'All Inclusive',
                    },
                ];

                expect(resolveBoardBasis('ai+', boardFilterOptions)).toBe('allInclusive');
                expect(resolveBoardBasis('as', boardFilterOptions)).toBe('allInclusive');
            });

            it('should resolve to correct parent when multiple parents exist', () => {
                const boardFilterOptions = [
                    {
                        code: 'AI',
                        children: [
                            {
                                code: 'AI+',
                                children: [],
                                count: 0,
                                groupCode: FilterGroupCodes.BoardType,
                                name: 'All Inclusive Plus',
                            },
                        ],
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                        name: 'All Inclusive',
                    },
                    {
                        code: 'HB',
                        children: [
                            {
                                code: 'HB+',
                                children: [],
                                count: 0,
                                groupCode: FilterGroupCodes.BoardType,
                                name: 'Half Board Plus',
                            },
                        ],
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                        name: 'Half Board',
                    },
                ];

                expect(resolveBoardBasis('ai+', boardFilterOptions)).toBe('allInclusive');
                expect(resolveBoardBasis('hb+', boardFilterOptions)).toBe('halfBoard');
            });

            it('should normalise child match case-insensitively', () => {
                const boardFilterOptions = [
                    {
                        code: 'AI',
                        children: [
                            {
                                code: 'AI+',
                                children: [],
                                count: 0,
                                groupCode: FilterGroupCodes.BoardType,
                                name: 'All Inclusive Plus',
                            },
                        ],
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                        name: 'All Inclusive',
                    },
                ];

                expect(resolveBoardBasis('AI+', boardFilterOptions)).toBe('allInclusive');
                expect(resolveBoardBasis('Ai+', boardFilterOptions)).toBe('allInclusive');
            });
        });

        describe('when code does not match any options', () => {
            it('should fall back to normaliseBoardBasis when code not found in options', () => {
                const boardFilterOptions = [
                    {
                        code: 'AI',
                        children: [
                            {
                                code: 'AI+',
                                children: [],
                                count: 0,
                                groupCode: FilterGroupCodes.BoardType,
                                name: 'All Inclusive Plus',
                            },
                        ],
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                        name: 'All Inclusive',
                    },
                ];

                expect(resolveBoardBasis('unknown', boardFilterOptions)).toBe('unknown');
            });

            it('should normalise code on fallback', () => {
                const boardFilterOptions = [
                    {
                        code: 'AI',
                        children: [],
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                        name: 'All Inclusive',
                    },
                ];

                expect(resolveBoardBasis('hb', boardFilterOptions)).toBe('halfBoard');
            });
        });
    });
});
