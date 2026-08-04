import assert from 'assert';

import { formatNumber } from './formatNumber';

describe('handleEnterAndSpacePress', () => {
    test('should round floats to 2 places', () => {
        const cases = [
            { number: 10, divider: 1000, e: 0.01, places: 2 },
            { number: 1.7777, divider: 1, e: 1.78, places: 2 },
            { number: 1.005, divider: 1, e: 1.01, places: 2 },
            { number: 1.005, divider: 1, e: 1, places: 0 },
            { number: 1.77777, divider: 1, e: 1.8, places: 1 },
        ];

        cases.forEach(testCase => {
            const result = formatNumber(testCase.number, testCase.divider, testCase.places);
            assert.equal(result, testCase.e, "didn't get right number");
        });
    });
});
