import { getLocalizedFormatValue, isLocalizedFormat } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IValidationError } from 'models/data/validation/IValidationError';

export const getErrorText = (error: IValidationError, getPhrase: (string) => string): string => {
    if (!error) return '';

    if (!!error.rawErrorMessage) {
        return error.rawErrorMessage;
    }

    if (!!error.replacedToken && !!error.replacedValue) {
        const localizedReplacedValue = isLocalizedFormat(error.replacedValue)
            ? getLocalizedFormatValue(error.replacedValue)
            : error.replacedValue;

        return Tokenizer.replaceToken(getPhrase(error.errorMessage), error.replacedToken, localizedReplacedValue);
    }

    return getPhrase(error.errorMessage);
};
