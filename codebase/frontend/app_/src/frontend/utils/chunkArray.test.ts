import { splitArrayIntoNChunks } from './chunkArray';

describe('chunkArray', () => {
    const array = [1, 2, 3, 4, 5, 6, 7];

    describe.each([
        [[], 5, []],
        [array, 0, [1, 2, 3, 4, 5, 6, 7]],
        [array, 1, [[1, 2, 3, 4, 5, 6, 7]]],
        [array, 3, [[1, 2, 3], [4, 5, 6], [7]]],
        [array, 7, [[1], [2], [3], [4], [5], [6], [7]]],
        [array, 8, [[1], [2], [3], [4], [5], [6], [7]]],
    ])('splitArrayIntoNChunks', (array, numberOfChunks, expected) => {
        it(`should return ${JSON.stringify(expected)}`, () => {
            const res = splitArrayIntoNChunks(array, numberOfChunks);
            expect(res).toEqual(expected);
        });
    });
});
