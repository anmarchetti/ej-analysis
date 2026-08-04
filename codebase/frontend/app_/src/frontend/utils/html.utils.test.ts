import { isEmptyHtmlContent } from './html.utils';

describe('isEmptyHtmlContent', () => {
    it('should return true for an empty value', () => {
        const emptyValue = '';

        expect(isEmptyHtmlContent(emptyValue)).toBe(true);
    });

    it('should return true for a value with only HTML tags', () => {
        const htmlTagsValue = '<div></div><span></span>';

        expect(isEmptyHtmlContent(htmlTagsValue)).toBe(true);
    });

    it('should return true for a value with only whitespace', () => {
        const whitespaceValue = '    ';

        expect(isEmptyHtmlContent(whitespaceValue)).toBe(true);
    });

    it('should return true for a value with HTML tags and whitespace', () => {
        const mixedValue = '<div></div>   ';

        expect(isEmptyHtmlContent(mixedValue)).toBe(true);
    });

    it('should return false for a non-empty value', () => {
        const nonEmptyValue = 'This is some text.';

        expect(isEmptyHtmlContent(nonEmptyValue)).toBe(false);
    });

    it('should return false for a value with both text and HTML tags', () => {
        const mixedValue = 'This is some text <span>with</span> HTML tags.';

        expect(isEmptyHtmlContent(mixedValue)).toBe(false);
    });
});
