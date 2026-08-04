import { isIFrame } from './iframe';

describe('iframe utils', () => {
    it('should return false when the variable is not defined', () => {
        const result = isIFrame();

        expect(result).toBe(false);
    });

    it('should return true when the variable is defined', () => {
        Object.defineProperty(window, 'IS_IFRAME', { value: true });
        const result = isIFrame();

        expect(result).toBe(true);
    });
});
