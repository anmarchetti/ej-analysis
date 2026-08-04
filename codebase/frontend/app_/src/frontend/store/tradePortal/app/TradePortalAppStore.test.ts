import TradePortalAppStore from './TradePortalAppStore';

describe('TradePortalAppStore', () => {
    describe('alertActiveTab', () => {
        it('should be undefined on init', () => {
            const store = new TradePortalAppStore();

            expect(store.alertActiveTab).toBeUndefined();
        });

        it('setAlertActiveTab should set value', () => {
            const store = new TradePortalAppStore();

            store.setAlertActiveTab('Maroon 5');

            expect(store.alertActiveTab).toEqual('Maroon 5');
        });
    });

    describe('alertInfoLoaded', () => {
        it('should be false on init', () => {
            const store = new TradePortalAppStore();

            expect(store.alertInfoLoaded).toBeFalsy();
        });

        it('setAlertInfoLoaded should set value', () => {
            const store = new TradePortalAppStore();

            store.setAlertInfoLoaded(true);

            expect(store.alertInfoLoaded).toBeTruthy();
        });
    });
});
