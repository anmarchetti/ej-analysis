import { CurrencyCode } from 'code/currency';

import { getCurrencyFormatOptions } from './summaryDetails.utils';

describe('summaryDetails.utils', () => {
    it('should return currency format options with correct currency', () => {
        const expected = {
            currency: CurrencyCode.EUR,
            maximumFractionDigits: 0,
            roundUp: true,
        };
        expect(getCurrencyFormatOptions(CurrencyCode.EUR)).toMatchObject(expected);
    });
});
