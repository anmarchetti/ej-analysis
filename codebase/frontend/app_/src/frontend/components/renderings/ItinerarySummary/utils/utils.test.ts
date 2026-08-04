import { formatLinksInText, formatPhoneNumbersAsLinks } from './utils';

describe('formatPhoneNumbersAsLinks', () => {
    it('should return original text when no phone numbers are present', () => {
        const text = 'Please call our local partner for assistance.';

        const result = formatPhoneNumbersAsLinks(text);
        expect(result).toEqual(text);
    });

    it('should format phone numbers as clickable links', () => {
        const text = 'For help, call +38 591 244 6126 or 07999 342 931 or 44 (999) 4343 432.';
        const expected =
            'For help, call <a href="tel:+385912446126">+38 591 244 6126</a> or <a href="tel:07999342931">07999 342 931</a> or <a href="tel:44(999)4343432">44 (999) 4343 432</a>.';

        const result = formatPhoneNumbersAsLinks(text);
        expect(result).toEqual(expected);
    });
});

describe('formatLinksInText', () => {
    it('should return original text when no URLs are present', () => {
        const text = 'Please visit our website for more information.';
        const result = formatLinksInText(text);
        expect(result).toEqual(text);
    });

    it('should format URLs as clickable links', () => {
        const text = 'Check out our website at https://www.example.com or http://test.com/ or https://test.com/en/.';
        const expected =
            'Check out our website at <a href="https://www.example.com" target="_blank" rel="noopener noreferrer">https://www.example.com</a> or <a href="http://test.com/" target="_blank" rel="noopener noreferrer">http://test.com/</a> or <a href="https://test.com/en/" target="_blank" rel="noopener noreferrer">https://test.com/en/</a>.';

        const result = formatLinksInText(text);
        expect(result).toEqual(expected);
    });
});
