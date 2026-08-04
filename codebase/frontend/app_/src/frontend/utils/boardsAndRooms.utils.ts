import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IUnit } from 'models/data/IOffer';
import { IAmendRoomAndBoardFields } from 'frontend/components/renderings/AmendRoomAndBoard/AmendRoomAndBoard';

export const getAltRoomsTitle = (fields: IAmendRoomAndBoardFields, rooms: IUnit[]): string => {
    const { AltRoomsTitlePlural, AltRoomsTitle } = fields;

    return (
        Tokenizer.replaceToken(
            rooms.length > 1 ? AltRoomsTitlePlural.value : AltRoomsTitle.value,
            Tokens.Amount,
            rooms.length.toString(),
        ) ?? ''
    );
};
