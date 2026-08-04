import { buildAlphabeticAnchors } from './alphabetIndex.utils';

let items = [] as any;
const getAnchorId = jest.fn(() => 'id');

describe('alphabetIndex.utils', () => {
    describe('buildAlphabeticAnchors', () => {
        test('should return correct letters', () => {
            items = [{ test: 'test' }, { test: 'date' }];
            const formattedDate = buildAlphabeticAnchors(items, 'test', getAnchorId);
            expect(formattedDate).toStrictEqual([
                { id: 'id', items: [{ test: 'test' }], letter: 'T' },
                { id: 'id', items: [{ test: 'date' }], letter: 'D' },
            ]);
        });

        test('should return empty list when items NOT provided', () => {
            items = [];
            const formattedDate = buildAlphabeticAnchors(items, 'test', getAnchorId);
            expect(formattedDate).toStrictEqual([]);
        });

        test('should return empty list when item is NOT string', () => {
            items = [{ test: 1 }, { test: false }];
            const formattedDate = buildAlphabeticAnchors(items, 'test', getAnchorId);
            expect(formattedDate).toStrictEqual([]);
        });

        test('should return only items that are string', () => {
            items = [{ test: 'test' }, { test: false }];
            const formattedDate = buildAlphabeticAnchors(items, 'test', getAnchorId);
            expect(formattedDate).toStrictEqual([{ id: 'id', items: [{ test: 'test' }], letter: 'T' }]);
        });
    });
});
