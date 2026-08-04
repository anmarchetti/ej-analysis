import { Tokens } from 'code/tokens';
import { mockAllTypesPassengersList, mockPassenger, mockSelectedSeats } from 'frontend/__mocks__';
import { mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { GuestType } from 'models/enum/GuestType';
import { PassengerDisplayName } from 'models/enum/PassengerType';
import { SeatType } from 'models/enum/SeatType';
import { mockAncillariesChildren } from 'frontend/components/renderings/SeatAndBags/__mocks__/mockSeatAndBagsFields';

import {
    countSum,
    formatPriceToTwoDecimalPlaces,
    generateSeatsSelectedStructure,
    getChildInfo,
    getLCBPriceLabel,
    getOfferWithPopulatedData,
    getPassengerByDisplayName,
    getPassengersWithAncillaries,
    getPersonProps,
    getSeatMapInfoFromSelectedSeats,
    getTitle,
    getTitleConstant,
    handleUnchangedSeats,
    isPremiumSeat,
    parseAncString,
    parseSeats,
} from './seatAndBags.utils';
import { Tokenizer } from './tokenizer';

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: mockTokenizer,
}));

describe('getLCBPriceLabel', () => {
    it('should call replaceTokens 2 times and return valid label', () => {
        const price = '£31.98';
        const sitecoreLabel = 'Include for <strong>{price}</strong>';
        const result = getLCBPriceLabel(price, mockSitecoreField(sitecoreLabel));

        expect(Tokenizer.replaceToken).toHaveBeenCalledTimes(1);
        expect(Tokenizer.replaceToken).toHaveBeenNthCalledWith(1, sitecoreLabel, Tokens.Price, price);
        expect(Tokenizer.replaceToken).toHaveBeenNthCalledWith(1, sitecoreLabel, Tokens.Price, '£31.98');

        expect(result).toEqual('Include for <strong>{price}</strong> £31.98');
    });
});

describe('getPassengersWithAncillaries', () => {
    it('should NOT mutate passengers when NO seats with current flightNumber in seats selection AND no lcb selection', () => {
        const passengers = getPassengersWithAncillaries(mockAllTypesPassengersList, mockSelectedSeats, 'FL000');

        expect(passengers).toEqual(mockAllTypesPassengersList);
    });

    it('should NOT mutate passengers when in current flight no seats', () => {
        const mockSeats = [...mockSelectedSeats, { sectorId: '1', flightNumber: 'FL000' }];
        const passengers = getPassengersWithAncillaries(mockAllTypesPassengersList, mockSeats, 'FL000');

        expect(passengers).toEqual(mockAllTypesPassengersList);
    });

    it('should return passenger with seat when it exists in seat selection', () => {
        const passengers = getPassengersWithAncillaries(mockAllTypesPassengersList, mockSelectedSeats, 'FL124');

        expect(passengers[0].seat).toEqual({
            paxIndex: 1,
            seatNumber: '15C',
            priceBand: SeatType.UpFront,
            products: [
                {
                    id: '2',
                    name: 'Window View',
                    icon: 'https://example.com/window-view.png',
                },
            ],
            price: 20,
        });
    });

    it('should return passenger with standard seat when no priceBand in seat info', () => {
        const reducedSeats = [
            {
                sectorId: '1',
                seats: [
                    {
                        paxIndex: 1,
                        seatNumber: '15C',
                        price: 20,
                    },
                ],
                flightNumber: 'FL124',
            },
        ];
        const passengers = getPassengersWithAncillaries(mockAllTypesPassengersList, reducedSeats, 'FL124');

        expect(passengers[0].seat).toEqual({
            paxIndex: 1,
            seatNumber: '15C',
            priceBand: SeatType.Standard,
            products: [],
            price: 20,
        });
    });

    it('should return passengers without hasLCB prop when lcb selection NOT passed', () => {
        const passengers = getPassengersWithAncillaries(mockAllTypesPassengersList, mockSelectedSeats, 'FL124');

        passengers.forEach(({ hasLCB }) => {
            expect(hasLCB).toBeFalsy();
        });
    });

    it('should return passengers with lcb when lcb selection passed', () => {
        const passengers = getPassengersWithAncillaries(mockAllTypesPassengersList, mockSelectedSeats, 'FL124', [
            '3',
            '4',
        ]);

        expect(passengers[0].hasLCB).toBeFalsy();
        expect(passengers[1].hasLCB).toBeFalsy();
        expect(passengers[2].hasLCB).toBeTruthy();
        expect(passengers[3].hasLCB).toBeTruthy();
    });
});

