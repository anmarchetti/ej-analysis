import { mockRoom } from 'frontend/__mocks__';
import { IMetaRoom } from 'frontend/utils/HolidaySummaryRoom.utils';

import { getRoomTitle } from './AmendPaymentRoomsAndBoards.utils';

describe('AmendPaymentRoomsAndBoards.utils', () => {
    describe('getRoomTitle', () => {
        const metaData: IMetaRoom = {
            forPeople: 'forPeople',
            room: {
                ...mockRoom,
                roomOccupationCount: 3,
            },
            roomNumber: 'Room 1',
            title: 'See view room',
        };

        it("Should return room's title without separate it by rooms", () => {
            const result = getRoomTitle(metaData);

            expect(result).toBe('3 See view room');
        });

        it('Should return title separated by rooms', () => {
            const result = getRoomTitle(metaData, true);

            expect(result).toBe('Room 1: See view room forPeople');
        });
    });
});
