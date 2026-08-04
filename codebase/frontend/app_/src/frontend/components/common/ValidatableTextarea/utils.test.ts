import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { getCharactersRemainingLabel } from './utils';

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

describe('getCharactersRemainingLabel', () => {
    const getPhraseMock = jest.fn(phrase => phrase);
    const getFormattedNumber = jest.fn(number => `${number}`);

    it('should return GlobalsFormFieldsTextAreaCharactersRemaining message when more than 1 character remains', () => {
        const COUNT_OF_REMAINING_CHARACTERS = 2000;
        const result = getCharactersRemainingLabel(COUNT_OF_REMAINING_CHARACTERS, getPhraseMock, getFormattedNumber);

        expect(result).toBe(
            `${SitecoreDictionary.GlobalsFormFieldsTextAreaCharactersRemaining} ${COUNT_OF_REMAINING_CHARACTERS}`,
        );
    });

    it('should return GlobalsFormFieldsTextAreaOneCharacterRemaining message when 1 character remains', () => {
        const COUNT_OF_REMAINING_CHARACTERS = 1;
        const result = getCharactersRemainingLabel(COUNT_OF_REMAINING_CHARACTERS, getPhraseMock, getFormattedNumber);

        expect(result).toBe(
            `${SitecoreDictionary.GlobalsFormFieldsTextAreaOneCharacterRemaining} ${COUNT_OF_REMAINING_CHARACTERS}`,
        );
    });

    it('should return empty string when 0 character remains', () => {
        const COUNT_OF_REMAINING_CHARACTERS = 0;
        const result = getCharactersRemainingLabel(COUNT_OF_REMAINING_CHARACTERS, getPhraseMock, getFormattedNumber);

        expect(result).toBe('');
    });

    it('should return empty string when count of remaining character is undefined', () => {
        const COUNT_OF_REMAINING_CHARACTERS = undefined;
        const result = getCharactersRemainingLabel(COUNT_OF_REMAINING_CHARACTERS, getPhraseMock, getFormattedNumber);

        expect(result).toBe('');
    });
});