describe('parseAncString', () => {
    it('should return empty array when no data', () => {
        expect(parseAncString(undefined)).toEqual([]);
    });

    it('should return empty array when data an empty string', () => {
        expect(parseAncString('')).toEqual([]);
    });

    it('should parse ancillaries string', () => {
        expect(parseAncString('1|2|3')).toEqual(['1', '2', '3']);
    });
});

describe('parseSeats', () => {
    it('should parse seats', () => {
        expect(parseSeats({ s1: '1-2E|2-3A', s2: '1-5B|2-2D' })).toEqual([
            {
                seats: [
                    { paxIndex: 1, seatNumber: '2E' },
                    { paxIndex: 2, seatNumber: '3A' },
                ],
                sectorId: '1',
            },
            {
                seats: [
                    { paxIndex: 1, seatNumber: '5B' },
                    { paxIndex: 2, seatNumber: '2D' },
                ],
                sectorId: '2',
            },
        ]);
    });

    it('should parse 2 sectorIds even if we pass only one', () => {
        expect(parseSeats({ s2: '1-5B|2-2D' })).toEqual([
            {
                seats: [],
                sectorId: '1',
            },
            {
                seats: [
                    { paxIndex: 1, seatNumber: '5B' },
                    { paxIndex: 2, seatNumber: '2D' },
                ],
                sectorId: '2',
            },
        ]);
    });

    it('should parse seats without paxIndex', () => {
        expect(parseSeats({ s1: '0-2E|0-3A', s2: '1-5B|2-2D' })).toEqual([
            {
                seats: [
                    { paxIndex: 0, seatNumber: '2E' },
                    { paxIndex: 0, seatNumber: '3A' },
                ],
                sectorId: '1',
            },
            {
                seats: [
                    { paxIndex: 1, seatNumber: '5B' },
                    { paxIndex: 2, seatNumber: '2D' },
                ],
                sectorId: '2',
            },
        ]);
    });
});

describe('generateSeatsSelectedStructure', () => {
    it('should generateSeatsSelectedStructure', () => {
        expect(
            generateSeatsSelectedStructure([
                {
                    seats: [{ paxIndex: 0, seatNumber: '2E' }, { seatNumber: '3A' } as any],
                    sectorId: '1',
                },
                {
                    seats: [
                        { paxIndex: 1, seatNumber: '5B' },
                        { paxIndex: 2, seatNumber: '2D' },
                    ],
                    sectorId: '2',
                },
            ]),
        ).toEqual([
            {
                flightNumber: '',
                seats: [
                    { paxIndex: 0, seatNumber: '2E' },
                    { paxIndex: 0, seatNumber: '3A' },
                ],
                sectorId: '1',
            },
            {
                flightNumber: '',
                seats: [
                    { paxIndex: 1, seatNumber: '5B' },
                    { paxIndex: 2, seatNumber: '2D' },
                ],
                sectorId: '2',
            },
        ]);
    });
});

describe('countSum', () => {
    it('should count zero Sum if no seats', () => {
        expect(countSum([])).toEqual(0);
    });

    it('should count zero Sum if any seat does not have price', () => {
        expect(
            countSum([
                { paxIndex: 1, seatNumber: '5B', price: 0.95 },
                { paxIndex: 2, seatNumber: '2D', price: 0.1 },
                { paxIndex: 2, seatNumber: '2D' },
            ]),
        ).toEqual(0);
    });

    it('should count non zero sum', () => {
        expect(
            countSum([
                { paxIndex: 1, seatNumber: '5B', price: 0.95 },
                { paxIndex: 2, seatNumber: '2D', price: 0.1 },
                { paxIndex: 2, seatNumber: '2D', price: 0 },
            ]),
        ).toEqual(1.05);
    });
});

