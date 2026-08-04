import { mockAltBoard1, mockTransfer, queryRoomMock } from 'frontend/__mocks__';
import { luggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import { mockedOffer } from 'frontend/__mocks__/offer';
import * as luggageUtils from 'frontend/utils/luggage.utils';
import { IOffer, IUnit } from 'models/data/IOffer';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import { HotelContractType } from 'models/enum/tracking/HotelContractType';
import { TransferType } from 'models/enum/transfer/TransferType';

import {
    containsFAndHPromoCode,
    containsLuxuryPromoCode,
    filterPackageIcons,
    getAvailabilityFromOffer,
    getDefaultContractCode,
    getExtraLuggageIcon,
    getFirstOffer,
    getHotelContractType,
    getIsKidsInfoVisible,
    getIsShowGreatDealPill,
    getNewOfferUnitsByBoard,
    getNumberOfPayingGuests,
    getParentDestination,
    getPriceDifferenceForBoard,
    getPriceDifferencePP,
    getPricePill,
    getRoomName,
    getTotalDiscount,
    getTotalDiscountPPExcludingInfants,
    getTotalNumberOfPayingGuests,
    isAlterationExtendedInfoVisible,
    isFreeForKids,
    isIndexInRange,
    isPricePPShown,
    isRoomPricePPShown,
    replaceRoomCodeInOfferRoomsAllocation,
    swapAccommodationParams,
    swapOfferAccommodations,
} from './offer.utils';

const offerWithDiscount = {
    accom: {
        unit: [
            {
                discount: 110,
                occupation: { adults: 1, children: 10, infants: 100 },
                isFreeForKids: true,
            },
            {
                discount: 1100,
                occupation: { adults: 1, children: 9, infants: 100 },
                isFreeForKids: false,
            },
        ],
    },
} as IOffer;

const spyIsMatchingLuggageIcon = jest.spyOn(luggageUtils, 'isMatchingLuggageIcon');

describe('offer.utils', () => {
    describe('getAvailabilityFromOffer', () => {
        it('should return number available Rooms', () => {
            const offer = {
                accom: {
                    unit: [
                        {
                            avail: 4,
                        },
                    ],
                },
            } as any;
            expect(getAvailabilityFromOffer(offer)).toBe(4);
        });

        it('should return 0 available Rooms', () => {
            const offer = {
                accom: {
                    unit: [],
                },
            } as any;
            expect(getAvailabilityFromOffer(offer)).toBe(0);
        });
    });

    describe('getTotalDiscount', () => {
        it('should return total discount', () => {
            expect(getTotalDiscount(offerWithDiscount)).toBe(1210);
        });

        it('should return 0 if no units were provided', () => {
            const offer = {
                accom: {
                    unit: [],
                },
            } as any;

            const offer2 = {
                accom: {
                    unit: [
                        {
                            discount: 0,
                        },
                    ],
                },
            } as any;

            expect(getTotalDiscount(offer)).toBe(0);
            expect(getTotalDiscount(offer2)).toBe(0);
        });
    });

    describe('getTotalDiscountPPExcludingInfants', () => {
        it('should return correct discount PP excluding infants and free for kids', () => {
            expect(getTotalDiscountPPExcludingInfants(offerWithDiscount)).toBe(60.5);
        });
    });

    describe('isFreeForKids', () => {
        it('should return true if offer contains free units for kids', () => {
            const offer = {
                accom: {
                    unit: [
                        {
                            isFreeForKids: true,
                        },
                        {
                            isFreeForKids: false,
                        },
                    ],
                },
            } as any;

            expect(isFreeForKids(offer)).toEqual(true);
        });

        it("should return false if offer doesn't contains free units for kids", () => {
            const offer = {
                accom: {
                    unit: [],
                },
            } as any;
            const offer2 = {
                accom: {
                    unit: [
                        {
                            isFreeForKids: false,
                        },
                        {
                            isFreeForKids: false,
                        },
                    ],
                },
            } as any;

            expect(isFreeForKids(offer)).toEqual(false);
            expect(isFreeForKids(offer2)).toEqual(false);
        });
    });

    describe('isIndexInRange', () => {
        it('should check range', () => {
            const currentIndex = 3;

            const indexRangeRight = 4;
            const indexRangeLeft = 2;

            const indexNotRangeRight = 6;
            const indexNotRangeLeft = 0;

            const total = 10;
            const offset = 2;

            const isInRangeRight = isIndexInRange(indexRangeRight, currentIndex, total, offset);
            const isDefaultInRangeRight = isIndexInRange(indexRangeRight, currentIndex, total);
            const isInRangeLeft = isIndexInRange(indexRangeLeft, currentIndex, total, offset);

            const isNotInRangeRight = isIndexInRange(indexNotRangeRight, currentIndex, total, offset);
            const isNotInRangeLeft = isIndexInRange(indexNotRangeLeft, currentIndex, total, offset);

            expect(isInRangeRight).toBeTruthy();
            expect(isDefaultInRangeRight).toBeTruthy();
            expect(isInRangeLeft).toBeTruthy();
            expect(isNotInRangeRight).toBeFalsy();
            expect(isNotInRangeLeft).toBeFalsy();
        });

        it('should check range when out of left bounds', () => {
            const currentIndex = 1;

            const indexRangeRight = 2;
            const indexRangeLeft = 10;

            const indexNotRangeRight = 3;
            const indexNotRangeLeft = 9;

            const total = 10;
            const offset = 1;

            const isInRangeRight = isIndexInRange(indexRangeRight, currentIndex, total, offset);
            const isInRangeLeft = isIndexInRange(indexRangeLeft, currentIndex, total, offset);

            const isNotInRangeRight = isIndexInRange(indexNotRangeRight, currentIndex, total, offset);
            const isNotInRangeLeft = isIndexInRange(indexNotRangeLeft, currentIndex, total, offset);

            expect(isInRangeRight).toBeTruthy();
            expect(isInRangeLeft).toBeTruthy();
            expect(isNotInRangeRight).toBeFalsy();
            expect(isNotInRangeLeft).toBeFalsy();
        });

        it('should check range when out of right bounds', () => {
            const currentIndex = 10;

            const indexRangeRight = 1;
            const indexRangeLeft = 9;

            const indexNotRangeRight = 2;
            const indexNotRangeLeft = 8;

            const total = 10;
            const offset = 1;

            const isInRangeRight = isIndexInRange(indexRangeRight, currentIndex, total, offset);
            const isInRangeLeft = isIndexInRange(indexRangeLeft, currentIndex, total, offset);

            const isNotInRangeRight = isIndexInRange(indexNotRangeRight, currentIndex, total, offset);
            const isNotInRangeLeft = isIndexInRange(indexNotRangeLeft, currentIndex, total, offset);

            expect(isInRangeRight).toBeTruthy();
            expect(isInRangeLeft).toBeTruthy();
            expect(isNotInRangeRight).toBeFalsy();
            expect(isNotInRangeLeft).toBeFalsy();
        });
    });

    describe('getParentDestination', () => {
        it('should return empty line', () => {
            const destinationCodesQuery = '';

            expect(getParentDestination(destinationCodesQuery)).toEqual('');
        });

        it('should return country', () => {
            const destinationCodesQuery = 'ES';

            expect(getParentDestination(destinationCodesQuery)).toEqual(destinationCodesQuery);
        });

        it('should return country', () => {
            const destinationCodesQuery = 'ES, ESBA';

            expect(getParentDestination(destinationCodesQuery)).toEqual('ES');
        });

        it('should return country and region', () => {
            const destinationCodesQuery = 'ES, ESBA, ESBABA';

            expect(getParentDestination(destinationCodesQuery)).toEqual('ES, ESBA');
        });
    });

    describe.each([
        [{ price: 100, pricePP: 50 }, true],
        [{ price: 100, pricePP: 100 }, false],
    ])('isPricePPShown()', (offer, expected) => {
        it(`should return ${expected}`, () => {
            expect(isPricePPShown(offer as any)).toBe(expected);
        });
    });

    describe('isRoomPricePPShown', () => {
        const mockedOffer = {
            accom: { unit: [{}] },
            price: 24,
            pricePP: 12,
        };

        it('should NOT return PricePPShown when no offer', () => {
            expect(isRoomPricePPShown(undefined)).toBe(false);
        });

        it('should NOT return PricePPShown when we have 2+ rooms', () => {
            expect(isRoomPricePPShown({ ...mockedOffer, accom: { unit: [{}, {}] } } as any)).toBe(false);
        });

        it('should NOT return PricePPShown when we have 0 rooms', () => {
            expect(isRoomPricePPShown({ ...mockedOffer, accom: { unit: [] } } as any)).toBe(false);
        });

        it('should return PricePPShown when we have 1 room', () => {
            expect(isRoomPricePPShown(mockedOffer as any)).toBe(true);
        });
    });

    describe('getPricePill', () => {
        it('should return content when max adult reached', () => {
            const tooltipMessage = getPricePill([{ maxNumberOfGuests: 2, minNumberOfGuests: 1, content: 'test' }], {
                accom: { unit: [{ occupation: { adults: 1, children: 1, infants: 1 } }] },
            } as IOffer);

            expect(tooltipMessage).toBe('test');
        });

        it('should return empty string when no results', () => {
            const tooltipMessage = getPricePill([{ maxNumberOfGuests: 1, minNumberOfGuests: 1, content: 'test' }], {
                accom: { unit: [{ occupation: { adults: 1, children: 1, infants: 1 } }] },
            } as IOffer);

            expect(tooltipMessage).toBe('');
        });

        it('should return content when no offer', () => {
            const tooltipMessage = getPricePill([{ content: 'test', noOffer: true }], { price: 100 } as IOffer);

            expect(tooltipMessage).toBe('test');
        });
    });

    describe('isAlterationExtendedInfoVisible', () => {
        it('should return false when requireMoreRoomAlteration is false', () => {
            expect(isAlterationExtendedInfoVisible(false, true, true)).toBe(false);
        });

        it('should return false when isMultipleRoomSelected is false', () => {
            expect(isAlterationExtendedInfoVisible(true, false, true)).toBe(false);
        });

        it('should return false when isDrawerConfirmationRequired is false', () => {
            expect(isAlterationExtendedInfoVisible(true, true, false)).toBe(false);
        });

        it('should return true when both requireMoreRoomAlteration & isMultipleRoomSelected & isDrawerConfirmationRequired are true', () => {
            expect(isAlterationExtendedInfoVisible(true, true, true)).toBe(true);
        });
    });

    describe('getIsKidsInfoVisible', () => {
        it('should return false when isFreeForKids remains true', () => {
            expect(getIsKidsInfoVisible({ isFreeForKids: true } as IUnit, { isFreeForKids: true } as IUnit)).toBe(
                false,
            );
        });

        it('should return false when isFreeForKids remains false', () => {
            expect(getIsKidsInfoVisible({ isFreeForKids: false } as IUnit, { isFreeForKids: false } as IUnit)).toBe(
                false,
            );
        });

        it('should return false when isFreeForKids becomes true', () => {
            expect(getIsKidsInfoVisible({ isFreeForKids: false } as IUnit, { isFreeForKids: true } as IUnit)).toBe(
                false,
            );
        });

        it('should return true when isFreeForKids becomes false', () => {
            expect(getIsKidsInfoVisible({ isFreeForKids: true } as IUnit, { isFreeForKids: false } as IUnit)).toBe(
                true,
            );
        });
    });

    describe('getFirstOffer', () => {
        it('should return first offer from the offers array', () => {
            const payload = {
                hotel: {},
                offers: [{ id: '1' }, { id: '2' }],
            } as any;

            expect(getFirstOffer(payload)).toEqual(expect.objectContaining({ id: '1' }));
        });

        it('should return undefined when there are no offers in array', () => {
            const payload = { hotel: {}, offers: [] } as any;

            expect(getFirstOffer(payload)).toBeUndefined();
        });

        it('should return undefined when there are no payload', () => {
            expect(getFirstOffer(undefined)).toBeUndefined();
        });
    });

    describe('swapAccommodationParams', () => {
        const altAccommodations = [
            { accomCode: 'a1', packageId: 'p1' },
            { accomCode: 'a2', packageId: 'p2' },
        ];
        const currentAccomCode = 'x1';
        const currentPackageId = 'y1';

        it('should replace newAccomCode with current accomCode in the altAccommodations array', () => {
            const newAccomCode = altAccommodations[1].accomCode;
            const expectedResult = [altAccommodations[0], { accomCode: currentAccomCode, packageId: currentPackageId }];

            expect(
                swapAccommodationParams(altAccommodations, currentAccomCode, currentPackageId, newAccomCode),
            ).toStrictEqual(expectedResult);
        });

        it('should NOT replace newAccomCode with current accomCode in the altAccommodations array when the newAccomCode is not in this array', () => {
            const newAccomCode = 'test';

            expect(
                swapAccommodationParams(altAccommodations, currentAccomCode, currentPackageId, newAccomCode),
            ).toStrictEqual(altAccommodations);
        });
    });

    describe('swapOfferAccommodations', () => {
        it('should NOT swap offer accommodations if no accommodationId provided', () => {
            const offer = {
                accom: {},
            } as any;
            expect(swapOfferAccommodations(offer, [])).toEqual(offer);
        });

        it('should NOT swap offer accommodations if no packageId provided', () => {
            const offer = {
                accom: {},
            } as any;
            expect(swapOfferAccommodations(offer, [], '')).toEqual(offer);
        });

        it('should NOT swap offer accommodations if no offer provided', () => {
            expect(swapOfferAccommodations(null, [], '', '')).toBeNull();
        });

        it('should NOT swap offer accommodations if no offer accommodation provided', () => {
            expect(swapOfferAccommodations({} as any, [], '', '')).toEqual({});
        });

        it('should NOT swap offer accommodations if the same accommodationId is provided', () => {
            expect(swapOfferAccommodations({ accom: { id: 'test1' } } as any, [], 'test1', '')).toEqual({
                accom: { id: 'test1' },
            });
        });

        it('should NOT swap offer accommodations if the same packageId is provided', () => {
            expect(
                swapOfferAccommodations({ accom: { id: 'test1', packageId: 'test3' } } as any, [], 'test2', 'test3'),
            ).toEqual({ accom: { id: 'test1', packageId: 'test3' } });
        });

        it('should swapOfferAccommodations', () => {
            const offer = { accom: { id: 'test1', packageId: 'test3' } } as any;

            expect(
                swapOfferAccommodations(
                    offer,
                    [
                        { accomCode: 'alt1', packageId: 'altP1' },
                        { accomCode: 'alt2', packageId: 'altP2' },
                    ],
                    'alt1',
                    'altP1',
                ),
            ).toEqual({
                accom: {
                    id: 'alt1',
                    packageId: 'altP1',
                },
                altAcc: [
                    {
                        accomCode: 'test1',
                        packageId: 'test3',
                    },
                    {
                        accomCode: 'alt2',
                        packageId: 'altP2',
                    },
                ],
            });
            expect(offer).toEqual({ accom: { id: 'test1', packageId: 'test3' } });
        });
    });

    describe('replaceRoomCodeInOfferRoomsAllocation', () => {
        it('should replace room code at the specified index', () => {
            const array = [queryRoomMock, queryRoomMock];
            const index = 1;
            const newRoomCode = 'NEW01';

            const newArray = replaceRoomCodeInOfferRoomsAllocation(array, index, newRoomCode);

            expect(newArray[index].roomCode).toEqual(newRoomCode);
        });

        it('should return an original array when index is out of range', () => {
            const array = [queryRoomMock];
            const invalidIndex = 1;
            const newRoomCode = 'NEW01';

            const newArray = replaceRoomCodeInOfferRoomsAllocation(array, invalidIndex, newRoomCode);

            expect(newArray).toEqual(array);
        });

        it('should not modify the original array', () => {
            const array = [queryRoomMock];
            const index = 0;
            const newRoomCode = 'NEW01';

            const newArray = replaceRoomCodeInOfferRoomsAllocation(array, index, newRoomCode);

            expect(newArray).not.toEqual(array);
        });
    });

    describe('getIsShowGreatDealPill', () => {
        it('should return true when hotel isGreatDeal and does not have discount', () => {
            const offer = {
                accom: {
                    unit: [
                        {
                            discount: 0,
                        },
                        {
                            discount: 0,
                        },
                    ],
                },
                hotel: {
                    isGreatDeal: true,
                },
            };
            expect(getIsShowGreatDealPill(offer as IOffer)).toBe(true);
        });

        it('should return false when hotel isGreatDeal and has discount', () => {
            const offer = {
                accom: {
                    unit: [
                        {
                            discount: 1,
                        },
                        {
                            discount: 3,
                        },
                    ],
                },
                hotel: {
                    isGreatDeal: true,
                },
            };
            expect(getIsShowGreatDealPill(offer as IOffer)).toBe(false);
        });

        it('should return false when hotel does not have isGreatDeal and discount', () => {
            const offer = {
                accom: {
                    unit: [
                        {
                            discount: 0,
                        },
                        {
                            discount: 0,
                        },
                    ],
                },
                hotel: {
                    isGreatDeal: false,
                },
            };
            expect(getIsShowGreatDealPill(offer as IOffer)).toBe(false);
        });
    });

    describe('getHotelContractType', () => {
        it('should return BED_BANK_HOTEL_BEDS when isExternalHotel and accomId starts with X', () => {
            expect(getHotelContractType(true, 'X1000771')).toEqual(HotelContractType.BedBankHotelBeds);
        });

        it('should return TRAVEL_GATE when isExternalHotel is true and accomId starts with letter Z', () => {
            expect(getHotelContractType(true, 'Z123')).toEqual(HotelContractType.TravelGate);
        });

        it('should return DIRECT when isExternalHotel is false and accomId does not start with letter Z', () => {
            expect(getHotelContractType(false, 'W123')).toEqual(HotelContractType.Direct);
        });

        it('should return undefined when isExternalHotel but id is not starting from Z or X', () => {
            expect(getHotelContractType(true, 'E12')).toBeUndefined();
        });

        it('should return undefined when isExternalHotel and accomId does not start with Z or X', () => {
            expect(getHotelContractType(true, 'Y8123')).toBeUndefined();
        });

        it('should return undefined when isExternalHotel and accomId is not provided', () => {
            expect(getHotelContractType(true)).toBeUndefined();
        });
    });

    describe('getDefaultContractCode', () => {
        it('should return DC accom code by default', () => {
            expect(getDefaultContractCode(['X912345', 'E12345', 'Z12345'])).toEqual('E12345');
        });

        it('should return the first accom code when DC accom code is not in the list', () => {
            expect(getDefaultContractCode(['Z12345', 'X912345', 'X912345'])).toEqual('Z12345');
        });
    });

    describe('getNewOfferUnitsByBoard', () => {
        const mockedBoard = {
            code: 'boardCode',
            content: 'boardContent',
            description: 'boardDescription',
            iconUrl: 'boardIconUrl',
            title: 'boardTitle',
        };

        it('should return the same units if no alteration is needed', () => {
            const offerUnits = [{ code: 'code01' }] as any;
            const newMockedBoard = {
                ...mockedBoard,
                roomAlterations: {
                    code01: null,
                },
            };

            expect(getNewOfferUnitsByBoard(offerUnits, newMockedBoard, [])).toEqual([
                {
                    board: mockedBoard.code,
                    boardType: newMockedBoard,
                    code: 'code01',
                },
            ]);
        });

        it('should remain the same unit code when board is changed and unit code not provided', () => {
            const offerUnits = [{ code: 'code01' }] as any;
            const newMockedBoard = {
                ...mockedBoard,
                unitCodes: {
                    code02: 'code01new',
                },
            };

            expect(getNewOfferUnitsByBoard(offerUnits, newMockedBoard, [])).toEqual([
                {
                    board: mockedBoard.code,
                    boardType: newMockedBoard,
                    code: 'code01',
                },
            ]);
        });

        it('should set new unit code for the room when board is changed', () => {
            const offerUnits = [{ code: 'code01' }] as any;
            const newMockedBoard = {
                ...mockedBoard,
                unitCodes: {
                    code01: 'code01new',
                },
            };

            expect(getNewOfferUnitsByBoard(offerUnits, newMockedBoard, [])).toEqual([
                {
                    board: mockedBoard.code,
                    boardType: newMockedBoard,
                    code: 'code01new',
                },
            ]);
        });

        it('should return alternative units', () => {
            const offerUnits = [{ code: 'code01' }] as any;
            const newMockedBoard = {
                ...mockedBoard,
                roomAlterations: {
                    code01: 'code02',
                },
            };

            expect(getNewOfferUnitsByBoard(offerUnits, newMockedBoard, [{ code: 'code02' }] as any)).toEqual([
                {
                    board: mockedBoard.code,
                    boardType: newMockedBoard,
                    code: 'code02',
                },
            ]);
        });
    });

    describe.each([
        [1, { title: { value: 'test' } }, 'test'],
        [2, { title: 'test' }, 'test'],
        [3, { title: false }, ''],
        [4, { title: {} }, ''],
    ])('getRoomName()', (id, room, expected) => {
        it(`${id} should return ${expected}`, () => {
            expect(getRoomName(room as any)).toBe(expected);
        });
    });

    describe('filterPackageIcons', () => {
        it('should filter only one transfer icon according to transfer type', () => {
            const packageIcons = [
                { key: PackageIconTypes.PrivateTransfer, name: 'private', iconUrl: 'private' },
                { key: PackageIconTypes.SharedTransfer, name: 'shared', iconUrl: 'shared' },
            ];
            const transfer = { ...mockTransfer, type: TransferType.Shared };

            expect(filterPackageIcons(packageIcons, transfer, null)).toEqual([packageIcons[1]]);
        });

        it('should filter out icons without URLs', () => {
            const packageIcons = [
                { key: PackageIconTypes.UnderSeatBag, name: 'underSeatBag1', iconUrl: 'underSeatBag1' },
                { key: PackageIconTypes.Flight, name: 'test2', iconUrl: 'test2' },
                { key: PackageIconTypes.Hotel, name: 'test3', iconUrl: '' },
            ];
            const transfer = { ...mockTransfer, type: TransferType.Shared };

            expect(filterPackageIcons(packageIcons, transfer, null)).toHaveLength(2);
        });

        it('should not return icon when no transfer', () => {
            const packageIcons = [
                { key: PackageIconTypes.UnderSeatBag, name: 'underSeatBag1', iconUrl: 'underSeatBag1' },
                { key: PackageIconTypes.PrivateTransfer, name: 'private', iconUrl: 'private' },
                { key: PackageIconTypes.SharedTransfer, name: 'shared', iconUrl: 'shared' },
            ];

            expect(filterPackageIcons(packageIcons, null, null)).toHaveLength(1);
        });

        it('should not return icon when transfer is hidden', () => {
            const packageIcons = [
                { key: PackageIconTypes.UnderSeatBag, name: 'underSeatBag1', iconUrl: 'underSeatBag1' },
                { key: PackageIconTypes.PrivateTransfer, name: 'private', iconUrl: 'private' },
                { key: PackageIconTypes.SharedTransfer, name: 'shared', iconUrl: 'shared' },
            ];
            const transfer = { ...mockTransfer, type: TransferType.Shared, isHidden: true };

            expect(filterPackageIcons(packageIcons, transfer, null)).toHaveLength(1);
        });

        it('should filter bag icons based on isMatchingLuggageIcon response', () => {
            spyIsMatchingLuggageIcon.mockReturnValueOnce(true).mockReturnValueOnce(false).mockReturnValueOnce(false);
            const packageIcons = [
                { key: PackageIconTypes.Bags, name: 'bag1', iconUrl: 'bag1', luggageCode: 'LUG' },
                { key: PackageIconTypes.Bags, name: 'bag2', iconUrl: 'bag2', luggageCode: 'LUS' },
                { key: PackageIconTypes.Bags, name: 'bag3', iconUrl: 'bag3', luggageCode: 'OTHER' },
            ];

            expect(filterPackageIcons(packageIcons, null, luggageInfoMock)).toEqual([packageIcons[0]]);
        });

        it('should add small under-seat bag icon when isMatchingLuggageIcon returns false', () => {
            spyIsMatchingLuggageIcon.mockReturnValue(false);
            const packageIcons = [
                { key: PackageIconTypes.Bags, name: 'bag1', iconUrl: 'bag1', luggageCode: 'OTHER' },
                { key: PackageIconTypes.UnderSeatBag, name: 'underSeatBag1', iconUrl: 'underSeatBag1' },
            ];

            expect(filterPackageIcons(packageIcons, null, luggageInfoMock)).toContainEqual(packageIcons[1]);
        });

        it('should skip bag icons when it is isHotelDetailsBrowsePage', () => {
            const packageIcons = [
                { key: PackageIconTypes.Bags, name: 'bag1', iconUrl: 'bag1', luggageCode: 'LUG' },
                { key: PackageIconTypes.Bags, name: 'bag2', iconUrl: 'bag2', luggageCode: 'LUS' },
                { key: PackageIconTypes.Bags, name: 'bag3', iconUrl: 'bag3', luggageCode: 'OTHER' },
            ];

            expect(filterPackageIcons(packageIcons, null, luggageInfoMock)).toEqual([]);
        });

        it('should return bag with bagName', () => {
            const packageIcons = [
                { key: PackageIconTypes.Bags, name: 'bag1', iconUrl: 'bag1', luggageCode: 'LUG' },
                { key: PackageIconTypes.Bags, name: 'bag2', iconUrl: 'bag2', luggageCode: 'LUS' },
                { key: PackageIconTypes.Bags, name: 'bag3', iconUrl: 'bag3', luggageCode: 'OTHER' },
            ];

            expect(filterPackageIcons(packageIcons, null, luggageInfoMock, 'test')).toStrictEqual([
                {
                    iconUrl: 'bag1',
                    key: 'Bags',
                    luggageCode: 'LUG',
                    name: 'test',
                },
            ]);
        });

        describe('Transfer', () => {
            let transfer;

            beforeEach(() => {
                transfer = { ...mockTransfer, type: TransferType.Shared };
            });

            it('should put transfer icons as a last element with bags', () => {
                spyIsMatchingLuggageIcon.mockReturnValue(true);
                const packageIcons = [
                    { key: PackageIconTypes.SharedTransfer, name: 'shared', iconUrl: 'shared' },
                    { key: PackageIconTypes.Bags, name: 'bag1', iconUrl: 'bag1', luggageCode: 'LUG' },
                ];

                expect(filterPackageIcons(packageIcons, transfer, luggageInfoMock)).toEqual([
                    {
                        iconUrl: 'bag1',
                        key: PackageIconTypes.Bags,
                        luggageCode: 'LUG',
                        name: 'bag1',
                    },
                    {
                        iconUrl: 'shared',
                        key: PackageIconTypes.SharedTransfer,
                        name: 'shared',
                    },
                ]);
            });

            it('should put transfer icons as a last element with under seat bag', () => {
                const packageIcons = [
                    { key: PackageIconTypes.SharedTransfer, name: 'shared', iconUrl: 'shared' },
                    { key: PackageIconTypes.UnderSeatBag, name: 'underSeatBag1', iconUrl: 'underSeatBag1' },
                ];

                expect(filterPackageIcons(packageIcons, transfer, luggageInfoMock)).toEqual([
                    {
                        iconUrl: 'underSeatBag1',
                        key: PackageIconTypes.UnderSeatBag,
                        name: 'underSeatBag1',
                    },
                    {
                        iconUrl: 'shared',
                        key: PackageIconTypes.SharedTransfer,
                        name: 'shared',
                    },
                ]);
            });
        });

        describe('underSeatBagIcon', () => {
            it('should insert underSeatBagIcon when extraLuggage is not undefined and bagName is not provided', () => {
                const packageIcons = [
                    { key: PackageIconTypes.Flight, name: 'flight', iconUrl: 'flight' },
                    { key: PackageIconTypes.UnderSeatBag, name: 'underSeatBag', iconUrl: 'underSeatBag' },
                ];

                const result = filterPackageIcons(packageIcons, null, luggageInfoMock);
                expect(result).toContainEqual({
                    key: PackageIconTypes.UnderSeatBag,
                    name: 'underSeatBag',
                    iconUrl: 'underSeatBag',
                });
            });

            it('should NOT insert underSeatBagIcon when extraLuggage is undefined (livePrice is not loaded)', () => {
                const packageIcons = [
                    { key: PackageIconTypes.UnderSeatBag, name: 'underSeatBag', iconUrl: 'underSeatBag' },
                    { key: PackageIconTypes.Flight, name: 'flight', iconUrl: 'flight' },
                ];

                const result = filterPackageIcons(packageIcons, null, undefined);
                expect(result).not.toContainEqual({
                    key: PackageIconTypes.UnderSeatBag,
                    name: 'underSeatBag',
                    iconUrl: 'underSeatBag',
                });
            });

            it('should NOT insert underSeatBagIcon when bagName is provided (luxury package)', () => {
                const packageIcons = [
                    { key: PackageIconTypes.UnderSeatBag, name: 'underSeatBag', iconUrl: 'underSeatBag' },
                    { key: PackageIconTypes.Bags, name: 'bag', iconUrl: 'bag', luggageCode: 'LUG' },
                ];

                const result = filterPackageIcons(packageIcons, null, luggageInfoMock, 'luxuryBag');
                expect(result).not.toContainEqual({
                    key: PackageIconTypes.UnderSeatBag,
                    name: 'underSeatBag',
                    iconUrl: 'underSeatBag',
                });
            });

            it('should insert underSeatBagIcon when showUnderSeatBagIcon is true even if bagName is provided', () => {
                const packageIcons = [
                    { key: PackageIconTypes.UnderSeatBag, name: 'underSeatBag', iconUrl: 'underSeatBag' },
                    { key: PackageIconTypes.Bags, name: 'bag', iconUrl: 'bag', luggageCode: 'LUG' },
                ];

                const result = filterPackageIcons(packageIcons, null, luggageInfoMock, 'luxuryBag', true);
                expect(result).toContainEqual({
                    key: PackageIconTypes.UnderSeatBag,
                    name: 'underSeatBag',
                    iconUrl: 'underSeatBag',
                });
            });

            it('should insert underSeatBagIcon at penultimate position when transfer icon exists', () => {
                const packageIcons = [
                    { key: PackageIconTypes.Hotel, name: 'hotel', iconUrl: 'hotel' },
                    { key: PackageIconTypes.SharedTransfer, name: 'shared', iconUrl: 'shared' },
                    { key: PackageIconTypes.UnderSeatBag, name: 'underSeatBag', iconUrl: 'underSeatBag' },
                ];
                const transfer = { ...mockTransfer, type: TransferType.Shared };

                const result = filterPackageIcons(packageIcons, transfer, luggageInfoMock);
                expect(result.length).toBe(3);
                expect(result.at(-2)).toEqual({
                    key: PackageIconTypes.UnderSeatBag,
                    name: 'underSeatBag',
                    iconUrl: 'underSeatBag',
                });
                expect(result.at(-1)).toEqual({
                    key: PackageIconTypes.SharedTransfer,
                    name: 'shared',
                    iconUrl: 'shared',
                });
            });

            it('should insert underSeatBagIcon at end when no transfer icon exists', () => {
                const packageIcons = [
                    { key: PackageIconTypes.UnderSeatBag, name: 'underSeatBag', iconUrl: 'underSeatBag' },
                    { key: PackageIconTypes.Hotel, name: 'hotel', iconUrl: 'hotel' },
                    { key: PackageIconTypes.Flight, name: 'flight', iconUrl: 'flight' },
                ];

                const result = filterPackageIcons(packageIcons, null, luggageInfoMock);
                expect(result.at(-1)).toEqual({
                    key: PackageIconTypes.UnderSeatBag,
                    name: 'underSeatBag',
                    iconUrl: 'underSeatBag',
                });
            });

            it('should insert underSeatBagIcon even if no matching extra luggage icon found', () => {
                spyIsMatchingLuggageIcon.mockReturnValue(false);
                const packageIcons = [
                    { key: PackageIconTypes.UnderSeatBag, name: 'underSeatBag', iconUrl: 'underSeatBag' },
                    { key: PackageIconTypes.Bags, name: 'bag', iconUrl: 'bag', luggageCode: 'OTHER' },
                ];

                const result = filterPackageIcons(packageIcons, null, luggageInfoMock);
                expect(result).toContainEqual({
                    key: PackageIconTypes.UnderSeatBag,
                    name: 'underSeatBag',
                    iconUrl: 'underSeatBag',
                });
            });
        });
    });

    describe('getNumberOfPayingGuests', () => {
        it('should calculate correctly when isFreeForKids is true', () => {
            expect(getNumberOfPayingGuests(2, 2, true)).toBe(3);
            expect(getNumberOfPayingGuests(2, 1, true)).toBe(2);
        });

        it('should calculate correctly when isFreeForKids is false', () => {
            expect(getNumberOfPayingGuests(2, 2, false)).toBe(4);
            expect(getNumberOfPayingGuests(2, 1, false)).toBe(3);
        });
    });

    describe('getTotalNumberOfPayingGuests', () => {
        it('should calculate correctly when isFreeForKids is true', () => {
            expect(
                getTotalNumberOfPayingGuests([
                    {
                        ...mockedOffer.accom.unit[0],
                        isFreeForKids: true,
                        occupation: { adults: 2, children: 2, childAges: [], infants: 0, paxIds: [] },
                    },
                    {
                        ...mockedOffer.accom.unit[0],
                        isFreeForKids: true,
                        occupation: { adults: 2, children: 2, childAges: [], infants: 0, paxIds: [] },
                    },
                ]),
            ).toBe(6);
            expect(
                getTotalNumberOfPayingGuests([
                    {
                        ...mockedOffer.accom.unit[0],
                        isFreeForKids: true,
                        occupation: { adults: 2, children: 1, childAges: [], infants: 0, paxIds: [] },
                    },
                    {
                        ...mockedOffer.accom.unit[0],
                        isFreeForKids: true,
                        occupation: { adults: 2, children: 1, childAges: [], infants: 0, paxIds: [] },
                    },
                ]),
            ).toBe(4);
        });

        it('should calculate correctly when isFreeForKids is false', () => {
            expect(
                getTotalNumberOfPayingGuests([
                    {
                        ...mockedOffer.accom.unit[0],
                        isFreeForKids: false,
                        occupation: { adults: 2, children: 2, childAges: [], infants: 0, paxIds: [] },
                    },
                    {
                        ...mockedOffer.accom.unit[0],
                        isFreeForKids: false,
                        occupation: { adults: 2, children: 2, childAges: [], infants: 0, paxIds: [] },
                    },
                ]),
            ).toBe(8);
            expect(
                getTotalNumberOfPayingGuests([
                    {
                        ...mockedOffer.accom.unit[0],
                        isFreeForKids: false,
                        occupation: { adults: 2, children: 1, childAges: [], infants: 0, paxIds: [] },
                    },
                    {
                        ...mockedOffer.accom.unit[0],
                        isFreeForKids: false,
                        occupation: { adults: 2, children: 1, childAges: [], infants: 0, paxIds: [] },
                    },
                ]),
            ).toBe(6);
        });
    });

    describe('getPriceDifferencePP', () => {
        it('should return correct value', () => {
            expect(
                Math.ceil(
                    getPriceDifferencePP(200, [
                        {
                            ...mockedOffer.accom.unit[0],
                            price: 1000,
                        },
                    ]),
                ),
            ).toBe(67);
            expect(
                Math.ceil(
                    getPriceDifferencePP(-200, [
                        {
                            ...mockedOffer.accom.unit[0],
                            price: 800,
                        },
                    ]),
                ),
            ).toBe(-66);
        });
    });

    describe('getPriceDifferenceForBoard', () => {
        it('should return correct value when isSelected is true', () => {
            expect(
                getPriceDifferenceForBoard({
                    isSelected: true,
                    isPostBooking: false,
                    offer: mockedOffer,
                    alternativeBoard: mockAltBoard1,
                    prevPrice: 1000,
                }),
            ).toBe(0);
        });

        it('should return correct value when isPostBooking is true', () => {
            expect(
                getPriceDifferenceForBoard({
                    isSelected: false,
                    isPostBooking: true,
                    offer: mockedOffer,
                    alternativeBoard: { ...mockAltBoard1, price: 99 },
                    prevPrice: 100,
                }),
            ).toBe(99);

            expect(
                getPriceDifferenceForBoard({
                    isSelected: false,
                    isPostBooking: true,
                    offer: mockedOffer,
                    alternativeBoard: { ...mockAltBoard1, price: -99 },
                    prevPrice: 100,
                }),
            ).toBe(-99);
        });

        it('should return correct value when isPostBooking is false', () => {
            expect(
                Math.ceil(
                    getPriceDifferenceForBoard({
                        isSelected: false,
                        isPostBooking: false,
                        offer: mockedOffer,
                        alternativeBoard: { ...mockAltBoard1, price: 1000 },
                        prevPrice: 800,
                    }),
                ),
            ).toBe(67);
        });
    });

    describe('containsLuxuryPromoCode', () => {
        it('should return true when promo codes array contains Luxury code', () => {
            expect(containsLuxuryPromoCode([OfferPromotionCodes.Luxury])).toBe(true);
        });

        it('should return false when promo codes array  does NOT contain Luxury code', () => {
            expect(containsLuxuryPromoCode([])).toBe(false);
        });
    });

    describe('containsFAndHPromoCode', () => {
        it('should return true when promo codes array contains FlightAndHotel code', () => {
            expect(containsFAndHPromoCode([OfferPromotionCodes.FlightAndHotel])).toBe(true);
        });

        it('should return false when promo codes array does NOT contain FlightAndHotel code', () => {
            expect(containsFAndHPromoCode([])).toBe(false);
        });

        it('should return false when promo codes is undefined', () => {
            expect(containsFAndHPromoCode(undefined)).toBe(false);
        });
    });

    describe('getExtraLuggageIcon', () => {
        it('should return undefined when bagName is provided and Bags is NOT in package icons', () => {
            expect(getExtraLuggageIcon([], undefined, 'test')).toBe(undefined);
        });

        it('should return bag with bagName when bagName is provided and Bags are in package icons', () => {
            const packageIcons = [
                { key: PackageIconTypes.Bags, name: '23 kg bags', iconUrl: 'bags' },
                { key: PackageIconTypes.SharedTransfer, name: 'shared', iconUrl: 'shared' },
            ];
            expect(getExtraLuggageIcon(packageIcons, undefined, 'test')).toStrictEqual({
                key: PackageIconTypes.Bags,
                name: 'test',
                iconUrl: 'bags',
            });
        });

        it('should return matchingLuggageIcon when matchingLuggageIcon is provided and bagsName is empty', () => {
            const matchingIcon = { key: PackageIconTypes.Bags, name: 'matching test', iconUrl: 'bags' };

            expect(getExtraLuggageIcon([], matchingIcon, '')).toStrictEqual(matchingIcon);
        });

        it('should return undefined when matchingLuggageIcon and bagName are not provided', () => {
            const packageIcons = [
                { key: PackageIconTypes.UnderSeatBag, name: 'underSeatBag1', iconUrl: 'underSeatBag1' },
                { key: PackageIconTypes.Bags, name: '23 kg bags', iconUrl: 'bags' },
            ];

            expect(getExtraLuggageIcon(packageIcons, undefined, '')).toStrictEqual(undefined);
        });
    });
});
