import TradePortalSearchFilterStore from 'frontend/store/tradePortal/search/TradePortalSearchFiltersStore';

describe('TradePortalSearchFilterStore', () => {
    test('should be created with rootStore', () => {
        const rootStore = {} as any;
        const store = new TradePortalSearchFilterStore(rootStore);

        expect(store).toBeInstanceOf(TradePortalSearchFilterStore);
        expect(store.rootStore).toBe(rootStore);
    });
});