describe('populateFetchedMissingData', () => {
    let mockedFetchedData;
    const storedData: ISelectedSeat[] = [
        {
            sectorId: '1',
            seats: [
                {
                    paxIndex: 1,
                    seatNumber: '2E',
                },
                {
                    paxIndex: 2,
                    seatNumber: '2F',
                },
            ],
        },
        {
            sectorId: '2',
            seats: [
                {
                    paxIndex: 1,
                    seatNumber: '2C',
                },
                {
                    paxIndex: 2,
                    seatNumber: '2F',
                },
            ],
        },
    ];

    beforeEach(() => {
        mockedFetchedData = {
            transport: {
                routes: [
                    { fltNo: 'EZY1231', car: 'EZY' },
                    { fltNo: 'EZY1232', car: 'EZY' },
                ],
            },
            seatSelection: [
                {
                    seats: [
                        {
                            seatNumber: '2E',
                        },
                        {
                            seatNumber: '2F',
                        },
                    ],
                    flightNumber: '1231',
                },
                {
                    seats: [
                        {
                            seatNumber: '2C',
                        },
                    ],
                    flightNumber: '1232',
                },
            ] as ISelectedSeat[],
        } as any;
    });

    it('should not populateFetchedMissingData if no data is stored', () => {
        expect(mockedFetchedData.seatSelection[0].sectorId).toBeUndefined();
        expect(mockedFetchedData.seatSelection[0].seats[0].paxIndex).toBeUndefined();
        expect(mockedFetchedData.seatSelection[0].seats[1].paxIndex).toBeUndefined();
        expect(mockedFetchedData.seatSelection[1].sectorId).toBeUndefined();
        expect(mockedFetchedData.seatSelection[1].seats[0].paxIndex).toBeUndefined();

        expect(getOfferWithPopulatedData(mockedFetchedData)).toBeUndefined();
    });

    it('should not populateFetchedMissingData if routes is less then 2', () => {
        expect(mockedFetchedData.seatSelection[0].sectorId).toBeUndefined();
        expect(mockedFetchedData.seatSelection[0].seats[0].paxIndex).toBeUndefined();
        expect(mockedFetchedData.seatSelection[0].seats[1].paxIndex).toBeUndefined();
        expect(mockedFetchedData.seatSelection[1].sectorId).toBeUndefined();
        expect(mockedFetchedData.seatSelection[1].seats[0].paxIndex).toBeUndefined();

        mockedFetchedData.transport.routes = [mockedFetchedData.transport.routes[0]];

        expect(getOfferWithPopulatedData(mockedFetchedData)).toBeUndefined();
    });

    it('should populateFetchedMissingData', () => {
        expect(mockedFetchedData.seatSelection[0].sectorId).toBeUndefined();
        expect(mockedFetchedData.seatSelection[0].seats[0].paxIndex).toBeUndefined();
        expect(mockedFetchedData.seatSelection[0].seats[1].paxIndex).toBeUndefined();
        expect(mockedFetchedData.seatSelection[1].sectorId).toBeUndefined();
        expect(mockedFetchedData.seatSelection[1].seats[0].paxIndex).toBeUndefined();

        const populatedData = getOfferWithPopulatedData(mockedFetchedData, storedData);
        expect(populatedData![0].sectorId).toEqual('1');
        expect(populatedData![0].seats![0].paxIndex).toEqual(1);
        expect(populatedData![0].seats![1].paxIndex).toEqual(2);
        expect(populatedData![1].sectorId).toEqual('2');
        expect(populatedData![1].seats![0].paxIndex).toEqual(1);
    });
});

describe('formatPriceToTwoDecimalPlaces', () => {
    it('should not render Infinity', () => {
        expect(formatPriceToTwoDecimalPlaces(Infinity)).toEqual('0.00');
    });

    it('should render normal value', () => {
        expect(formatPriceToTwoDecimalPlaces(0.2)).toEqual('0.20');
    });
});

