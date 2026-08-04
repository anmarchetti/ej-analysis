import { luggagePackageIcon, mockHotel, mockLivePrice, mockLuggageListFields } from 'frontend/__mocks__';
import {
    cabinBagsMock,
    generateLuggageInfoItemMock,
    luggageInfoMock,
    luggageInfoMockAlt,
    mockDefaultBags,
    smallSportEquipmentMock,
} from 'frontend/__mocks__/extraLuggage';
import * as shortlistUtils from 'frontend/utils/shortlist.utils';
import { IExtraLuggageInfo, IFlightExtras, ILuggageInfoItem } from 'models/data/IFlightExtras';
import { IAccomData, IOffer, IUnit } from 'models/data/IOffer';
import { mockHoldLugggageLists } from 'frontend/components/renderings/HoldLuggagePopup/__mocks__/mockHoldLuggagePopupFields';

import {
    checkIfExtrasCategoryExists,
    countGuest,
    generateExtraLuggageFullInfo,
    generateLargeSportEquipmentInfo,
    generateSmallSportEquipmentInfo,
    getDefaultBagsOneDirection,
    getExtraLuggageFromLivePriceAndOffer,
    getGuestAmountFromAccom,
    getHoldItemsLabel,
    getIsSportEquipmentAvailableSeason,
    getLuggageAmount,
    getLuggageIcon,
    getLuggageTypes,
    getRoomTypes,
    getVisitorsAmount,
    isMatchingLuggageIcon,
} from './luggage.utils';

const createProps = () => ({
    guestsAmount: {
        adults: 1,
        children: 10,
        infants: 100,
    },
    fields: mockLuggageListFields,
    luggage: {
        items: [
            {
                passengerId: 'passenger1',
                itemCode: 'item1',
                quantity: 1,
                price: 1,
            },
            {
                passengerId: 'passenger2',
                itemCode: 'item2',
                quantity: 10,
                price: 10,
            },
            {
                passengerId: 'passenger3',
                itemCode: 'item3',
                quantity: 100,
                price: 100,
            },
        ],
    } as Nullable<IExtraLuggageInfo>,
    offer: {
        id: 'id',
        date: '12-12-2023',
        stay: 5,
        price: 2000,
        pricePP: 400,
        altBoards: [],
        accom: {
            date: '12-12-2023',
            stay: 5,
            id: 'id',
            packageId: 'pid',
            code: 'code',
            unit: [
                { occupation: { adults: 1, children: 10, infants: 100 } },
                { occupation: { adults: 1, children: 10, infants: 100 } },
            ],
            prom: 'prom',
            isExt: false,
        } as IAccomData<IUnit>,
        transport: { routes: [] },
        transfers: [],
        hotel: null,
        ecoFacility: undefined,
        hasDistressedFlights: false,
        extraLuggageInfo: { items: [] },
        touristTax: 0,
        touristTaxPP: 0,
        hasDiscountedBoardUpgrade: false,
        priceExcludingTouristTax: 2000,
        pricePPExcludingTouristTax: 400,
    } as IOffer,
});

let mockProps = createProps();

const spyIsShortlistedOfferUnavailableForBooking = jest.spyOn(
    shortlistUtils,
    'isShortlistedOfferUnavailableForBooking',
);

