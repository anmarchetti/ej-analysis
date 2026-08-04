import { Tokens } from 'code/tokens';
import { mockReplaceTokens } from 'frontend/__mocks__/utils/tokenizer';

import { getHeroBannerTitle } from './utils';

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceTokens: mockReplaceTokens,
    },
}));

describe('BookingHeroBanner utils', () => {
    describe('getHeroBannerTitle', () => {
        it('returns tokenized title when country and region are provided', () => {
            const title = getHeroBannerTitle('Title', 'country', 'region');

            expect(mockReplaceTokens).toHaveBeenCalledWith('Title', {
                [Tokens.Country]: 'country',
                [Tokens.Region]: 'region',
            });

            expect(title).toBe('Title country,region');
        });

        it('returns country only when region is undefined', () => {
            const title = getHeroBannerTitle('Title', 'country', undefined);

            expect(title).toBe('country');
        });

        it('returns country only when region is empty string', () => {
            const title = getHeroBannerTitle('Title', 'country', '');

            expect(title).toBe('country');
        });

        it('returns region only when country is undefined', () => {
            const title = getHeroBannerTitle('Title', undefined, 'region');

            expect(title).toBe('region');
        });

        it('returns region only when country is empty string', () => {
            const title = getHeroBannerTitle('Title', '', 'region');

            expect(title).toBe('region');
        });

        it('returns empty string when region and country are undefined', () => {
            const title = getHeroBannerTitle('Title');

            expect(title).toBe('');
        });
    });
});
