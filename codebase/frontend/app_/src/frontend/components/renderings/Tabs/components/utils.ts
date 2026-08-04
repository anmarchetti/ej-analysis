import { Tokens } from 'code/tokens';
import MarketStore from 'frontend/store/base/market/MarketStore';
import { LayoutStore } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export const getAnchorLabel = (
    getPhrase: LayoutStore['getPhrase'],
    getFormattedNumber: MarketStore['getFormattedNumber'],
    isTokenizable: boolean,
    reviews: Nullable<number>,
    label: string,
): string => {
    if (!isTokenizable) {
        return label;
    }

    const formattedCount = getFormattedNumber(reviews || 0);

    const labelForTokinizer =
        reviews !== 1
            ? SitecoreDictionary.HotelReviewsLabelsReviewItemPlural
            : SitecoreDictionary.HotelReviewsLabelsReviewItemSingular;

    const tokenValues = {
        [Tokens.Review]: formattedCount,
        [Tokens.ReviewsLabel]: getPhrase(labelForTokinizer),
    };

    return Tokenizer.replaceTokens(label, tokenValues);
};
