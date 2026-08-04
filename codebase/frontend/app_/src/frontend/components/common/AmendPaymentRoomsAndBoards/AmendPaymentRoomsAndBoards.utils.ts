import { IMetaRoom } from 'frontend/utils/HolidaySummaryRoom.utils';

export const getRoomTitle = ({ room, title, roomNumber, forPeople }: IMetaRoom, areSeparateRooms?: boolean): string => {
    if (areSeparateRooms) {
        return `${roomNumber}: ${title} ${forPeople}`;
    }

    return `${room.roomOccupationCount} ${title}`;
};
