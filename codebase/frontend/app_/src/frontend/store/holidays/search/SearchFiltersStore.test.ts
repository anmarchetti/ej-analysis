import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import SearchFilterStore from './SearchFiltersStore';

describe('SearchFiltersStore', () => {
    let store;
    let rootStore;

    beforeEach(() => {
        rootStore = {};
        store = new SearchFilterStore(rootStore);
    });

    test('should be created with rootStore', () => {
        expect(store).toBeInstanceOf(SearchFilterStore);
        expect(store.rootStore).toBe(rootStore);
    });

    describe('onSelectGroup', () => {
        it('should add filter if not selected', () => {
            store.onSelectGroup(FilterGroupCodes.PriceRange);

            expect(store.selectedFilterGroups).toContain(FilterGroupCodes.PriceRange);
        });

        it('should remove filter if already selected', () => {
            store.selectedFilterGroups = new Set([FilterGroupCodes.PriceRange]);

            store.onSelectGroup(FilterGroupCodes.PriceRange);

            expect(store.selectedFilterGroups).not.toContain(FilterGroupCodes.PriceRange);
        });

        describe('onRemoveFilterGroup', () => {
            it('should clear price filters value if filter group code is price range', () => {
                store.clearPriceFiltersValue = jest.fn();
                store.onRemoveFilterGroup(FilterGroupCodes.PriceRange);
                expect(store.clearPriceFiltersValue).toHaveBeenCalled();
            });
        });
    });
});
