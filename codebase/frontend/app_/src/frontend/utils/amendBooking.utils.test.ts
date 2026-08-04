import { getAmendmentRoundedPrice, getPricePostfix } from './amendBooking.utils';

describe('amendBooking.utils', () => {
    describe('getPricePostfix', () => {
        it('Should return empty string if price 0', () => {
            expect(getPricePostfix('test', 0)).toBe('');
        });

        it('Should return empty string if price has not been provided', () => {
            expect(getPricePostfix('test')).toBe('');
        });

        it('Should return postfix string if price positive', () => {
            expect(getPricePostfix('test', 123)).toBe(' test');
        });

        it('Should return postfix string if price negative', () => {
            expect(getPricePostfix('test', -123)).toBe(' test');
        });
    });

    describe('getAmendmentRoundedPrice', () => {
        it('Should return rounded price with positive number', () => {
            const result = getAmendmentRoundedPrice(13.01);

            expect(result).toBe(14);
        });

        it('Should return rounded price with negative number', () => {
            const result = getAmendmentRoundedPrice(-13.01);

            expect(result).toBe(-13);
        });

        it('Should return rounded price with positive number for default variant', () => {
            const result = getAmendmentRoundedPrice(13.01, true);

            expect(result).toBe(13);
        });

        it('Should return rounded price with negative number for default variant', () => {
            const result = getAmendmentRoundedPrice(-13.01, true);

            expect(result).toBe(-14);
        });
    });
});