describe('handleUnchangedSeats', () => {
    it('should add hasSecondaryStyle and add 0 price when seat was not changed', () => {
        const newSelectionItem = [
            {
                outboundPassenger: {
                    seat: { seatNumber: '1A', price: 0.4, priceBand: SeatType.Standard, products: [] },
                },
                inboundPassenger: {},
            },
        ];
        const prevSelection = [
            {
                outboundPassenger: {
                    seat: { seatNumber: '1A', price: 1.1, priceBand: SeatType.Standard, products: [] },
                },
                inboundPassenger: {},
            },
        ];
        const comparedSelection = handleUnchangedSeats(newSelectionItem, prevSelection);

        expect(comparedSelection[0].outboundPassenger.seat!.hasSecondaryStyle).toBeTruthy();
        expect(comparedSelection[0].outboundPassenger.seat!.price).toEqual(0);
    });

    it('should not add hasSecondaryStyle and not add 0 price when seat was changed', () => {
        const newSelectionItem = [
            {
                outboundPassenger: {
                    seat: { seatNumber: '2A', price: 0.4, priceBand: SeatType.Standard, products: [] },
                },
                inboundPassenger: {},
            },
        ];
        const prevSelection = [
            {
                outboundPassenger: {
                    seat: { seatNumber: '1A', price: 1.4, priceBand: SeatType.Standard, products: [] },
                },
                inboundPassenger: {},
            },
        ];
        const comparedSelection = handleUnchangedSeats(newSelectionItem, prevSelection);

        expect(comparedSelection[0].outboundPassenger.seat!.hasSecondaryStyle).toBeFalsy();
        expect(comparedSelection[0].outboundPassenger.seat!.price).toEqual(0.4);
    });
});

describe('getSeatMapInfoFromSelectedSeats', () => {
    it('should convert values', () => {
        expect(
            getSeatMapInfoFromSelectedSeats({
                guests: [
                    {
                        index: '1',
                        isLead: false,
                        firstName: 'firstName',
                        lastName: 'lastName',
                        age: 22,
                        notBornYet: false,
                        sex: 'sex',
                        title: 'title',
                        type: GuestType.Adult,
                    },
                ],
                seatSelection: [{ sectorId: '1', seats: [{ paxIndex: 1, seatNumber: '2Q' }], flightNumber: '1234' }],
                outboundFlightNum: '1234',
                inboundFlightNum: '1235',
            }),
        ).toEqual([
            {
                inboundPassenger: {
                    age: 22,
                    firstName: 'firstName',
                    index: '1',
                    isLead: false,
                    lastName: 'lastName',
                    notBornYet: false,
                    passengerId: '1',
                    sex: 'sex',
                    title: 'title',
                    type: 'ADULT',
                    withInfant: false,
                },
                outboundPassenger: {
                    age: 22,
                    firstName: 'firstName',
                    index: '1',
                    isLead: false,
                    lastName: 'lastName',
                    notBornYet: false,
                    passengerId: '1',
                    seat: { paxIndex: 1, priceBand: SeatType.Standard, products: [], seatNumber: '2Q' },
                    sex: 'sex',
                    title: 'title',
                    type: 'ADULT',
                    withInfant: false,
                },
            },
        ]);
    });
});

describe('getTitle', () => {
    it('should call replaceTokens and return its result', () => {
        const value = 'Awesome title';
        const result = getTitle('Ben Black', value, {
            ['{passengerAge}']: '2',
        });

        expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(value, {
            [Tokens.PassengerIndex]: '',
            [Tokens.PassengerName]: 'Ben Black',
            [Tokens.PassengerAge]: '2',
        });
        expect(result).toEqual('Awesome title ,Ben Black,2');
    });
});

describe('getTitleConstant', () => {
    it('should call replaceTokens and return its result', () => {
        const value = 'Awesome constant value';
        const result = getTitleConstant(3, value, {
            ['{passengerAge}']: '2',
        });

        expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(value, {
            [Tokens.PassengerIndex]: '3',
            [Tokens.PassengerAge]: '2',
        });
        expect(result).toBe('Awesome constant value 3,2');
    });
});

