import sanitize from 'sanitize-html';

export enum DecisionValues {
    Yes = 'Yes',
    No = 'No',
}

/**
 * string check contains substring.
 * @param event fire event
 * @param func function to execute
 */
export function containsSubstring(str: Nullable<string>, subStr: Nullable<string>): boolean {
    // eslint-disable-next-line no-magic-numbers
    return str && subStr ? str.toLowerCase().indexOf(subStr) > -1 : false;
}

/**
 * Removes first and last
 * @param str string for input
 */
export function removeFirstAndLastChar(str: string): string {
    return str.substring(1, str.length - 1);
}

/**
 * Convert boolean to string 'true'/'false'
 * @param value boolean
 */
export function convertBooleanToString(value: boolean): string {
    return value ? 'true' : 'false';
}

/**
 * Convert string 'APARTMENT ONE BEDROOM' to string 'Apartment One Bedroom'
 * @param str string
 */
export const stringToTitleCase = (str: string): string =>
    str
        .split(' ')
        .map(w => (!!w && w.length ? w[0].toUpperCase() + w.substring(1).toLowerCase() : ''))
        .join(' ');

/**
 * Converts address string to title case, preserving already properly-cased words
 * and words starting with digits (e.g. street numbers like '12A').
 * Only transforms words consisting entirely of uppercase letters.
 * (e.g. "AM HEUMARKT,35-37" -> "Am Heumarkt,35-37", "L'Île Rousse" -> "L'Île Rousse")
 */
export const addressStringToTitleCase = (str: string): string => {
    const normalized = str.replace(/,(?!\s)/g, ', ');
    const cleaned = normalized.replace(/,\s*-\s*$/, '').trim();

    return cleaned
        .split(' ')
        .map(word => {
            if (!word) return '';

            const letters = word.replace(/[^a-zA-ZÀ-ÿ]/g, '');
            const isAllCaps = letters.length > 0 && letters === letters.toUpperCase();
            const startsWithLetter = /^[a-zA-ZÀ-ÿ]/.test(word);

            return isAllCaps && startsWithLetter ? stringToTitleCase(word) : word;
        })
        .join(' ');
};

/**
 * Convert boolean to string 'Yes'/'No'
 * @param value boolean
 */
export const convertToYesNoString = (value: boolean): DecisionValues =>
    value ? DecisionValues.Yes : DecisionValues.No;

/**
 * Truncate the string and putting an ellipsis on the end
 */
export const truncateString = (str: string, length: number): string =>
    str.length > length ? `${str.substr(0, length - 1)}...` : str;

/**
 * Normalize GUID - convert to lower case and remove curly braces.
 * (e.g. "{6F9619FF-8B86-D011-B42D-00CF4FC964FF}" -> "6f9619ff-8b86-d011-b42d-00cf4fc964ff")
 */
export function normalizeGUID(guid: string): string {
    return guid ? guid.toLowerCase().replace(/^{+|}+$/g, '') : '';
}

/**
 * Leaves only text between tags
 */
export function getTextFromHtml(str: string = ''): string {
    return sanitize(str, { allowedTags: [] }).replace(/\s+/g, ' ').trim();
}

/**
 * Decodes HTML entities in a plain string (e.g. &amp; -> &).
 * Use when Sitecore dictionary values are rendered as plain text (not via dangerouslySetInnerHTML).
 */
export const decodeHtmlEntities = (str: string): string =>
    str
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'");

/**
 * Replaces any <br/> tag (case insensitive) with a space, and then
 * levereages getTextFromHtml function to remove any other existing HTML tag
 */
export const convertHtmlToTextWithReplacingBRsWithSpaces = (str: string): string => {
    const htmlWithSpacesInsteadOfBrs = str.replace(/<br\s*\/?>/gi, ' ');

    return getTextFromHtml(htmlWithSpacesInsteadOfBrs);
};

/**
 * string check is valid GUID without dashes
 */
export const isGUIDWithoutDashes = (val: string): boolean => {
    const pattern = /^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/i;

    return pattern.test(val);
};

/**
 * Converts JSON to string
 * @param val string or undefined
 */
export const getJsonString = (val: string | undefined): string | undefined => {
    if (val) {
        try {
            return JSON.stringify(JSON.parse(val));
        } catch {}
    }

    return undefined;
};

/**
 * Normalize string with uppercase characters - converts to a string with the first letters in each word in upper case
 * if the length of the original string exceeds 2 characters (there may be an acronym)
 * @param str string
 */
export const roomTitleNormalize = (str: string): string =>
    str
        .split(' ')
        .map(word =>
            // eslint-disable-next-line no-magic-numbers
            word.charAt(1) === word.charAt(1).toLowerCase() || word.length < 3
                ? word
                : `${word.charAt(0)}${word.substring(1).toLowerCase()}`,
        )
        .join(' ');

/**
 * Removes spaces and characters from string
 * @param str string | undefined | null
 */
export const getAlphanum = (str: string | undefined | null): string => str?.replace(/[^A-Za-z0-9]/g, '') || '';

/**
 * From "Test Name" to "test-name"
 * @param str
 * @returns
 */
export const toKebabCase = (str: string): string => str.toLowerCase().split(' ').join('-');

/**
 * Compares 2 strings without case sensitivity
 * @param str1 string
 * @param str2 string
 */
export const isMatchingCaseInsensitive = (str1: string, str2: string): boolean =>
    str1.localeCompare(str2, undefined, { sensitivity: 'accent' }) === 0;

/**
 * Normilize string with non-latin character ex. München -> Munchen
 * @param str string
 */
export const normalizeString = (str: string): string => {
    const combining = /[\u0300-\u036F]/g;

    // NFKD - https://unicode.org/reports/tr15/
    return str.normalize('NFKD').replace(combining, '');
};

/**
 * Generate unique hashcode from a string
 * https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
 * @param str any `string`
 * @returns hash `number`
 */
export const getHashCode = (str: string): number => {
    let hash = 0,
        i: number,
        chr: number;

    if (str.length === 0) return hash;

    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }

    return hash;
};

/**
 * Build text string from words separated with commas
 * @param words string[]
 */
export const joinNonEmptyWordsWithComma = (words: string[]): string => words.filter(Boolean).join(', ');

/**
 * Returns true when the word in the sentence. It's not case sensitive
 * @param sentence string
 * @param word string
 */
export const isWordInSentence = (sentence: string, word: string): boolean =>
    !!sentence && sentence.toLowerCase().includes(word.toLowerCase());

export const nonEmptyString = <T>(item: T): boolean => item !== '';

export const removeNullAndUndefinedFromString = (str: string): string =>
    str
        .replace(/null/g, '')
        .replace(/undefined/g, '')
        .trim();

export const removeSpacesFromString = (str: string): string => str.replaceAll(/\s+/g, '');
