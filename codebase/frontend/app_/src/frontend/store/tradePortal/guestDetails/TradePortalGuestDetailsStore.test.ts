import BaseGuestDetailsStore from 'frontend/store/base/guestDetails/BaseGuestDetailsStore';
import { IValidationError } from 'models/data/validation/IValidationError';

import TradePortalGuestDetailsStore from './TradePortalGuestDetailsStore';

describe('TradePortalGuestDetailsStore', () => {
    const rootStore = {
        layoutStore: { isTradePortal: true },
        routerStore: { redirectToConfirmPage: jest.fn() },
    } as any;

    describe('isFormValid', () => {
        test('should return true if all guest info valid and policy confirmed', () => {
            jest.spyOn(BaseGuestDetailsStore.prototype, 'guestDetailsErrors', 'get').mockImplementation(() => []);
            const store = new TradePortalGuestDetailsStore(rootStore);
            store.confirmPolicy = true;

            expect(store.isFormValid).toBeTruthy();
        });

        test('should return false if all guest info invalid', () => {
            jest.spyOn(BaseGuestDetailsStore.prototype, 'guestDetailsErrors', 'get').mockImplementation(
                () => [{ errorMessage: 'error' }] as IValidationError[],
            );
            const store = new TradePortalGuestDetailsStore(rootStore);
            store.confirmPolicy = true;

            expect(store.isFormValid).toBeFalsy();
        });

        test('should return false if policy not confirmed', () => {
            jest.spyOn(BaseGuestDetailsStore.prototype, 'guestDetailsErrors', 'get').mockImplementation(() => []);
            const store = new TradePortalGuestDetailsStore(rootStore);
            store.confirmPolicy = false;

            expect(store.isFormValid).toBeFalsy();
        });
    });

    describe('initialize()', () => {
        it('should initialize guest details', () => {
            const store = new TradePortalGuestDetailsStore(rootStore);
            const spyCleanUpGuestDetails = jest.spyOn(store, 'cleanUpGuestDetails').mockImplementation();
            const spyCreateGuestsDetails = jest.spyOn(store, 'createGuestsDetails').mockImplementation();
            const spyUpdateFromStorage = jest.spyOn(store, 'updateGuestsDetailsWithSessionData').mockImplementation();
            const spyLoadReferenceData = jest.spyOn(store, 'loadReferenceData').mockImplementation();

            store.initialize();

            expect(spyCleanUpGuestDetails).toHaveBeenCalled();
            expect(spyCreateGuestsDetails).toHaveBeenCalled();
            expect(spyUpdateFromStorage).toHaveBeenCalled();
            expect(spyLoadReferenceData).toHaveBeenCalled();
        });
    });

    describe('cleanUpGuestDetails()', () => {
        it('should clear store info', () => {
            const store = new TradePortalGuestDetailsStore(rootStore);
            store.confirmPolicy = true;
            store.forceErrors = true;

            store.cleanUpGuestDetails();

            expect(store.confirmPolicy).toBeFalsy();
            expect(store.forceErrors).toBeFalsy();
        });
    });

    describe('onSelectContinue()', () => {
        it('should save guest info and go to confirm page', () => {
            const store = new TradePortalGuestDetailsStore(rootStore);
            const spySaveToSessionStorage = jest.spyOn(store, 'saveGuestDetailsToSessionStorage');

            store.onSelectContinue();

            expect(spySaveToSessionStorage).toHaveBeenCalled();
            expect(rootStore.routerStore.redirectToConfirmPage).toHaveBeenCalled();
        });
    });
});
