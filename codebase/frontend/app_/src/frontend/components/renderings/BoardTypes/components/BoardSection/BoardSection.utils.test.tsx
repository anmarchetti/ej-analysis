import { IBoardType } from 'models/data/IHotel';

import { getBoardTypesToShow, getNewAlternativeRooms } from './BoardSection.utils';

describe('BoardSection.utils', () => {
    describe('getNewAlternativeRooms', () => {
        const mockSelectedRoom = {
            code: 'qwe',
            isFreeForKids: true,
            roomType: { title: 'roomTypeTitle', images: [{ small: 'small' }] },
        };
        let params;

        beforeEach(() => {
            params = {
                boardType: { roomAlterations: { qwe: 'qwe' } },
                selectedRooms: [mockSelectedRoom],
                allAlternativeRooms: [{ code: 'qwe' }],
                fallbackImage: 'fallbackImage',
            };
        });

        it('should return array of specific object', () => {
            const res = getNewAlternativeRooms(
                params.boardType,
                params.selectedRooms,
                params.allAlternativeRooms,
                params.fallbackImage,
            );

            expect(res).toEqual([
                {
                    newItem: {
                        fallbackImg: 'fallbackImage',
                        item: {
                            code: 'qwe',
                        },
                        roomIdx: 0,
                    },
                    oldItemName: 'roomTypeTitle',
                    oldItemImgSrc: 'small',
                    isKidsPlaceWilBeRemoved: true,
                },
            ]);
        });

        it('should return roomType title value in result object oldItemName field when it is defined', () => {
            params.selectedRooms = [
                {
                    ...mockSelectedRoom,
                    roomType: { title: { value: 'roomTypeTitleValue' } },
                },
            ];
            const res = getNewAlternativeRooms(
                params.boardType,
                params.selectedRooms,
                params.allAlternativeRooms,
                params.fallbackImage,
            );

            expect(res).toEqual([
                expect.objectContaining({
                    oldItemName: 'roomTypeTitleValue',
                }),
            ]);
        });

        it('should return undefined in result object oldItemImgSrc field when small field is not defined in first selectedRoom images array element', () => {
            params.selectedRooms = [
                {
                    ...mockSelectedRoom,
                    roomType: {},
                },
            ];
            const res = getNewAlternativeRooms(
                params.boardType,
                params.selectedRooms,
                params.allAlternativeRooms,
                params.fallbackImage,
            );

            expect(res).toEqual([
                expect.objectContaining({
                    oldItemImgSrc: undefined,
                }),
            ]);
        });

        it('should return empty array when changedBoard.roomAlterations is NOT provided', () => {
            params.boardType.roomAlterations = undefined;

            const res = getNewAlternativeRooms(
                params.boardType,
                params.selectedRooms,
                params.allAlternativeRooms,
                params.fallbackImage,
            );

            expect(res).toEqual([]);
        });

        it('should return an empty array when roomAlterations param does not contain value for selected room code', () => {
            params.boardType.roomAlterations = {};

            const res = getNewAlternativeRooms(
                params.boardType,
                params.selectedRooms,
                params.allAlternativeRooms,
                params.fallbackImage,
            );

            expect(res).toEqual([]);
        });

        it('should return an empty array when allAlternativeRooms param is an empty array', () => {
            params.allAlternativeRooms = [];

            const res = getNewAlternativeRooms(
                params.boardType,
                params.selectedRooms,
                params.allAlternativeRooms,
                params.fallbackImage,
            );

            expect(res).toEqual([]);
        });
    });

    describe('getBoardTypesToShow', () => {
        const getMockedBoardType = (code: string): IBoardType => ({
            code,
            title: 'title',
            content: 'content',
            description: 'description',
            iconUrl: 'iconUrl',
        });
        let params;

        beforeEach(() => {
            params = {
                selectedBoard: getMockedBoardType('selected'),
                alternativeBoards: [
                    getMockedBoardType('alt-0'),
                    getMockedBoardType('alt-1'),
                    getMockedBoardType('alt-2'),
                    getMockedBoardType('nextMoreExpensive'),
                ],
                allBoardTypes: [
                    getMockedBoardType('alt-0'),
                    getMockedBoardType('alt-1'),
                    getMockedBoardType('alt-2'),
                    getMockedBoardType('nextMoreExpensive'),
                    getMockedBoardType('selected'),
                ],
                offer: {},
                isEditMode: false,
                isCollapsed: true,
                isExtrasPage: true,
                drawerMode: false,
                nextMoreExpensive: getMockedBoardType('nextMoreExpensive'),
                isMostExpensiveBoardSelected: true,
            };
        });

        it('should return array with only selected board', () => {
            const res = getBoardTypesToShow(params);

            expect(res).toEqual([params.selectedBoard]);
        });

        describe('experience editor', () => {
            it('should return allBoardTypes when offer param is not defined', () => {
                params.offer = undefined;

                const res = getBoardTypesToShow(params);

                expect(res).toEqual(params.allBoardTypes);
            });

            it('should return allBoardTypes when isEditMode param is true', () => {
                params.isEditMode = true;
                const res = getBoardTypesToShow(params);

                expect(res).toEqual(params.allBoardTypes);
            });
        });

        it('should return allBoardTypes when allBoardTypes param length is less then 2', () => {
            params.allBoardTypes = [params.selectedBoard];
            const res = getBoardTypesToShow(params);

            expect(res).toEqual(params.allBoardTypes);
        });

        it('should return alternativeBoards when drawerMode param is true', () => {
            params.drawerMode = true;
            const res = getBoardTypesToShow(params);

            expect(res).toEqual(params.alternativeBoards);
        });

        it('should return specific array when isCollapsed param is false', () => {
            params.isCollapsed = false;
            const res = getBoardTypesToShow(params);

            expect(res).toEqual([params.selectedBoard, ...params.alternativeBoards]);
        });

        it('should return specific array when isExtrasPage is false', () => {
            params.isExtrasPage = false;

            const res = getBoardTypesToShow(params);

            expect(res).toEqual([params.selectedBoard, params.alternativeBoards[0], params.alternativeBoards[1]]);
        });
    });
});
