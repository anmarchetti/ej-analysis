import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';

import { getAltRoomsTitle } from './boardsAndRooms.utils';

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceToken: jest.fn().mockReturnValue('AltRoomsTitle'),
    },
}));

describe('boardAndRooms.utils', () => {
    describe('getAltRoomsTitle', () => {
        const fields = {
            AltRoomsTitle: { value: 'Room' },
            AltRoomsTitlePlural: { value: 'Rooms' },
        } as any;

        it('should use AltRoomsTitle when there is only one room and return result', () => {
            const rooms = [{ id: 1, name: 'Room 1' }] as any;

            const result = getAltRoomsTitle(fields, rooms);

            expect(Tokenizer.replaceToken).toHaveBeenCalledWith('Room', Tokens.Amount, '1');
            expect(result).toBe('AltRoomsTitle');
        });

        it('should use AltRoomsTitlePlural when there are multiple rooms', () => {
            const rooms = [
                { id: 1, name: 'Room 1' },
                { id: 2, name: 'Room 2' },
            ] as any;

            const result = getAltRoomsTitle(fields, rooms);

            expect(Tokenizer.replaceToken).toHaveBeenCalledWith('Rooms', Tokens.Amount, '2');
            expect(result).toBe('AltRoomsTitle');
        });
    });
});
