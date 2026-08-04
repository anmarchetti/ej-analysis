import { Tokens } from 'code/tokens';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export const getProperErrorMessage = (
    isOneMonthsPromoPageErrorShown: boolean,
    getPhrase: (key: string) => string,
    errorMessageFromStore: string | undefined,
    minDate: Date,
) => {
    if (errorMessageFromStore) {
        return getPhrase(errorMessageFromStore);
    }

    if (isOneMonthsPromoPageErrorShown) {
        return Tokenizer.replaceToken(
            getPhrase(SitecoreDictionary.SearchPodErrorsOneMonthPromoPageError),
            Tokens.Month,
            formatDateL10n(minDate, 'MMMM'),
        );
    }

    return null;
};
