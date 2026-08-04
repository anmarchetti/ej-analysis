import { mockRoomAndBoardRoomVariant, mockUnitRoom } from 'frontend/__mocks__';

import { areRoomVariantsEqual, filterNewRoomVariants, findChosenRoomVariant } from './AmendRoomAndBoardStore.utils';

describe('AmendRoomAndBoardStore.utils', () => {
    describe('areRoomVariantsEqual', () => {
        it('Should return true', () => {
            const result = areRoomVariantsEqual(mockUnitRoom, mockRoomAndBoardRoomVariant);

            expect(result).toBe(true);
        });

        it('Should return false', () => {
            const result = areRoomVariantsEqual(mockRoomAndBoardRoomVariant, { ...mockUnitRoom, code: 'test' });

            expect(result).toBe(false);
        });
    });

    describe('filterNewRoomVariants', () => {
        it('Should return filtered variants', () => {
            const result = filterNewRoomVariants(
                [
                    mockRoomAndBoardRoomVariant,
                    {
                        ...mockRoomAndBoardRoomVariant,
                        units: [{ ...mockRoomAndBoardRoomVariant.units[0], code: 'Test' }],
                    },
                ],
                mockRoomAndBoardRoomVariant,
            );

            expect(result[0].units[0].code).toBe('Test');
        });
    });

    describe('findChosenRoomVariant', () => {
        it('Should return chosen variant', () => {
            const result = findChosenRoomVariant(
                [
                    mockRoomAndBoardRoomVariant,
                    {
                        ...mockRoomAndBoardRoomVariant,
                        units: [{ ...mockRoomAndBoardRoomVariant.units[0], code: 'Test' }],
                    },
                ],
                mockRoomAndBoardRoomVariant,
            );

            expect(result).toEqual(mockRoomAndBoardRoomVariant);
        });

        it('Should return undefined if no chosen variant', () => {
            const result = findChosenRoomVariant([mockRoomAndBoardRoomVariant, mockRoomAndBoardRoomVariant], {
                ...mockRoomAndBoardRoomVariant,
                units: [{ ...mockRoomAndBoardRoomVariant.units[0], code: 'Test' }],
            });

            expect(result).toBeUndefined();
        });
    });
});
