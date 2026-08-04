import { createDropdownState } from './expandableTabs';

const mockDropdowns = [
    {
        key: 'key1',
    },
    {
        key: 'key2',
    },
];

describe('createDropdownState', () => {
    it('should return the correct initial state', () => {
        expect(createDropdownState(mockDropdowns, [])).toEqual({
            key1: true,
            key2: true,
        });
    });

    it('should return the correct initial state when collapsedByDefaultKeys is provided', () => {
        expect(createDropdownState(mockDropdowns, ['key1'])).toEqual({
            key1: false,
            key2: true,
        });
    });

    it('should return empty object if dropdowns is undefined', () => {
        expect(createDropdownState(undefined, [])).toEqual({});
    });
});