describe('luggage.utils', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    describe('getRoomTypes', () => {
        it('should return roomTypes from rooms when isBooking is true', () => {
            const accom = {
                rooms: [{ roomType: 'Single' }, { roomType: 'Double' }, {}],
            };

            const result = getRoomTypes(true, accom);
            expect(result).toStrictEqual(['Single', 'Double']);
        });

        it('should return roomTypes from unit when isBooking is false', () => {
            const accom = {
                unit: [{ roomType: 'Single' }, { roomType: 'Double' }, {}],
            };

            const result = getRoomTypes(false, accom);
            expect(result).toStrictEqual(['Single', 'Double']);
        });

        it('should return empty array when units are not provided', () => {
            const result = getRoomTypes(true);
            expect(result).toStrictEqual([]);
        });
    });

    describe('getVisitorsAmount', () => {
        it('should return 0 when guestsAmount not provided', () => {
            mockProps.guestsAmount = null as any;
            const result = getVisitorsAmount(mockProps.guestsAmount);

            expect(result).toStrictEqual(0);
        });

        it('should count adults, children and infants', () => {
            const result = getVisitorsAmount(mockProps.guestsAmount);

            expect(result).toStrictEqual(111);
        });
    });

    describe('getLuggageTypes', () => {
        it('should return empty array when luggage not provided', () => {
            mockProps.luggage = null as any;
            const result = getLuggageTypes(mockProps.luggage);

            expect(result).toStrictEqual([]);
        });

        it('should return 3 objects with amount 1', () => {
            const result = getLuggageTypes(mockProps.luggage);

            expect(result).toStrictEqual([
                { amount: 1, type: 'item1' },
                { amount: 1, type: 'item2' },
                { amount: 1, type: 'item3' },
            ]);
        });

        it('should return 1 object with amount 3', () => {
            mockProps.luggage = {
                items: [
                    {
                        passengerId: 'passenger1',
                        itemCode: 'item1',
                        quantity: 1,
                        price: 1,
                    },
                    {
                        passengerId: 'passenger2',
                        itemCode: 'item1',
                        quantity: 10,
                        price: 10,
                    },
                    {
                        passengerId: 'passenger3',
                        itemCode: 'item1',
                        quantity: 100,
                        price: 100,
                    },
                ],
            } as Nullable<IExtraLuggageInfo>;
            const result = getLuggageTypes(mockProps.luggage);

            expect(result).toStrictEqual([{ amount: 3, type: 'item1' }]);
        });
    });

    describe('getGuestAmountFromAccom', () => {
        it('should return object with sum of guests', () => {
            const result = getGuestAmountFromAccom(mockProps.offer.accom as any);

            expect(result).toStrictEqual({ adults: 2, children: 20, infants: 200 });
        });

        it('should return object without sum of guests when accom NOT provided', () => {
            mockProps.offer.accom = null as any;
            const result = getGuestAmountFromAccom(mockProps.offer.accom as any);

            expect(result).toStrictEqual({ adults: 0, children: 0, infants: 0 });
        });
    });

    describe('countGuest', () => {
        it('should return sum of all guests', () => {
            const result = countGuest(mockProps.offer);

            expect(result).toStrictEqual(222);
        });

        it('should return sum of all guests excluding infants when excludeInfants is true', () => {
            const result = countGuest(mockProps.offer, true);

            expect(result).toStrictEqual(22);
        });
    });

    describe('checkIfExtrasCategoryExists', () => {
        const extras = [
            {
                flightExtraCategories: [{ categoryCode: 'A1' }, { categoryCode: 'B2' }],
            },
            {
                flightExtraCategories: [{ categoryCode: 'A1' }, { categoryCode: 'B2' }],
            },
        ] as IFlightExtras[];

        it('should return true if single categoryCode is present', () => {
            const categoryCodes = 'A1';
            const isPresent = checkIfExtrasCategoryExists(extras, categoryCodes);
            expect(isPresent).toBe(true);
        });

        it('should return true if one of multiple categoryCodes is present', () => {
            const categoryCodes = ['B2', 'E5'];
            const isPresent = checkIfExtrasCategoryExists(extras, categoryCodes);
            expect(isPresent).toBe(true);
        });

        it('should return false if none of multiple categoryCodes are present', () => {
            const categoryCodes = ['E5', 'F6'];
            const isPresent = checkIfExtrasCategoryExists(extras, categoryCodes);
            expect(isPresent).toBe(false);
        });

        it('should return false if single categoryCode is not present', () => {
            const categoryCodes = 'E5';
            const isPresent = checkIfExtrasCategoryExists(extras, categoryCodes);
            expect(isPresent).toBe(false);
        });

        it('should return false if categoryCodes is an empty array', () => {
            const categoryCodes: string[] = [];
            const isPresent = checkIfExtrasCategoryExists(extras, categoryCodes);
            expect(isPresent).toBe(false);
        });

        it('should return false when extras length is 0', () => {
            const isPresent = checkIfExtrasCategoryExists([], 'ABC');
            expect(isPresent).toBe(false);
        });
    });

    describe('getLuggageIcon', () => {
        it('should return icon from packageIcons which matches to extraLuggageItems', () => {
            const result = getLuggageIcon(mockHotel.theme.packageIcons, luggageInfoMockAlt.items);

            expect(result).toEqual(mockHotel.theme.packageIcons[1]);
        });

        it('should return LUG icon from packageIcons when no matches icon were found in extraLuggageItems', () => {
            const result = getLuggageIcon(mockHotel.theme.packageIcons, [
                generateLuggageInfoItemMock('1', '1', 'LUG_TEST', 'BAGE', 2, 50),
                generateLuggageInfoItemMock('1', '1', 'BIKE', 'SEO', 2, 100),
            ]);

            expect(result).toEqual(mockHotel.theme.packageIcons[1]);
        });

        it('should return UnderSeatBag icon from packageIcons when extra luggage is []', () => {
            const result = getLuggageIcon(mockHotel.theme.packageIcons, []);

            expect(result).toEqual(mockHotel.theme.packageIcons[2]);
        });
    });

    describe('getLuggageAmount', () => {
        it('should return number of extraLuggage items divided by NUMBER_OF_ROUTES', () => {
            const offer = {
                extraLuggageInfo: {
                    items: [{ itemCode: 'LUG' }, { itemCode: 'LUG' }, { itemCode: 'LUG' }, { itemCode: 'LUG' }],
                },
            } as IOffer;

            expect(getLuggageAmount(offer)).toBe(2);
        });

        it('should return sum number of adults and children when extraLuggageInfo is NOT provided', () => {
            const offer = {
                accom: { unit: [{ occupation: { adults: 2, children: 1 } }] },
            } as IOffer;

            expect(getLuggageAmount(offer)).toBe(3);
        });
    });

    describe('getHoldItemsLabel', () => {
        it('should render singleBagLabel label when amount of luggage is 1', () => {
            expect(getHoldItemsLabel(1, k => k)).toBe('1 Basket.Labels.HoldBagSingular');
        });

        it('should render pluralBagLabel label when amount of luggage is greater than 1', () => {
            expect(getHoldItemsLabel(7, k => k)).toBe('7 Basket.Labels.HoldBagsPlural');
        });

        it('should render noBagsLabel label when amount of luggage is 0', () => {
            expect(getHoldItemsLabel(0, k => k)).toBe('Luggage.Labels.HoldBagsNone');
        });
    });

    describe('generate Sport Equipment Info', () => {
        it('generateSmallSportEquipmentInfo should generate correct info with small sport equipment items only', () => {
            const selected = generateSmallSportEquipmentInfo(
                [
                    ...mockDefaultBags,
                    ...cabinBagsMock.items,
                    ...luggageInfoMock.items,
                    ...smallSportEquipmentMock.items,
                ],
                ['SEO', 'SEC'],
                'SEO',
            );

            expect(selected).toEqual({ GBAG: 2 });
        });

        it('generateLargeSportEquipmentInfo should generate correct info with large sport equipment items only', () => {
            const selectedSportEquipment = generateLargeSportEquipmentInfo(
                [...mockDefaultBags, ...cabinBagsMock.items, ...luggageInfoMock.items],
                'SEO',
            );

            expect(selectedSportEquipment).toEqual({
                BIKE: { name: 'Bike', quantity: 1 },
            });
        });
    });

    describe('generateExtraLuggageFullInfo', () => {
        const lugObj = {
            description: 'Description',
            icon: 'src',
            name: '23kg Extra Hold Bag',
            quantity: 1,
            uniqueId: 'LUG',
        };
        const bikeObj = {
            description: 'Description',
            icon: 'src',
            name: 'Bike',
            quantity: 1,
        };

        it('should generate correct info without default bags and cabin bags', () => {
            const [selectedLuggage, selectedSportEquipment] = generateExtraLuggageFullInfo(
                [...mockDefaultBags, ...cabinBagsMock.items, ...luggageInfoMock.items],
                ['SEO', 'SEC'],
                ['BAGE'],
            );

            expect(selectedLuggage).toEqual({
                LUG: lugObj,
            });
            expect(selectedSportEquipment).toEqual({ BIKE: bikeObj });
        });
    });

    it('getDefaultBagsOneDirection should return only default bags for one route', () => {
        expect(
            getDefaultBagsOneDirection([...mockDefaultBags, ...cabinBagsMock.items, ...luggageInfoMock.items]),
        ).toEqual(mockDefaultBags.slice(0, 2));
    });

    describe('getIsSportEquipmentAvailableSeason', () => {
        const seasons = mockHoldLugggageLists.SportEquipmentRestrictedSeasons.fields.RestrictionSeasonsList;

        it('should return true when travel date does NOT exist', () => {
            const result = getIsSportEquipmentAvailableSeason(seasons, undefined);

            expect(result).toEqual(true);
        });

        it('should return true when seasons do NOT exist', () => {
            const result = getIsSportEquipmentAvailableSeason(undefined, new Date('2024-12-15T14:50:00+00:00'));

            expect(result).toEqual(true);
        });

        it('should return true when NO dates in range', () => {
            const result = getIsSportEquipmentAvailableSeason(
                [{ fields: { StartDate: { value: '' }, EndDate: {} } }] as any,
                new Date('2024-12-15T14:50:00+00:00'),
            );

            expect(result).toEqual(true);
        });

        it('should return true when travel date out of range', () => {
            const result = getIsSportEquipmentAvailableSeason(seasons, new Date('2024-12-15T14:50:00+00:00'));

            expect(result).toEqual(true);
        });

        it('should return false when travel date in range', () => {
            const result = getIsSportEquipmentAvailableSeason(seasons, new Date('2024-10-15T14:50:00+00:00'));

            expect(result).toEqual(false);
        });

        it('should return false when travel date is range start date', () => {
            const result = getIsSportEquipmentAvailableSeason(seasons, new Date('2024-09-01T00:00:00Z'));

            expect(result).toEqual(false);
        });

        it('should return false when travel date is range end date', () => {
            const result = getIsSportEquipmentAvailableSeason(seasons, new Date('2024-11-30T14:50:00+00:00'));

            expect(result).toEqual(false);
        });
    });

    describe('isMatchingLuggageIcon', () => {
        it('should return false when extraLuggage is null', () => {
            const result = isMatchingLuggageIcon(null, luggagePackageIcon);

            expect(result).toStrictEqual(false);
        });

        it('should return true when extraLuggage is in packageIcons', () => {
            const result = isMatchingLuggageIcon(
                { items: [{ itemCode: 'LUG' } as ILuggageInfoItem] },
                luggagePackageIcon,
            );

            expect(result).toStrictEqual(true);
        });
    });

    describe('getExtraLuggageFromLivePriceAndOffer', () => {
        beforeEach(() => {
            spyIsShortlistedOfferUnavailableForBooking.mockReturnValue(true);
        });

        it('should return undefined when livePrice is NOT provided and isShortlistedOfferUnavailableForBooking is true', () => {
            const result = getExtraLuggageFromLivePriceAndOffer(undefined, mockProps.offer);

            expect(result).toStrictEqual(undefined);
        });

        it('should return extraLuggageInfo from livePrice when livePrice is provided and livePrice matches offer', () => {
            const result = getExtraLuggageFromLivePriceAndOffer(
                { ...mockLivePrice, accomCode: 'code' },
                mockProps.offer,
            );

            expect(result).toStrictEqual(mockLivePrice.extraLuggageInfo);
        });

        it('should return extraLuggageInfo from offer when livePrice is NOT provided and isShortlistedOfferUnavailableForBooking is false', () => {
            spyIsShortlistedOfferUnavailableForBooking.mockReturnValue(false);

            const result = getExtraLuggageFromLivePriceAndOffer(null, mockProps.offer);

            expect(result).toStrictEqual(mockProps.offer.extraLuggageInfo);
        });
    });
});
