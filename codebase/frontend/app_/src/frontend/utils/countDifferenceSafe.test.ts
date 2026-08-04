import countDifferenceSafe from './countDifferenceSafe';

describe('countDifferenceSafe.ts', () => {
    describe('countDifferenceSafe', () => {
        it('should count difference properly', () => {
            const firstNUmber = 512;
            const secondNumber = 128;
            const result = 384;
            const difference = countDifferenceSafe(firstNUmber, secondNumber);

            expect(difference).toBe(result);
        });
    });
});
