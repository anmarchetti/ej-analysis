import { getSplitText } from './TextWithTooltip.utils';

describe('TextWithTooltip.utils', () => {
    describe('getSplitText', () => {
        it('should return array of strings when argument is correct', () => {
            expect(getSplitText('str1 str2 str3')).toStrictEqual(['str1 str2 ', 'str3']);
        });

        it('should return array of empty string when argument is incorrect', () => {
            expect(getSplitText('')).toStrictEqual(['', '']);
        });
    });
});
