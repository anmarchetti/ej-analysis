import { useCompareStore, withCompareStore } from './createCompareLocalStore';

describe('createCompareLocalStore', () => {
    it('should provide withCompareStore and useCompareStore', () => {
        expect(withCompareStore).toBeDefined();
        expect(useCompareStore).toBeDefined();
    });
});
