import {
    mockBoardType,
    mockFlightsRoutes,
    mockHotel,
    mockInboundFlight,
    mockOutboundFlight,
    mockTransfer,
    mockUnitRoom,
} from 'frontend/__mocks__';
import { GuestType } from 'models/enum/GuestType';
import { TransferType } from 'models/enum/transfer/TransferType';

import {
    getAccommodationItems,
    getBoardBasketItem,
    getBoardTypeBasketItem,
    getFlightsItems,
    getHotelBasketItem,
    getInboundFlightItem,
    getLuggageAndTransportBasketItems,
    getLuggageBasketItem,
    getNightsBasketItem,
    getNumberOfNightsLabel,
    getOutboundFlightItem,
    getRoomsCountLabel,
    getTransferMetaData,
    IGetBasketItemsParams,
} from './AmendSummaryBasket.utils';

const mockPrams: IGetBasketItemsParams = {
    getPhrase: jest.fn(v => v),
    guestsCounts: {
        [GuestType.Infant]: 1,
        [GuestType.Adult]: 2,
        [GuestType.Child]: 1,
    },
    fields: {
        RoomSingleLabel: {
            value: 'RoomSingleLabel',
        },
        RoomPluralLabel: {
            value: 'RoomPluralLabel',
        },
    },
    hotel: mockHotel,
    board: mockBoardType,
    units: [mockUnitRoom],
    numberOfNights: 7,
    flightRoutes: mockFlightsRoutes,
    transfer: mockTransfer,
    luggageAmount: 4,
};

