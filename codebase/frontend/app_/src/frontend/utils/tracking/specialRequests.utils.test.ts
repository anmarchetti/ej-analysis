import { getSpecialRequestsAction } from './specialRequests.utils';

describe('specialRequest.utils', () => {
    describe.each([
        [['1', '2'], ['1'], 'remove'],
        [['1'], ['1', '2'], 'add'],
        [['1', '2'], ['3'], 'edit'],
        [['1', '2'], ['1', '2'], 'identical'],
    ])('getSpecialRequestsAction', (oldArr, newArr, expected) => {
        it(`should return ${expected}`, () => {
            expect(getSpecialRequestsAction(oldArr, newArr)).toBe(expected);
        });
    });
});
