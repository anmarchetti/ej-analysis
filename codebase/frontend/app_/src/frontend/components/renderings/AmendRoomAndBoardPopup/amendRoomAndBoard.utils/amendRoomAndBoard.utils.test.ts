import {
    boardType,
    mockAccomData,
    mockAmendHotelOffer,
    mockAmendHotelRoomAndBoardOffer,
    mockUnitRoom,
} from 'frontend/__mocks__';
import { deepClone } from 'frontend/utils/array.utils';
import { IAmendHotelRoomAndBoardOffer } from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { IUnit } from 'models/data/IOffer';

import {
    checkBoardOfferForCompliance,
    checkIsTheSameOffer,
    checkRoomOfferForCompliance,
    constructAltBoardsFromOffers,
    constructAltRoomsFromOffers,
    findChosenOffer,
    getBoardTypeFromOffer,
    getRoomTypeFromOffer,
} from './amendRoomAndBoard.utils';

describe('amendRoomAndBoard.utils', () => {
    const mockRoomType = mockAmendHotelOffer.accom.unit[0].roomType;
    const mockBoardType = mockAmendHotelOffer.accom.unit[0].boardType;
    const mockUnit: IUnit = { ...mockAmendHotelOffer.accom.unit[0], price: 100 };

    describe('getRoomTypeFromOffer', () => {
        it('should return the room type from the offer', () => {
            expect(getRoomTypeFromOffer(mockAmendHotelOffer)).toEqual(mockRoomType);
        });
    });

    describe('getBoardTypeFromOffer', () => {
        it('should return the board type from the offer', () => {
            expect(getBoardTypeFromOffer(mockAmendHotelOffer)).toEqual(mockBoardType);
        });
    });

    describe('findChosenOffer', () => {
        it('should find the chosen offer based on room and board type', () => {
            const allOffers = [mockAmendHotelRoomAndBoardOffer];
            expect(findChosenOffer(mockUnit, allOffers)).toEqual(mockAmendHotelOffer);
        });

        it('should return undefined if no matching offer is found', () => {
            const allOffers = [];
            expect(findChosenOffer(mockUnit, allOffers)).toBeUndefined();
        });
    });

    describe('checkRoomOfferForCompliance', () => {
        it('should return true if room types match', () => {
            expect(checkRoomOfferForCompliance(mockAmendHotelOffer, mockAmendHotelOffer)).toBe(true);
        });

        it('should return false if room types do not match', () => {
            const differentRoomTypeOffer = {
                ...mockAmendHotelOffer,
                accom: {
                    ...mockAccomData,
                    unit: [{ ...mockUnitRoom, roomType: { ...mockUnitRoom.roomType, code: 'room2', name: 'Room 2' } }],
                },
            };
            expect(checkRoomOfferForCompliance(differentRoomTypeOffer, mockAmendHotelOffer)).toBe(false);
        });
    });

    describe('checkBoardOfferForCompliance', () => {
        it('should return true if board types match', () => {
            expect(checkBoardOfferForCompliance(mockAmendHotelOffer, mockAmendHotelOffer)).toBe(true);
        });

        it('should return false if board types do not match', () => {
            const differentBoardTypeOffer = {
                ...mockAmendHotelOffer,
                accom: {
                    ...mockAccomData,
                    unit: [
                        { ...mockUnitRoom, boardType: { ...mockUnitRoom.boardType, code: 'board2', name: 'Board 2' } },
                    ],
                },
            };
            expect(checkBoardOfferForCompliance(differentBoardTypeOffer, mockAmendHotelOffer)).toBe(false);
        });
    });

    describe('constructAltRoomsFromOffers', () => {
        it('should construct alternative rooms from offers', () => {
            const allOffers = [mockAmendHotelRoomAndBoardOffer];
            const expected = [{ ...mockUnit, price: 23.45 }];
            expect(constructAltRoomsFromOffers(allOffers, mockAmendHotelOffer)).toEqual(expected);
        });
    });

    describe('constructAltBoardsFromOffers', () => {
        it('should construct alternative boards from offers', () => {
            const allOffers = [mockAmendHotelRoomAndBoardOffer];
            const expected = [{ ...mockUnit, price: 23.45 }];
            expect(constructAltBoardsFromOffers(allOffers, mockAmendHotelOffer)).toEqual(expected);
        });
    });

    describe('checkIsTheSameOffer', () => {
        it('should return true if both room and board types match', () => {
            expect(checkIsTheSameOffer(mockAmendHotelOffer, mockAmendHotelOffer)).toBe(true);
        });

        it('should return false if room types do not match', () => {
            const differentRoomTypeOffer = {
                ...mockAmendHotelOffer,
                accom: {
                    ...mockAccomData,
                    unit: [{ ...mockUnitRoom, roomType: { ...mockUnitRoom.roomType, code: 'room2', name: 'Room 2' } }],
                },
            };
            expect(checkIsTheSameOffer(differentRoomTypeOffer, mockAmendHotelOffer)).toBe(false);
        });

        it('should return false if board types do not match', () => {
            const differentBoardTypeOffer = {
                ...mockAmendHotelOffer,
                accom: {
                    ...mockAccomData,
                    unit: [
                        { ...mockUnitRoom, boardType: { ...mockUnitRoom.boardType, code: 'board2', name: 'Board 2' } },
                    ],
                },
            };
            expect(checkIsTheSameOffer(differentBoardTypeOffer, mockAmendHotelOffer)).toBe(false);
        });

        it('should return false if both room and board types do not match', () => {
            const differentOffer = {
                ...mockAmendHotelOffer,
                accom: {
                    ...mockAccomData,
                    unit: [
                        {
                            ...mockUnitRoom,
                            roomType: { ...mockUnitRoom.roomType, code: 'room2', name: 'Room 2' },
                            boardType: { ...mockUnitRoom.boardType, code: 'board2', name: 'Board 2' },
                        },
                    ],
                },
            };
            expect(checkIsTheSameOffer(differentOffer, mockAmendHotelOffer)).toBe(false);
        });

        describe('constructAltOffers', () => {
            it('should construct alternative offers based on room type', () => {
                const allOffers = [mockAmendHotelRoomAndBoardOffer];
                const expected = [{ ...mockUnit, price: 23.45 }];
                expect(constructAltRoomsFromOffers(allOffers, mockAmendHotelOffer)).toEqual(expected);
            });

            it('should construct alternative offers based on board type', () => {
                const allOffers = [mockAmendHotelRoomAndBoardOffer];
                const expected = [{ ...mockUnit, price: 23.45 }];
                expect(constructAltBoardsFromOffers(allOffers, mockAmendHotelOffer)).toEqual(expected);
            });

            it('should return an empty array if no offers are provided', () => {
                const allOffers: IAmendHotelRoomAndBoardOffer[] = [];
                expect(constructAltRoomsFromOffers(allOffers, mockAmendHotelOffer)).toEqual([]);
                expect(constructAltBoardsFromOffers(allOffers, mockAmendHotelOffer)).toEqual([]);
            });

            it('should return only compatible and cheapest offer based on room type', () => {
                const offerWithSameRoomAsSelected = deepClone(mockAmendHotelRoomAndBoardOffer);
                const offerWithDifferentRoomAndBoard = deepClone(mockAmendHotelRoomAndBoardOffer);
                const offerWithOtherRoomAndCheapBoard = deepClone(mockAmendHotelRoomAndBoardOffer);
                const offerWithOtherRoomAndExpensiveBoard = deepClone(mockAmendHotelRoomAndBoardOffer);
                const offerWithOtherRoomAndExpensiveBoard2 = deepClone(mockAmendHotelRoomAndBoardOffer);
                const secondRoomType = { ...mockRoomType, code: 'room2' };
                const secondBoardType = { ...boardType, code: 'board2' };

                const secondBoardType2 = { ...boardType, code: 'board5' };

                offerWithSameRoomAsSelected.amendHotelOffer.accom.unit[0].boardType = secondBoardType;
                offerWithSameRoomAsSelected.amendHotelOffer.amendmentChargesInfo!.amendmentCharges = 50;

                offerWithOtherRoomAndExpensiveBoard2.amendHotelOffer.accom.unit[0].boardType = secondBoardType2;
                offerWithOtherRoomAndExpensiveBoard2.amendHotelOffer.amendmentChargesInfo!.amendmentCharges = 30;
                offerWithOtherRoomAndExpensiveBoard2.amendHotelOffer.accom.unit[0].roomType = {
                    ...mockRoomType,
                    code: 'room4',
                };

                offerWithOtherRoomAndCheapBoard.amendHotelOffer.accom.unit[0].roomType = secondRoomType;
                offerWithOtherRoomAndCheapBoard.amendHotelOffer.amendmentChargesInfo!.amendmentCharges = 10;

                offerWithOtherRoomAndExpensiveBoard.amendHotelOffer.accom.unit[0].roomType = secondRoomType;
                offerWithOtherRoomAndExpensiveBoard.amendHotelOffer.accom.unit[0].boardType = secondBoardType;
                offerWithDifferentRoomAndBoard.amendHotelOffer.accom.unit[0].roomType = {
                    ...mockRoomType,
                    code: 'room3',
                };
                offerWithDifferentRoomAndBoard.amendHotelOffer.accom.unit[0].boardType = {
                    ...boardType,
                    code: 'board3',
                };
                offerWithOtherRoomAndCheapBoard.amendHotelOffer.amendmentChargesInfo!.amendmentCharges = 1;
                offerWithOtherRoomAndExpensiveBoard.amendHotelOffer.amendmentChargesInfo!.amendmentCharges = 30;

                const allOffers = [
                    offerWithSameRoomAsSelected,
                    offerWithOtherRoomAndCheapBoard,
                    offerWithDifferentRoomAndBoard,
                    offerWithOtherRoomAndExpensiveBoard,
                    offerWithOtherRoomAndExpensiveBoard2,
                ];
                const expected = [
                    { ...offerWithOtherRoomAndCheapBoard.amendHotelOffer.accom.unit[0], price: 1 },
                    {
                        ...offerWithDifferentRoomAndBoard.amendHotelOffer.accom.unit[0],
                        price: 23.45,
                    },
                    { ...offerWithOtherRoomAndExpensiveBoard2.amendHotelOffer.accom.unit[0], price: 30 },
                ];

                expect(constructAltRoomsFromOffers(allOffers, mockAmendHotelOffer)).toEqual(expected);
            });

            it('should return only compatible and cheapest offer based on board type', () => {
                const offerWithSameBoardAsSelected = deepClone(mockAmendHotelRoomAndBoardOffer);
                const offerWithDifferentRoomAndBoard = deepClone(mockAmendHotelRoomAndBoardOffer);
                const offerWithOtherBoardAndCheapRoom = deepClone(mockAmendHotelRoomAndBoardOffer);
                const offerWithOtherBoardAndExpensiveRoom = deepClone(mockAmendHotelRoomAndBoardOffer);
                const secondRoomType = { ...mockRoomType, code: 'room2' };
                const secondBoardType = { ...boardType, code: 'board2' };

                offerWithSameBoardAsSelected.amendHotelOffer.accom.unit[0].roomType = secondRoomType;
                offerWithOtherBoardAndCheapRoom.amendHotelOffer.accom.unit[0].boardType = secondBoardType;
                offerWithOtherBoardAndExpensiveRoom.amendHotelOffer.accom.unit[0].boardType = secondBoardType;
                offerWithOtherBoardAndExpensiveRoom.amendHotelOffer.accom.unit[0].roomType = secondRoomType;
                offerWithDifferentRoomAndBoard.amendHotelOffer.accom.unit[0].roomType = {
                    ...mockRoomType,
                    code: 'room3',
                };
                offerWithDifferentRoomAndBoard.amendHotelOffer.accom.unit[0].boardType = {
                    ...boardType,
                    code: 'board3',
                };
                offerWithOtherBoardAndCheapRoom.amendHotelOffer.amendmentChargesInfo!.amendmentCharges = 1;
                offerWithOtherBoardAndExpensiveRoom.amendHotelOffer.amendmentChargesInfo!.amendmentCharges = 30;

                const allOffers = [
                    offerWithSameBoardAsSelected,
                    offerWithOtherBoardAndCheapRoom,
                    offerWithDifferentRoomAndBoard,
                    offerWithOtherBoardAndExpensiveRoom,
                ];
                const expected = [
                    { ...offerWithOtherBoardAndCheapRoom.amendHotelOffer.accom.unit[0], price: 1 },
                    {
                        ...offerWithDifferentRoomAndBoard.amendHotelOffer.accom.unit[0],
                        price: 23.45,
                    },
                ];

                expect(constructAltBoardsFromOffers(allOffers, mockAmendHotelOffer)).toEqual(expected);
            });
        });
    });
});