describe('AmendSummaryBasket.utils', () => {
    describe('getNumberOfNightsLabel', () => {
        it('Return single form', () => {
            const result = getNumberOfNightsLabel(1, v => v);

            expect(result).toBe('Globals.Labels.NumberOfNight');
        });

        it('Return plural form', () => {
            const result = getNumberOfNightsLabel(7, v => v);

            expect(result).toBe('Globals.Labels.NumberOfNights');
        });
    });

    describe('getLuggageAndTransportBasketItems', () => {
        it('Return luggage and transport data and atol info', () => {
            const result = getLuggageAndTransportBasketItems(mockPrams);

            expect(result.length).toBe(3);
            expect(result[0].key).toBe('luggage');
            expect(result[1].key).toBe('transfer');
            expect(result[2].key).toBe('atol');
        });
    });

    describe('getRoomsCountLabel', () => {
        it('Return single room label', () => {
            const result = getRoomsCountLabel(
                mockPrams.fields.RoomSingleLabel!.value,
                mockPrams.fields.RoomPluralLabel!.value,
                mockPrams.units,
            );
            expect(result).toBe('RoomSingleLabel');
        });

        it('Return plural room label', () => {
            const result = getRoomsCountLabel(
                mockPrams.fields.RoomSingleLabel!.value,
                mockPrams.fields.RoomPluralLabel!.value,
                [mockPrams.units![0], mockPrams.units![0]],
            );

            expect(result).toBe('RoomPluralLabel');
        });

        it('Return null', () => {
            const result = getRoomsCountLabel(
                mockPrams.fields.RoomSingleLabel!.value,
                mockPrams.fields.RoomPluralLabel!.value,
                [],
            );

            expect(result).toBeNull();
        });
    });

    describe('getLuggageBasketItem', () => {
        it('Return luggage data', () => {
            const result = getLuggageBasketItem(mockPrams.luggageAmount, mockPrams.getPhrase);

            expect(result!.key).toBe('luggage');
            expect(result!.dataTid).toBe('luggage');
            expect(result!.name).toBe('4 Basket.Labels.HoldBagsPlural');
            expect(result!.icon).toBeTruthy();
        });

        it('Return no bugs label when no luggage', () => {
            const result = getLuggageBasketItem(0, mockPrams.getPhrase);

            expect(result!.key).toBe('luggage');
            expect(result!.dataTid).toBe('luggage');
            expect(result!.name).toBe('Luggage.Labels.HoldBagsNone');
            expect(result!.icon).toBeTruthy();
        });
    });

    describe('getTransferMetaData', () => {
        it('Return private transfer data', () => {
            const result = getTransferMetaData(mockPrams.transfer, mockPrams.getPhrase);

            expect(result.key).toBe('transfer');
            expect(result.dataTid).toBe('PRIVATE');
            expect(result.name).toBe('Transfer Name');
            expect(result.icon).toBeTruthy();
        });

        it('Return shared transfer data', () => {
            const result = getTransferMetaData(
                { ...mockPrams.transfer, type: TransferType.Shared },
                mockPrams.getPhrase,
            );

            expect(result.dataTid).toBe('SHARED');
        });
    });

    describe('getFlightsItems', () => {
        it('Return flights data', () => {
            const result = getFlightsItems(mockPrams);

            expect(result.length).toBe(3);
            expect(result[0].key).toBe('departure');
            expect(result[1].key).toBe('arrival');
            expect(result[2].key).toBe('nights');
        });
    });

    describe('getAccommodationItems', () => {
        it('Return accommodation data', () => {
            const result = getAccommodationItems(mockPrams);

            expect(result.length).toBe(3);
            expect(result[0].key).toBe('hotel');
            expect(result[1].key).toBe('board');
            expect(result[2].key).toBe('board-type');
        });

        it('Return hotel data only', () => {
            const result = getAccommodationItems({ ...mockPrams, board: undefined, units: [] });

            expect(result.length).toBe(1);
            expect(result[0].key).toBe('hotel');
        });
    });

    describe('getBoardTypeBasketItem', () => {
        it('Return board-type data', () => {
            const result = getBoardTypeBasketItem(
                {
                    guestsCounts: mockPrams.guestsCounts,
                    singleFormLabel: mockPrams.fields.RoomSingleLabel?.value,
                    pluralFormLabel: mockPrams.fields.RoomPluralLabel?.value,
                    units: mockPrams.units,
                },
                mockPrams.getPhrase,
            );

            expect(result.key).toBe('board-type');
            expect(result.dataTid).toBe('board-room');
            expect(result.name).toBe(
                '2 Globals.Labels.Adults, 1 Globals.Labels.Child, 1 Globals.Labels.Infant, RoomSingleLabel',
            );
            expect(result.icon).toBeTruthy();
        });

        it('Return board-type data with no units', () => {
            const result = getBoardTypeBasketItem(
                {
                    guestsCounts: mockPrams.guestsCounts,
                    singleFormLabel: mockPrams.fields.RoomSingleLabel?.value,
                    pluralFormLabel: mockPrams.fields.RoomPluralLabel?.value,
                    units: undefined,
                },
                mockPrams.getPhrase,
            );

            expect(result.name).toBe('2 Globals.Labels.Adults, 1 Globals.Labels.Child, 1 Globals.Labels.Infant');
        });
    });

    describe('getInboundFlightItem', () => {
        it('Return inbound flight data', () => {
            const result = getInboundFlightItem(mockInboundFlight);

            expect(result.key).toBe('arrival');
            expect(result.name).toBeTruthy();
            expect(result.icon).toBeTruthy();
        });
    });

    describe('getOutboundFlightItem', () => {
        it('Return outbound flight data', () => {
            const result = getOutboundFlightItem(mockOutboundFlight);

            expect(result.key).toBe('departure');
            expect(result.name).toBeTruthy();
            expect(result.icon).toBeTruthy();
        });
    });

    describe('getBoardBasketItem', () => {
        it('Return board data', () => {
            const result = getBoardBasketItem(mockBoardType);

            expect(result.key).toBe('board');
            expect(result.name).toBe('Half Board');
            expect(result.dataTid).toBe('HB');
            expect(result.icon).toBeTruthy();
        });
    });

    describe('getNightsBasketItem', () => {
        it('Return nights data', () => {
            const result = getNightsBasketItem(mockPrams.getPhrase, 7);

            expect(result.key).toBe('nights');
            expect(result.name).toBe('Globals.Labels.NumberOfNights');
            expect(result.icon).toBeTruthy();
        });
    });

    describe('getHotelBasketItem', () => {
        it('Return hotel data', () => {
            const result = getHotelBasketItem(mockHotel);

            expect(result.key).toBe('hotel');
            expect(result.dataTid).toBe('hotel-location');
            expect(result.name).toBeTruthy();
            expect(result.icon).toBeTruthy();
        });
    });
});
