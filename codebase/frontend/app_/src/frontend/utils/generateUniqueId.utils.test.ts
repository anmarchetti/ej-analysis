import { generateUniqueId } from './generateUniqueId.utils';

describe('generateUniqueId', () => {
    it('should return a string of length 6', () => {
        const id = generateUniqueId();

        expect(typeof id).toBe('string');
        expect(id).toHaveLength(6);
    });

    it('should return only alphanumeric lowercase characters', () => {
        expect(generateUniqueId()).toMatch(/^[a-z0-9]{6}$/);
    });

    it('should generate different values on subsequent calls', () => {
        const id1 = generateUniqueId();
        const id2 = generateUniqueId();

        expect(id1).not.toBe(id2);
    });
});
