import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import { getDurationLabel, getGuestsAmountInRoom } from 'frontend/utils/accommodation.utils';
import { getRoomName } from 'frontend/utils/offer.utils';
import { roomTitleNormalize } from 'frontend/utils/string.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IBoardType, IRoom } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import { formatDatesRange, getDaysDifference } from './date.utils';

interface IBoardWithOccupation {
    board: IRoom['boardType'];
    rooms: (IRoom & { roomOccupationCount: number })[];
    totalOccupation: number;
}

export interface IMetaRoom {
    forPeople: Nullable<string>;
    room: IRoom & { roomOccupationCount: number };
    roomNumber: Nullable<string>;
    title: string | ISitecoreField<string>;
}

interface IMeta {
    board: IBoardType;
    boardForPeopleLabel: Nullable<string>;
    rooms: IMetaRoom[];
    totalOccupation: number;
}

const collectRoomsByBoard = (units: IUnit[]): Record<string, IBoardWithOccupation> =>
    units.reduce((acc, unit) => {
        // Calculate total unit's occupation
        const roomOccupationCount = getGuestsAmountInRoom(unit.occupation);
        // Adding new room
        const rooms = [...(acc[unit.boardType.code]?.rooms || []), { ...unit, roomOccupationCount }];

        // Update board type with rooms and update occupation for board type
        return {
            [unit.boardType.code]: {
                rooms,
                board: unit.boardType,
                totalOccupation: (acc[unit.boardType.code]?.totalOccupation || 0) + roomOccupationCount,
            },
        };
    }, {});

const getBoardForPeopleLabel = (total: number, getPhrase: (s: string) => string): string =>
    Tokenizer.replaceToken(
        getPhrase(
            total > 1
                ? SitecoreDictionary.BookingSummaryLabelsForPeople
                : SitecoreDictionary.BookingSummaryLabelsForPerson,
        ),
        Tokens.People,
        total.toString(),
    );

const getRoomNumber = (index: number, getPhrase: (s: string) => string): string =>
    Tokenizer.replaceToken(getPhrase(SitecoreDictionary.RoomTypesLabelsRoom), Tokens.Number, index.toString());

const getLabelForPeople = (roomsCount: number, getPhrase: (s: string) => string): string =>
    Tokenizer.replaceToken(
        getPhrase(
            roomsCount > 1
                ? SitecoreDictionary.BookingSummaryLabelsForPeople
                : SitecoreDictionary.BookingSummaryLabelsForPerson,
        ),
        Tokens.People,
        roomsCount.toString(),
    );

const buildRoomsMeta = (
    getPhrase: (s: string) => string,
    rooms?: IBoardWithOccupation['rooms'],
): {
    forPeople: Nullable<string>;
    room: IBoardWithOccupation['rooms'][number];
    roomNumber: Nullable<string>;
    title: string;
}[] =>
    (rooms || []).map((room, i) => {
        const roomNumber = getRoomNumber(i + 1, getPhrase);
        const forPeople = getLabelForPeople(room.roomOccupationCount, getPhrase);
        const title = roomTitleNormalize(getRoomName(room.roomType));

        return {
            roomNumber,
            forPeople,
            title,
            room,
        };
    });

export const getRoomsMeta = (units: IUnit[], getPhrase: (s: string) => string): IMeta[] => {
    const roomsByBoard = collectRoomsByBoard(units);

    return Object.values(roomsByBoard).map(data => ({
        ...data,
        boardForPeopleLabel: getBoardForPeopleLabel(data.totalOccupation, getPhrase),
        rooms: buildRoomsMeta(getPhrase, data.rooms),
    }));
};

export const getDatesAndStayDuration = (
    startDate: string,
    endDate: string,
    getPhrase: (s: string) => string,
): Nullable<string> => {
    if (!startDate || !endDate) return;

    const startDateFormatted = new Date(startDate);
    const endDateFormatted = new Date(endDate);

    const nights = getDaysDifference(endDateFormatted, startDateFormatted);
    const stayDuration = getDurationLabel(getPhrase, nights);
    const dateRange = formatDatesRange(startDateFormatted, endDateFormatted, DATE_FORMATS.dateWithAbbrMonthName);

    return [dateRange, stayDuration].join(', ');
};