describe('getPassengerByDisplayName', () => {
    it('should skip when children have NO passenger with passed display name', () => {
        expect(getPassengerByDisplayName([], PassengerDisplayName.AdultInfant)).toBeUndefined();
    });

    it('should return child info when childText provided', () => {
        expect(getPassengerByDisplayName(mockAncillariesChildren, PassengerDisplayName.Adult)).toEqual(
            mockAncillariesChildren[0].fields,
        );
    });
});

describe('getChildInfo', () => {
    it('should return empty fields when NO childTitle or childTitleConstant provided', () => {
        const result = getChildInfo(null, null, null);
        expect(result).toEqual({
            title: '',
            titleConstant: '',
            age: '',
            personIcon: null,
        });
    });

    it('should return correct child info when childTitle and childTitleConstant provided', () => {
        const result = getChildInfo('Child (aged 3)', 'Peter (aged 3)', { value: { src: 'icon.png' } });
        expect(result).toEqual({
            title: 'Peter',
            titleConstant: 'Child',
            age: '(aged 3)',
            personIcon: { value: { src: 'icon.png' } },
        });
    });

    it('should return correct child info when childTitleConstant is null', () => {
        const result = getChildInfo(null, 'Peter (aged 3)', null);
        expect(result).toEqual({
            title: 'Peter',
            titleConstant: undefined,
            age: '(aged 3)',
            personIcon: null,
        });
    });

    it('should return correct child info when childTitle is null', () => {
        const result = getChildInfo('Child (aged 3)', null, null);
        expect(result).toEqual({
            title: undefined,
            titleConstant: 'Child',
            age: '(aged 3)',
            personIcon: null,
        });
    });
});

describe('getPersonProps', () => {
    const getPhraseMock = jest.fn(p => p);

    it('should return props for Adult', () => {
        expect(getPersonProps(mockPassenger, mockAncillariesChildren, 2, getPhraseMock)).toEqual({
            personIcon: { value: { src: 'adult icon' } },
            title: '{passengerName} ,Globals.Labels.Titles.Mr Vobla Fisher',
            titleConstant: 'Adult {passengerIndex} 2',
        });
    });

    describe('Adult And Infant passenger', () => {
        const paxMock = {
            ...mockPassenger,
            withInfant: true,
        };

        it('should skip when passengerFields undefined', () => {
            expect(getPersonProps(paxMock, [], 2, getPhraseMock)).toBeUndefined();
        });

        it('should return props for Adult And Infant', () => {
            expect(getPersonProps(paxMock, mockAncillariesChildren, 2, getPhraseMock)).toEqual({
                personIcon: { value: { src: 'adult+infant icon' } },
                title: '{passengerName} + infant ,Globals.Labels.Titles.Mr Vobla Fisher',
                titleConstant: 'Adult {passengerIndex} + infant 2',
            });
        });
    });

    describe('Child passenger', () => {
        const paxMock = {
            ...mockPassenger,
            type: GuestType.Child,
        };

        it('should skip when childFields undefined', () => {
            expect(getPersonProps(paxMock, [], 2, getPhraseMock)).toBeUndefined();
        });

        it('should return props for child', () => {
            expect(getPersonProps(paxMock, mockAncillariesChildren, 2, getPhraseMock)).toEqual({
                age: '(age {passengerAge}) 2,34',
                personIcon: { value: { src: 'child icon' } },
                title: '{passengerName}',
                titleConstant: 'Child',
            });
        });
    });
});

describe('isPremiumSeat', () => {
    it('should return true for UpFront seat type', () => {
        expect(isPremiumSeat(SeatType.UpFront)).toBe(true);
    });

    it('should return true for ExtraLegroom seat type', () => {
        expect(isPremiumSeat(SeatType.ExtraLegroom)).toBe(true);
    });

    it('should return false for Standard seat type', () => {
        expect(isPremiumSeat(SeatType.Standard)).toBe(false);
    });

    it('should return false when no priceBand is provided', () => {
        expect(isPremiumSeat(undefined)).toBe(false);
    });
});
