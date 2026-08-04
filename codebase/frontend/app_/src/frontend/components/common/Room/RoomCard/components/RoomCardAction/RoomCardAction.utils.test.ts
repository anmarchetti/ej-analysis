import { getFormattedPriceLabel } from './RoomCardAction.utils';

describe('RoomCardAction.utils', () => {
    describe('getFormattedPriceLabel', () => {
        it('Should return label with plus', () => {
            const result = getFormattedPriceLabel('formattedPriceLabel', 30);

            expect(result).toBe('+ formattedPriceLabel');
        });

        it('Should return label with minus', () => {
            const result = getFormattedPriceLabel('formattedPriceLabel', -30);

            expect(result).toBe('- formattedPriceLabel');
        });

        it('Should return label with 0', () => {
            const result = getFormattedPriceLabel('formattedPriceLabel', 0);

            expect(result).toBe('formattedPriceLabel');
        });
    });
});
