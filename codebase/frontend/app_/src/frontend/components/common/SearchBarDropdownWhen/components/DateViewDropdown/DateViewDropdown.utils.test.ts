import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { getProperErrorMessage } from './DateViewDropdown.utils';

describe('getProperErrorMessage', () => {
    it('should return error message from store', () => {
        const errorMessageFromStore = 'error';

        expect(getProperErrorMessage(false, p => p, errorMessageFromStore, new Date())).toEqual(errorMessageFromStore);
    });

    it('should return error message from store even if isOneMonthsPromoPageErrorShown is true', () => {
        const errorMessageFromStore = 'error';

        expect(getProperErrorMessage(true, p => p, errorMessageFromStore, new Date())).toEqual(errorMessageFromStore);
    });

    it('should return SearchPodErrorsOneMonthPromoPageError', () => {
        expect(getProperErrorMessage(true, p => p, undefined, new Date())).toEqual(
            SitecoreDictionary.SearchPodErrorsOneMonthPromoPageError,
        );
    });

    it('should return undefined when both errors are empty', () => {
        expect(getProperErrorMessage(false, p => p, undefined, new Date())).toEqual(null);
    });
});
