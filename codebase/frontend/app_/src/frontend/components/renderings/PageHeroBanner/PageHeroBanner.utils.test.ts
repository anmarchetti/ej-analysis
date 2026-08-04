import { isField } from './PageHeroBanner.utils';

describe.each([
    [{ value: 123 }, true, 'object with value'],
    [[{ value: 123 }], false, 'array with value object'],
    [{ foo: 'bar' }, false, 'object without value'],
    [null, false, 'null'],
    ['value', false, 'string'],
    [42, false, 'number'],
])('isField', (input, expected, description) => {
    it(`returns ${expected} for ${description}`, () => {
        expect(isField(input)).toBe(expected);
    });
});
