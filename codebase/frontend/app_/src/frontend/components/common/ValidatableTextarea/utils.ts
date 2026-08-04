import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export const getCharactersRemainingLabel = (textAreaCount, getPhrase, getFormattedNumber): string => {
    if (!textAreaCount) {
        return '';
    }

    const charactersRemainingPhrase =
        textAreaCount > 1
            ? getPhrase(SitecoreDictionary.GlobalsFormFieldsTextAreaCharactersRemaining)
            : getPhrase(SitecoreDictionary.GlobalsFormFieldsTextAreaOneCharacterRemaining);

    const formattedTextAreaCount = getFormattedNumber(textAreaCount);

    return Tokenizer.replaceToken(charactersRemainingPhrase, Tokens.CharactersRemaining, formattedTextAreaCount);
};
