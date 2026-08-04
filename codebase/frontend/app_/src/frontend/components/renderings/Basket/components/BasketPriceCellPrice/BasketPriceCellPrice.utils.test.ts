import { addLeadingZero } from './BasketPriceCellPrice.utils';

describe('BasketPriceCellPrice.utils', () => {
    describe.each([
        [0, '00'],
        [1, '01'],
        [12, '12'],
        [123, '123'],
    ])('addLeadingZero', (value, expected) => {
        it(`should return ${expected} when is called with ${value} argument`, () => {
            expect(addLeadingZero(value)).toEqual(expected);
        });
    });
});
