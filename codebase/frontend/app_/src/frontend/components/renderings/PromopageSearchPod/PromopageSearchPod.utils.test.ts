import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';

import { getWhenError } from './PromopageSearchPod.utils';

describe('getWhenError', () => {
    it('should return correct value', () => {
        const errorMessage = {
            key: SearchBarDropdown.When,
            message: 'error',
        };

        expect(getWhenError(errorMessage, SearchBarDropdown.When)).toEqual(errorMessage.message);
    });

    it('should return undefined when key is other than SearchBarDropdown.When', () => {
        const errorMessage = {
            key: SearchBarDropdown.Who,
            message: 'error',
        };

        expect(getWhenError(errorMessage, SearchBarDropdown.When)).toEqual(undefined);
    });

    it('should return undefined when activeField is other than SearchBarDropdown.When', () => {
        const errorMessage = {
            key: SearchBarDropdown.When,
            message: 'error',
        };

        expect(getWhenError(errorMessage, SearchBarDropdown.Who)).toEqual(undefined);
    });
});
