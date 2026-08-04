import { getDigits } from './AnimatedCounter.utils';

describe('AnimatedCounter.utils', () => {
    describe('getDigits', () => {
        it('should return correct data', () => {
            expect(getDigits(-1)).toStrictEqual([{ value: 0, id: 0 }]);
            expect(getDigits(5)).toStrictEqual([{ value: 5, id: 0 }]);
            expect(getDigits(50)).toStrictEqual([
                { value: 0, id: 0 },
                { value: 5, id: 1 },
            ]);
            expect(getDigits(501)).toStrictEqual([
                { value: 1, id: 0 },
                { value: 0, id: 1 },
                { value: 5, id: 2 },
            ]);
        });
    });
});
