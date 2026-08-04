import { Tokens } from 'code/tokens';
import { mockReplaceTokens } from 'frontend/__mocks__/utils/tokenizer';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { getAnchorLabel } from './utils';

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceTokens: mockReplaceTokens,
    },
}));

describe('getAnchorLabel', () => {
    const getPhrase = jest.fn(p => p);
    const getFormattedNumber = jest.fn(number => `${number}`);
    const ONE_REVIEW = 1;
    const FEW_REVIEW = 3;

    it('should return label when label is not tokenizable', () => {
        const label = 'test';

        expect(getAnchorLabel(getPhrase, getFormattedNumber, false, ONE_REVIEW, label)).toBe(label);
    });

    it('should change token in plural label when there are few reviews', () => {
        const label = `${Tokens.Review}`;
        const result = getAnchorLabel(getPhrase, getFormattedNumber, true, FEW_REVIEW, label);

        expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(label, {
            [Tokens.Review]: `${FEW_REVIEW}`,
            [Tokens.ReviewsLabel]: SitecoreDictionary.HotelReviewsLabelsReviewItemPlural,
        });
        expect(result).toBe(`${label} ${FEW_REVIEW},${SitecoreDictionary.HotelReviewsLabelsReviewItemPlural}`);
    });

    it('should change token in single label when there are one review', () => {
        const label = `${Tokens.Review}`;
        const result = getAnchorLabel(getPhrase, getFormattedNumber, true, ONE_REVIEW, label);

        expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(label, {
            [Tokens.Review]: `${ONE_REVIEW}`,
            [Tokens.ReviewsLabel]: SitecoreDictionary.HotelReviewsLabelsReviewItemSingular,
        });
        expect(result).toBe(`${label} ${ONE_REVIEW},${SitecoreDictionary.HotelReviewsLabelsReviewItemSingular}`);
    });

    it('should use zero when count of rewires is undefined', () => {
        const label = `${Tokens.Review}`;
        const result = getAnchorLabel(getPhrase, getFormattedNumber, true, undefined, label);

        expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(label, {
            [Tokens.Review]: `0`,
            [Tokens.ReviewsLabel]: SitecoreDictionary.HotelReviewsLabelsReviewItemPlural,
        });
        expect(result).toBe(`${label} 0,${SitecoreDictionary.HotelReviewsLabelsReviewItemPlural}`);
    });
});
