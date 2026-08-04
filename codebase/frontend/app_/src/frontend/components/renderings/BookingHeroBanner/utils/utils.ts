import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';

export const getHeroBannerTitle = (title: string, country?: string, region?: string): string => {
    if (country && region) {
        return Tokenizer.replaceTokens(title, {
            [Tokens.Country]: country,
            [Tokens.Region]: region,
        });
    }

    if (country && !region) {
        return country;
    }

    if (!country && region) {
        return region;
    }

    return '';
};
