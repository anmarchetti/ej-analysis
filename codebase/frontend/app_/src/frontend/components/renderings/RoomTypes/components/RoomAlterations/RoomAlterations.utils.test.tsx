import { IBoardType } from 'models/data/IHotel';
import { IAltBoard } from 'models/data/IOffer';
import {
    defaultRoom,
    nextMostExpensiveToSelectedRoom,
    roomWithFacilitiesAndPhotos,
} from 'frontend/components/renderings/RoomTypes/components/__mocks__/rooms';

import { getNewAlternativeBoards, getNewAlternativeRooms } from './RoomAlterations.utils';

describe('RoomAlterations.utils', () => {
    describe('getNewAlternativeRooms', () => {
        let params;

        beforeEach(() => {
            params = {
                offerUnits: [roomWithFacilitiesAndPhotos, roomWithFacilitiesAndPhotos],
                changedRoomSectionIdx: 1,
                isContractChanged: true,
                fallbackImage: 'fallbackImage',
            };
        });

        it('Should return alteration results with all active rooms when the changedRoomSectionIdx is greater than the number of available rooms', () => {
            params.changedRoomSectionIdx = 2;
            const res = getNewAlternativeRooms(
                params.offerUnits,
                params.changedRoomSectionIdx,
                params.isContractChanged,
                params.fallbackImage,
            );

            expect(res).toEqual([
                {
                    newItem: { item: params.offerUnits[0], roomIdx: 0, fallbackImg: params.fallbackImage },
                    oldItemName: 'Double Room with Sea View',
                    oldItemImgSrc: 'small',
                },
                {
                    newItem: { item: params.offerUnits[1], roomIdx: 1, fallbackImg: params.fallbackImage },
                    oldItemName: 'Double Room with Sea View',
                    oldItemImgSrc: 'small',
                },
            ]);
        });

        it('Should return alteration results without room with changedRoomSectionIdx', () => {
            params.offerUnits[0] = {
                ...roomWithFacilitiesAndPhotos,
                roomType: { ...roomWithFacilitiesAndPhotos.roomType, title: 'test' },
            };
            const res = getNewAlternativeRooms(
                params.offerUnits,
                params.changedRoomSectionIdx,
                params.isContractChanged,
                params.fallbackImage,
            );

            expect(res).toEqual([
                {
                    newItem: {
                        item: params.offerUnits[0],
                        roomIdx: 0,
                        fallbackImg: params.fallbackImage,
                    },
                    oldItemName: 'test',
                    oldItemImgSrc: 'small',
                },
            ]);
        });

        it('Should return alteration results with 2+ rooms', () => {
            params.offerUnits = [
                roomWithFacilitiesAndPhotos,
                roomWithFacilitiesAndPhotos,
                roomWithFacilitiesAndPhotos,
                roomWithFacilitiesAndPhotos,
            ];
            const res = getNewAlternativeRooms(
                params.offerUnits,
                params.changedRoomSectionIdx,
                params.isContractChanged,
                params.fallbackImage,
            );

            expect(res).toEqual([
                {
                    newItem: {
                        item: params.offerUnits[0],
                        roomIdx: 0,
                        fallbackImg: params.fallbackImage,
                    },
                    oldItemName: 'Double Room with Sea View',
                    oldItemImgSrc: 'small',
                },
                {
                    newItem: {
                        item: params.offerUnits[1],
                        roomIdx: 2,
                        fallbackImg: params.fallbackImage,
                    },
                    oldItemName: 'Double Room with Sea View',
                    oldItemImgSrc: 'small',
                },
                {
                    newItem: {
                        item: params.offerUnits[2],
                        roomIdx: 3,
                        fallbackImg: params.fallbackImage,
                    },
                    oldItemName: 'Double Room with Sea View',
                    oldItemImgSrc: 'small',
                },
            ]);
        });

        it('Should NOT return alteration results when isContractChanged is false', () => {
            params.isContractChanged = false;
            const res = getNewAlternativeRooms(
                params.offerUnits,
                params.changedRoomSectionIdx,
                params.isContractChanged,
                params.fallbackImage,
            );

            expect(res).toHaveLength(0);
        });
    });

    describe('getNewAlternativeBoards', () => {
        const getMockedBoard = (code: string): IAltBoard | IBoardType => ({
            code,
            title: `title-${code}`,
            content: 'content',
            description: 'description',
            iconUrl: 'iconUrl',
        });

        let params;

        beforeEach(() => {
            params = {
                allBoards: [
                    getMockedBoard('board-0'),
                    getMockedBoard(nextMostExpensiveToSelectedRoom.requireBoardAlteration),
                    getMockedBoard('board-2'),
                ],
                changedRoom: nextMostExpensiveToSelectedRoom,
            };
        });

        it('Should return an array with the alteration results when the selected room has board alteration option', () => {
            const res = [
                {
                    newItem: { item: params.allBoards[1] },
                    oldItemName: params.allBoards[0].title,
                    oldItemImgSrc: params.allBoards[0].iconUrl,
                },
            ];

            expect(getNewAlternativeBoards(params.allBoards, params.changedRoom)).toEqual(res);
        });

        it('Should return an empty array when the selected room has no board alteration option', () => {
            params.changedRoom = defaultRoom;

            expect(getNewAlternativeBoards(params.allBoards, params.changedRoom)).toHaveLength(0);
        });

        it('Should return an empty array when the selected room has board alteration code but board with that code does not exist', () => {
            params.allBoards = [getMockedBoard('board-0'), getMockedBoard('board-1')];
            expect(getNewAlternativeBoards(params.allBoards, params.changedRoom)).toHaveLength(0);
        });

        it('no alt boards => empty result', () => {
            params.allBoards = [];
            expect(getNewAlternativeBoards(params.allBoards, params.changedRoom)).toHaveLength(0);
        });
    });
});
