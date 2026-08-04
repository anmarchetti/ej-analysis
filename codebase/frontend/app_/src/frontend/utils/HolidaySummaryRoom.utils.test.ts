import { mockBooking, mockUnitRoom, mockUnitRoomListMock } from 'frontend/__mocks__';
import { IRoom } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { getDatesAndStayDuration, getRoomsMeta } from './HolidaySummaryRoom.utils';

let rooms: IRoom[] = [];

describe('HolidaySummaryRoom.utils', () => {
    beforeEach(() => {
        rooms = [...mockBooking.package.accom.rooms];
    });

    describe('getRoomsMeta', () => {
        const mockRoom = {
            roomNumber: 'RoomTypes.Labels.Room',
            forPeople: 'BookingSummary.Labels.ForPeople',
            title: 'roomType_title',
        };
        const mockBoard = {
            code: 'boardType_code',
            title: 'boardType_title',
            itemName: 'boardType_title',
            name: 'boardType_name',
            content: 'boardType_content',
            description: 'boardType_description',
            iconUrl: 'boardType_icon',
            price: 14,
            pricePP: 7,
        };

        it('Should return result in case of multiple rooms', () => {
            const result = getRoomsMeta(mockUnitRoomListMock, v => v);

            expect(result).toEqual([
                {
                    rooms: [
                        {
                            ...mockRoom,
                            room: {
                                ...mockUnitRoomListMock[0],
                                roomOccupationCount: 4,
                            },
                        },
                        {
                            ...mockRoom,
                            room: {
                                ...mockUnitRoomListMock[1],
                                roomOccupationCount: 4,
                            },
                        },
                    ],
                    board: mockBoard,
                    totalOccupation: 8,
                    boardForPeopleLabel: 'BookingSummary.Labels.ForPeople',
                },
            ]);
        });

        it('Should return result for one man', () => {
            const mock: IUnit = {
                ...mockUnitRoom,
                occupation: {
                    adults: 1,
                    children: 0,
                    infants: 0,
                    paxIds: [],
                    childAges: [],
                },
            };
            const result = getRoomsMeta([mock], v => v);

            expect(result).toEqual([
                {
                    rooms: [
                        {
                            ...mockRoom,
                            forPeople: 'BookingSummary.Labels.ForPerson',
                            room: {
                                ...mock,
                                roomOccupationCount: 1,
                            },
                        },
                    ],
                    board: mockBoard,
                    totalOccupation: 1,
                    boardForPeopleLabel: 'BookingSummary.Labels.ForPerson',
                },
            ]);
        });

        it('Should return result with empty rooms', () => {
            const result = getRoomsMeta([], v => v);

            expect(result).toEqual([]);
        });

        it('One occupation', () => {
            rooms[0].occupation.adults = 1;
            rooms[0].occupation.children = 0;
            rooms[0].occupation.infants = 0;
            const result = getRoomsMeta(rooms as IUnit[], v => v);

            expect(result[0].rooms.length).toBe(1);
            expect(result[0].rooms[0].title).toBe('Double room');
            expect(result[0].totalOccupation).toBe(1);
        });

        it('Empty data', () => {
            const result = getRoomsMeta([], v => v);

            expect(result.length).toBe(0);
        });
    });

    describe('getDatesAndStayDuration', () => {
        it('Should return dates and stay duration in the right format', () => {
            const result = getDatesAndStayDuration('2024-12-01', '2024-12-08', v => v);

            expect(result).toEqual(`01 Dec 2024 - 08 Dec 2024, 7 ${SitecoreDictionary.GlobalsLabelsNightsPlural}`);
        });

        it('Should return empty string when start date and date are NOT provided', () => {
            const result = getDatesAndStayDuration('', '', v => v);

            expect(result).toBeUndefined();
        });
    });
});
