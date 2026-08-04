import {
    addressStringToTitleCase,
    convertBooleanToString,
    convertHtmlToTextWithReplacingBRsWithSpaces,
    convertToYesNoString,
    decodeHtmlEntities,
    getAlphanum,
    getJsonString,
    getTextFromHtml,
    isGUIDWithoutDashes,
    isMatchingCaseInsensitive,
    isWordInSentence,
    joinNonEmptyWordsWithComma,
    nonEmptyString,
    normalizeString,
    removeFirstAndLastChar,
    removeNullAndUndefinedFromString,
    removeSpacesFromString,
    roomTitleNormalize,
    stringToTitleCase,
    toKebabCase,
} from './string.utils';

describe('string.utils', () => {
    describe('removeFirstAndLastChar', () => {
        it('should return correct value', () => {
            const input = 'qwerty';
            expect(removeFirstAndLastChar(input)).toEqual('wert');
        });
    });

    describe('stringToTitleCase', () => {
        it('should return correct value', () => {
            const input = 'APARTMENT ONE BEDROOM';
            expect(stringToTitleCase(input)).toEqual('Apartment One Bedroom');
        });
    });

    describe('addressStringToTitleCase', () => {
        describe.each([
            ['ALL CAPS words', 'AM HEUMARKT', 'Am Heumarkt'],
            ['ALL CAPS with comma-adjacent number', 'KAERNTNER STRASSE,32-34', 'Kaerntner Strasse, 32-34'],
            [
                'ALL CAPS with number suffix after comma',
                'GEORGIOU A' + "'" + ' AVENUE,74',
                'Georgiou A' + "'" + ' Avenue, 74',
            ],
            ['already mixed-case — leave unchanged', "L'\u00cele Rousse", "L'\u00cele Rousse"],
            ['already mixed-case with apostrophe — leave unchanged', "Av. de l'Uruguay", "Av. de l'Uruguay"],
            ['mixed-case with apostrophe — leave unchanged', "Ne'Ama Bay", "Ne'Ama Bay"],
            ['word starting with digit — leave unchanged', "96A,Ra's Nasrani", "96A, Ra's Nasrani"],
            ["possessive apostrophe — don't capitalise 's'", "COOK'S CLUB", "Cook's Club"],
            [
                'ALL CAPS with slash-suffix after digit',
                'VIA DELL' + "'" + ' AMORINO 20/r',
                'Via Dell' + "'" + ' Amorino 20/r',
            ],
            ['already correct mixed case — leave unchanged', "Ra's Nasrani, Sharks Bay", "Ra's Nasrani, Sharks Bay"],
            ['trailing ,- removed', 'Felberstrabe 4,-', 'Felberstrabe 4'],
            ['trailing ,- with spaces removed', 'MORRISON LINK ,- ', 'Morrison Link'],
            ['trailing , - (with space) removed', 'Felberstrabe 4, -', 'Felberstrabe 4'],
            ['empty string', '', ''],
        ])('when input is %s', (_desc, input, expected) => {
            it(`should return "${expected}"`, () => {
                expect(addressStringToTitleCase(input)).toEqual(expected);
            });
        });
    });

    describe.each([
        [true, 'true'],
        [false, 'false'],
    ])('convertBooleanToString', (query, expected) => {
        it(`should convert to ${JSON.stringify(expected)}`, () => {
            const res = convertBooleanToString(query);
            expect(res).toEqual(expected);
        });
    });

    describe.each([
        [true, 'Yes'],
        [false, 'No'],
    ])('convertToYesNoString', (query, expected) => {
        it(`should convert to ${JSON.stringify(expected)}`, () => {
            const res = convertToYesNoString(query);
            expect(res).toEqual(expected);
        });
    });

    describe.each([
        [
            `
            <style>
                .test {font-size: 21px;}
            </style>
            <div class="test"><strong>Hello</strong><br/> my world </div>`,
            'Hello my world',
        ],
        ['Hello my world', 'Hello my world'],
    ])('getTextFromHtml', (query, expected) => {
        it(`should convert to ${expected}`, () => {
            const res = getTextFromHtml(query);
            expect(res).toEqual(expected);
        });
    });

    describe('convertHtmlToTextWithReplacingBRsWithSpaces', () => {
        it('should replace BRs with space and remove the rest of the HTML elements when present', () => {
            const text = `
            <style>
                .test {font-size: 21px;}
            </style>
            <div class="test"><strong>Hello</strong><br/>my world </div>`;

            const res = convertHtmlToTextWithReplacingBRsWithSpaces(text);
            expect(res).toEqual('Hello my world');
        });

        it('should clean double spaces when present after the HTML to text conversion', () => {
            const text = `
            <style>
                .test {font-size: 21px;}
            </style>
            <div class="test"><strong>Hello</strong><br/> my world </div>`;
            const res = convertHtmlToTextWithReplacingBRsWithSpaces(text);
            expect(res).toEqual('Hello my world');
        });

        it('should leave the text intact when there are not HTML elements present', () => {
            const res = convertHtmlToTextWithReplacingBRsWithSpaces('Hello my world');
            expect(res).toEqual('Hello my world');
        });
    });

    describe('decodeHtmlEntities', () => {
        it('should decode &amp; to &', () => {
            expect(decodeHtmlEntities('No taxes &amp; charges due')).toBe('No taxes & charges due');
        });

        it('should decode &lt; and &gt;', () => {
            expect(decodeHtmlEntities('1 &lt; 2 &gt; 0')).toBe('1 < 2 > 0');
        });

        it('should decode &quot;', () => {
            expect(decodeHtmlEntities('say &quot;hello&quot;')).toBe('say "hello"');
        });

        it('should decode &#39;', () => {
            expect(decodeHtmlEntities('it&#39;s fine')).toBe("it's fine");
        });

        it('should decode multiple entities in one string', () => {
            expect(decodeHtmlEntities('&lt;b&gt;Hello &amp; World&lt;/b&gt;')).toBe('<b>Hello & World</b>');
        });

        it('should return the same string when no entities are present', () => {
            expect(decodeHtmlEntities('plain text')).toBe('plain text');
        });

        it('should return an empty string for empty input', () => {
            expect(decodeHtmlEntities('')).toBe('');
        });
    });

    describe('isGUIDWithoutDashes', () => {
        it('passed string is valid GUID', () => {
            const val = '1620091e95c311eda1eb0242ac120002';
            expect(isGUIDWithoutDashes(val)).toBeTruthy();
        });

        it('passed string is invalid GUID', () => {
            const val = '1620091e-95c3-11ed-a1eb-0242ac120002';
            expect(isGUIDWithoutDashes(val)).toBeFalsy();
        });
    });

    describe('getJsonString', () => {
        it('Should return JSON string when passed value is valid JSON', () => {
            const val = '{ "val":"test" }';

            expect(getJsonString(val)).toEqual('{"val":"test"}');
        });

        it('Should return undefined when passed value is not valid JSON', () => {
            const val = '{ val: 1 }';

            expect(getJsonString(val)).toBeUndefined();
        });
    });

    describe('roomTitleNormalize', () => {
        it('should return correct value', () => {
            const input = 'Apartment BE ONE or BEDROOM Twin';

            expect(roomTitleNormalize(input)).toEqual('Apartment BE One or Bedroom Twin');
        });

        it('should return empty string when empty string provided', () => {
            const input = '';

            expect(roomTitleNormalize(input)).toEqual('');
        });
    });

    describe('getAlphanum', () => {
        it('should return string with spaces and foreign characters removed', () => {
            const input = 'Natura Algârve Club 9';

            expect(getAlphanum(input)).toEqual('NaturaAlgrveClub9');
        });

        it('should return empty string when undefined provided', () => {
            const input = undefined;

            expect(getAlphanum(input)).toEqual('');
        });
    });

    describe('toKebabCase', () => {
        it('should return kebabcase string', () => {
            expect(toKebabCase('Test 234E  ')).toEqual('test-234e--');
        });
    });

    describe('isMatchingCaseInsensitive', () => {
        it('should return true when strings match', () => {
            expect(isMatchingCaseInsensitive('Test', 'tEsT')).toEqual(true);
        });

        it('should return false when strings do NOT match', () => {
            expect(isMatchingCaseInsensitive('Test', 'TeeSt')).toEqual(false);
        });
    });

    describe('normalizeString', () => {
        it('should return normalized string', () => {
            const input = 'München';

            expect(normalizeString(input)).toEqual('Munchen');
        });
    });

    describe.each([
        [['test', '', 'test 2', 'test 3'], 'test, test 2, test 3'],
        [['test', undefined, null, 'test 2'], 'test, test 2'],
    ])('joinNonEmptyWordsWithComma', (text, expected) => {
        it(`should return text ${expected}`, () => {
            expect(joinNonEmptyWordsWithComma(text as string[])).toBe(expected);
        });
    });

    describe.each([
        ['Hello world Hello', 'world', true],
        ['Hello world Hello world', 'hello', true],
        ['test', 'hello', false],
        ['test ', 'test', true],
    ])('isWordInSentence', (sentence, word, expected) => {
        it(`should return ${expected}`, () => {
            expect(isWordInSentence(sentence as string, word as string)).toBe(expected);
        });
    });

    describe.each([
        ['Hello world', true],
        ['', false],
    ])('nonEmptyString', (item, expected) => {
        it(`should return ${expected}`, () => {
            expect(nonEmptyString(item)).toBe(expected);
        });
    });

    describe('removeNullAndUndefinedFromString', () => {
        it('should remove "null" from the string', () => {
            expect(removeNullAndUndefinedFromString('Hello null World')).toBe('Hello  World');
        });

        it('should remove "undefined" from the string', () => {
            expect(removeNullAndUndefinedFromString('Hello undefined World')).toBe('Hello  World');
        });

        it('should remove both "null" and "undefined" from the string', () => {
            expect(removeNullAndUndefinedFromString('null Hello undefined World null')).toBe('Hello  World');
        });

        it('should remove only exact "null" and "undefined" without affecting other words', () => {
            expect(removeNullAndUndefinedFromString('This is notnull or undefinedness')).toBe('This is not or ness');
        });

        it('should trim the result after removing "null" and "undefined"', () => {
            expect(removeNullAndUndefinedFromString('   null Hello World undefined   ')).toBe('Hello World');
        });

        it('should return the original string if there is no "null" or "undefined"', () => {
            expect(removeNullAndUndefinedFromString('Just a normal sentence')).toBe('Just a normal sentence');
        });

        it('should handle an empty string', () => {
            expect(removeNullAndUndefinedFromString('')).toBe('');
        });
    });

    describe.each([
        ['Hello World', 'HelloWorld'],
        ['   Leading and trailing   ', 'Leadingandtrailing'],
        ['Multiple   spaces   inside', 'Multiplespacesinside'],
        ['', ''],
        ['NoSpaces', 'NoSpaces'],
        [' ', ''],
        ['   ', ''],
    ])('removeSpacesFromString', (input, expected) => {
        it(`should change "${input}" to "${expected}"`, () => {
            expect(removeSpacesFromString(input)).toBe(expected);
        });
    });
});
