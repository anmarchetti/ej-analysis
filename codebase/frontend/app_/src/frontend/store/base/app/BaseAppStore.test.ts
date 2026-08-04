import { SitecoreChannel } from 'frontend/store/base/tracking/sitecore/constants';

import BaseAppStore from './BaseAppStore';

describe('BaseAppStore', () => {
    describe('deviceType', () => {
        let store: BaseAppStore;

        beforeEach(() => {
            store = new BaseAppStore();
        });

        it('should return Desktop for isScreenExtraLarge', () => {
            store.breakpoint = 1400; // XL
            expect(store.deviceType).toBe(SitecoreChannel.Desktop);
        });

        it('should return Desktop for isScreenLarge', () => {
            store.breakpoint = 1200; // LG
            expect(store.deviceType).toBe(SitecoreChannel.Desktop);
        });

        it('should return Tablet for isScreenMedium', () => {
            store.breakpoint = 900; // MD
            expect(store.deviceType).toBe(SitecoreChannel.Tablet);
        });

        it('should return Mobile for small screens', () => {
            store.breakpoint = 500; // XS
            expect(store.deviceType).toBe(SitecoreChannel.Mobile);
        });
    });

    describe('isLoading', () => {
        it('should be true on init', () => {
            const store = new BaseAppStore();

            expect(store.isLoading).toBeTruthy();
        });

        it('setLoading should set value', () => {
            const store = new BaseAppStore();

            store.setLoading(false);

            expect(store.isLoading).toBeFalsy();
        });
    });

    describe('wasMaintenancePopupShown', () => {
        it('should be false on init', () => {
            const store = new BaseAppStore();

            expect(store.wasMaintenancePopupShown).toBeFalsy();
        });

        it('hideMaintenancePopup should set true', () => {
            const store = new BaseAppStore();

            store.hideMaintenancePopup();

            expect(store.wasMaintenancePopupShown).toBeTruthy();
        });
    });

    describe('isNavigationBooking', () => {
        it('should be false on init', () => {
            const store = new BaseAppStore();

            expect(store.isNavigationBooking).toBeFalsy();
        });

        it('setNavigationBooking should set value', () => {
            const store = new BaseAppStore();

            store.setNavigationBooking(true);

            expect(store.isNavigationBooking).toBeTruthy();
        });
    });

    describe('notification', () => {
        it('should be undefined on init', () => {
            const store = new BaseAppStore();

            expect(store.notification).toBeUndefined();
        });

        it('setNotification should set null if data nullable', () => {
            const store = new BaseAppStore();

            store.setNotification(false);

            expect(store.notification).toBeNull();
        });

        it('setNotification should set value', () => {
            const store = new BaseAppStore();

            store.setNotification('potato');

            expect(store.notification).toEqual('potato');
        });
    });

    describe('isNetworkPopupShown', () => {
        it('should be false on init', () => {
            const store = new BaseAppStore();

            expect(store.isNetworkPopupShown).toBeFalsy();
        });

        it('showNetworkIssuesPopup should set value', () => {
            const store = new BaseAppStore();

            store.showNetworkIssuesPopup(true);

            expect(store.isNetworkPopupShown).toBeTruthy();
        });
    });

    describe('wasPopunderShown', () => {
        it('should be false on init', () => {
            const store = new BaseAppStore();

            expect(store.wasPopunderShown).toBeFalsy();
        });

        it('showNetworkIssuesPopup should set value', () => {
            const store = new BaseAppStore();
            expect(store.wasPopunderShown).toBeFalsy();
            store.setWasPopunderShown(true);

            expect(store.wasPopunderShown).toBeTruthy();
        });
    });

    describe('isCookiesPopupWasShown', () => {
        it('should be false on init', () => {
            const store = new BaseAppStore();

            expect(store.isCookiesPopupWasShown).toBeFalsy();
        });

        it('setCookiesPopupWasShown should set value', () => {
            const store = new BaseAppStore();

            store.setCookiesPopupWasShown(true);

            expect(store.isCookiesPopupWasShown).toBeTruthy();
        });
    });
});
