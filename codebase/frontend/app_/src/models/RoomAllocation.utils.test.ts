import * as arrayUtils from 'frontend/utils/array.utils';

import { GuestType } from './enum/GuestType';
import { GuestInfo } from './GuestInfo';
import { RoomAllocation } from './RoomAllocation';
import {
    adjustRooms,
    compareRooms,
    destructRoom,
    filterRoomsById,
    getAdultsQuantity,
    getAdultsQuantityForRecent,
    getChildrenQuantity,
    getChildrenQuantityForRecent,
    getInfantsQuantity,
    getInfantsQuantityForRecent,
    isDefaultAmountPassengersInRooms,
    isRoomAllocationNonStandard,
} from './RoomAllocation.utils';

describe('RoomAllocation.utils', () => {
    it('should return amount of adults in room class', () => {
        const room = new RoomAllocation();

        room.addAdult();

        const result = getAdultsQuantity([room]);

        expect(result).toBe(1);
    });

    it('should return amount of children in room class', () => {
        const room = new RoomAllocation();

        room.addChild();

        const result = getChildrenQuantity([room]);

        expect(result).toBe(1);
    });

    it('should return amount of infants in room class', () => {
        const room = new RoomAllocation();

        room.addInfant();

        const result = getInfantsQuantity([room]);

        expect(result).toBe(1);
    });

    it('should return amount of adults in query room', () => {
        const result = getAdultsQuantityForRecent([
            { adults: 1, children: 0, infants: 0, roomCode: 'A', childrenAges: [] },
        ]);

        expect(result).toBe(1);
    });

    it('should return amount of children in query room', () => {
        const result = getChildrenQuantityForRecent([
            { adults: 0, children: 1, infants: 0, roomCode: 'A', childrenAges: [] },
        ]);

        expect(result).toBe(1);
    });

    it('should return amount of infants in query room', () => {
        const result = getInfantsQuantityForRecent([
            { adults: 0, children: 0, infants: 1, roomCode: 'A', childrenAges: [] },
        ]);

        expect(result).toBe(1);
    });

    describe('adjustRooms', () => {
        it('should return an empty array with negative delta', () => {
            const mockRooms = [new RoomAllocation()];
            const result = adjustRooms(mockRooms, -1);

            expect(result.length).toBe(0);
        });

        it('should return initial array with 0 delta', () => {
            const mockRooms = [new RoomAllocation()];
            const result = adjustRooms(mockRooms as any, 0);

            expect(result.length).toBe(1);
        });

        it('should return mutated array with positive delta', () => {
            const mockRooms = [new RoomAllocation()];
            const result = adjustRooms(mockRooms, 3);

            expect(result.length).toBe(4);
            expect(result[1] instanceof RoomAllocation).toBe(true);
        });
    });

    describe('filterRoomsById', () => {
        it('should filter rooms with filterRoomsById', () => {
            const rooms = [
                new RoomAllocation(),
                new RoomAllocation(),
                { ...new RoomAllocation(), id: 3 } as RoomAllocation,
            ];
            const result = filterRoomsById(rooms, 3);

            expect(result.length).toBe(2);
        });
    });

    describe('isDefaultAmountPassengersInRooms', () => {
        it('should return true when the number of adults is 1 and there is no children and infants in each room', () => {
            const rooms = [new RoomAllocation()];
            rooms[0].addAdult();
            const result = isDefaultAmountPassengersInRooms(rooms);

            expect(result).toBe(true);
        });

        it('should return false when the number of adults is not equal to 1 in at least one room', () => {
            const rooms = [new RoomAllocation()];
            rooms[0].addAdult();
            rooms[0].addAdult();
            const result = isDefaultAmountPassengersInRooms(rooms);

            expect(result).toBe(false);
        });

        it('should return true when the number of children is greater than 0 in at least one room', () => {
            const rooms = [new RoomAllocation()];
            rooms[0].addChild();
            const result = isDefaultAmountPassengersInRooms(rooms);

            expect(result).toBe(false);
        });

        it('should return true when the number of infants is greater than 0 in at least one room', () => {
            const rooms = [new RoomAllocation()];
            rooms[0].addInfant();
            const result = isDefaultAmountPassengersInRooms(rooms);

            expect(result).toBe(false);
        });
    });

    describe('isRoomAllocationNonStandard', () => {
        it('should return false for standard allocation', () => {
            const room = new RoomAllocation();

            room.addAdult();
            room.addAdult();

            const rooms = [room];
            const result = isRoomAllocationNonStandard(rooms);

            expect(result).toBe(false);
        });

        it('should return true when empty array is passed', () => {
            const result = isRoomAllocationNonStandard([]);

            expect(result).toBe(true);
        });

        it('should return true when room count is greater than 1', () => {
            const rooms = [new RoomAllocation(), new RoomAllocation()];
            const result = isRoomAllocationNonStandard(rooms);

            expect(result).toBe(true);
        });

        it('should return true when adults count is not equal to 2', () => {
            const room = new RoomAllocation();

            room.addAdult();

            const rooms = [room];
            const result = isRoomAllocationNonStandard(rooms);

            expect(result).toBe(true);
        });

        it('should return true when children count is not equal to 0', () => {
            const room = new RoomAllocation();

            room.addChild();

            const rooms = [room];
            const result = isRoomAllocationNonStandard(rooms);

            expect(result).toBe(true);
        });

        it('should return true when infants count is not equal to 0', () => {
            const room = new RoomAllocation();

            room.addInfant();

            const rooms = [room];
            const result = isRoomAllocationNonStandard(rooms);

            expect(result).toBe(true);
        });
    });

    describe('destructRoom', () => {
        it('should return correct object and call deepClone for each adult, child and infant without id prop', () => {
            const mockDeepClone = jest.spyOn(arrayUtils, 'deepClone').mockImplementation(value => value);
            const mockAdult = {
                firstName: 'firstName1',
                type: GuestType.Adult,
            };
            const mockChild = { firstName: 'firstName2', type: GuestType.Child };
            const mockInfant = { firstName: 'firstName3', type: GuestType.Infant };
            const mockRooms = [
                {
                    adults: [{ ...mockAdult, id: '1' }],
                    children: [{ ...mockChild, id: '2' }],
                    infants: [{ ...mockInfant, id: '3' }],
                    roomCode: 'code',
                },
            ] as RoomAllocation[];

            const res = destructRoom(mockRooms);

            expect(res).toEqual([
                {
                    adults: [mockAdult],
                    children: [mockChild],
                    infants: [mockInfant],
                    roomCode: 'code',
                },
            ]);
            expect(mockDeepClone).toHaveBeenCalledTimes(3);
            expect(mockDeepClone).toHaveBeenCalledWith(mockAdult);
            expect(mockDeepClone).toHaveBeenCalledWith(mockChild);
            expect(mockDeepClone).toHaveBeenCalledWith(mockInfant);
        });

        it('should use empty string for roomCode when it is not defined', () => {
            const mockRooms = [
                {
                    adults: [] as GuestInfo[],
                    children: [] as GuestInfo[],
                    infants: [] as GuestInfo[],
                    roomCode: undefined,
                },
            ] as RoomAllocation[];

            const result = destructRoom(mockRooms);

            expect(result).toEqual([
                {
                    adults: [],
                    children: [],
                    infants: [],
                    roomCode: '',
                },
            ]);
        });
    });

    describe('compareRooms', () => {
        const recentSearchesRooms = [
            { adults: 1, children: 1, infants: 1, roomCode: 'A', childrenAges: [5] },
            { adults: 1, children: 0, infants: 0, roomCode: 'B', childrenAges: [] },
        ];

        it('should return true when rooms are equal', () => {
            const rooms = [new RoomAllocation(), new RoomAllocation()];
            rooms[0].addAdult();
            rooms[0].addChild();
            rooms[0].children[0].age = 5;
            rooms[0].addInfant();

            rooms[1].addAdult();

            const result = compareRooms(rooms, recentSearchesRooms);

            expect(result).toBe(true);
        });

        it('should return false when children moved to another room', () => {
            const rooms = [new RoomAllocation(), new RoomAllocation()];
            rooms[0].addAdult();
            rooms[0].addInfant();

            rooms[1].addAdult();
            rooms[1].addChild();
            rooms[1].children[0].age = 5;

            const result = compareRooms(rooms, recentSearchesRooms);

            expect(result).toBe(false);
        });

        it('should return false when age is changed', () => {
            const rooms = [new RoomAllocation(), new RoomAllocation()];
            rooms[0].addAdult();
            rooms[0].addChild();
            rooms[0].children[0].age = 6;
            rooms[0].addInfant();

            rooms[1].addAdult();

            const result = compareRooms(rooms, recentSearchesRooms);

            expect(result).toBe(false);
        });

        it('should return false when count of adults is different', () => {
            const rooms = [new RoomAllocation(), new RoomAllocation()];
            rooms[0].addAdult();
            rooms[0].addChild();
            rooms[0].children[0].age = 5;
            rooms[0].addInfant();

            rooms[1].addAdult();
            rooms[1].addAdult();

            const result = compareRooms(rooms, recentSearchesRooms);

            expect(result).toBe(false);
        });

        it('should return false when count of infant is different', () => {
            const rooms = [new RoomAllocation(), new RoomAllocation()];
            rooms[0].addAdult();
            rooms[0].addChild();
            rooms[0].children[0].age = 6;

            rooms[1].addAdult();

            const result = compareRooms(rooms, recentSearchesRooms);

            expect(result).toBe(false);
        });

        it('should return false when count of rooms is different', () => {
            const rooms = [new RoomAllocation()];

            const result = compareRooms(rooms, recentSearchesRooms);

            expect(result).toBe(false);
        });
    });
});
