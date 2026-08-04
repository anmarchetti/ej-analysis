import { roundRating } from './TripadvisorRating.helpers';

describe('roundRating', () => {
    it('should round down when decimal is less than ROUND_DOWN_STAR', () => {
        expect(roundRating(4.2)).toBe(4);
        expect(roundRating(3.1)).toBe(3);
    });

    it('should round to half star when decimal is between ROUND_DOWN_STAR and ROUND_UP_STAR', () => {
        expect(roundRating(4.5)).toBe(4.5);
        expect(roundRating(3.4)).toBe(3.5);
        expect(roundRating(3.7)).toBe(3.5);
    });

    it('should round up when decimal is greater than or equal to ROUND_UP_STAR', () => {
        expect(roundRating(4.8)).toBe(5);
        expect(roundRating(3.9)).toBe(4);
    });

    it('should handle whole numbers correctly', () => {
        expect(roundRating(4.0)).toBe(4);
        expect(roundRating(5.0)).toBe(5);
    });

    it('should handle edge cases around rounding thresholds', () => {
        expect(roundRating(4.3)).toBe(4.5); // Just at ROUND_DOWN_STAR
        expect(roundRating(4.8)).toBe(5); // Just at ROUND_UP_STAR
    });
});
