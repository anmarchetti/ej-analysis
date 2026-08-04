import { deepClone, haveSameElements } from 'frontend/utils/array.utils';

import { IQueryRoom } from './data/URLQueryRooms';
import { IGuestAllocation } from './GuestInfo';
import { RoomAllocation } from './RoomAllocation';

export const getAdultsQuantity = (roomsAllocation: (RoomAllocation | IGuestAllocation)[]): number =>
    roomsAllocation.reduce((total, room) => total + room.adults.length, 0);

export const getChildrenQuantity = (roomsAllocation: (RoomAllocation | IGuestAllocation)[]): number =>
    roomsAllocation.reduce((total, room) => total + room.children.length, 0);

export const getInfantsQuantity = (roomsAllocation: (RoomAllocation | IGuestAllocation)[]): number =>
    roomsAllocation.reduce((total, room) => total + room.infants.length, 0);

export const getAdultsQuantityForRecent = (roomsAllocation: IQueryRoom[]): number =>
    roomsAllocation.reduce((total, room) => total + room.adults, 0);

export const getChildrenQuantityForRecent = (roomsAllocation: IQueryRoom[]): number =>
    roomsAllocation.reduce((total, room) => total + room.children, 0);

export const getInfantsQuantityForRecent = (roomsAllocation: IQueryRoom[]): number =>
    roomsAllocation.reduce((total, room) => total + room.infants, 0);

export const adjustRooms = (rooms: RoomAllocation[], delta: number): RoomAllocation[] => {
    if (delta < 0) {
        return rooms.slice(0, delta);
    }

    if (delta > 0) {
        const newRooms = [...rooms];

        for (let i = 0; i < delta; i++) {
            newRooms.push(new RoomAllocation());
            newRooms[newRooms.length - 1].addAdult(true);
        }

        return newRooms;
    }

    return rooms;
};

export const filterRoomsById = (rooms: RoomAllocation[], id: number): RoomAllocation[] =>
    rooms.filter(room => room.id !== id);

export const isRoomAllocationNonStandard = (rooms: RoomAllocation[]): boolean => {
    const firstRoom = rooms[0];
    const { adults, children, infants } = firstRoom || {};

    return rooms.length !== 1 || adults.length !== 2 || children.length !== 0 || infants.length !== 0;
};

export const isDefaultAmountPassengersInRooms = (rooms: RoomAllocation[]): boolean => {
    for (const room of rooms) {
        const { adults, children, infants } = room;

        if (adults.length !== 1 || children.length !== 0 || infants.length !== 0) {
            return false;
        }
    }

    return true;
};

/** Destruct room object to a comparable object */
export const destructRoom = (rooms: RoomAllocation[]) =>
    // Remove IDs from Adult, Children & Infant objects as these change if one is removed then read. Also removes all functions and undefined keys
    rooms.map(item => ({
        adults: item.adults.map(({ id, ...rest }) => deepClone(rest as any)),
        children: item.children.map(({ id, ...rest }) => deepClone(rest as any)),
        infants: item.infants.map(({ id, ...rest }) => deepClone(rest as any)),
        roomCode: item.roomCode ?? '',
    }));

export const compareRooms = (rooms: RoomAllocation[], recentSearchesRooms: IQueryRoom[] | undefined): boolean => {
    if (!recentSearchesRooms?.length || rooms.length !== recentSearchesRooms.length) return false;

    for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];
        const recentSearchesRoom = recentSearchesRooms[i];

        const adultsCount = room.adults?.length ?? 0;
        const childrenCount = room.children?.length ?? 0;
        const infantsCount = room.infants?.length ?? 0;
        const childrenAges = room.children?.map(ch => ch.age) ?? [];

        if (
            adultsCount !== recentSearchesRoom.adults ||
            childrenCount !== recentSearchesRoom.children ||
            infantsCount !== recentSearchesRoom.infants ||
            !haveSameElements(childrenAges, recentSearchesRoom.childrenAges)
        ) {
            return false;
        }
    }

    return true;
};
