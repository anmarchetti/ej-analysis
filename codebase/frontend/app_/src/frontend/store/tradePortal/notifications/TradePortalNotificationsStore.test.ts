import { waitFor } from '@testing-library/dom';

import {
    setNotificationPermission,
    setSafariPermission,
} from 'frontend/store/base/notifications/__mocks__/permissionMock';
import * as utils from 'frontend/utils/worker.utils';
import { NotificationPermission } from 'models/enum/NotificationPermissions';

import TradePortalNotificationsStore from './TradePortalNotificationsStore';

Object.defineProperty(global['navigator'], 'serviceWorker', {
    value: {
        addEventListener: jest.fn(),
        getRegistration: jest.fn(),
    },
});

const mockCheckIfSafari = jest.spyOn(utils, 'checkIfSafari');
jest.spyOn(utils, 'isNotificationsSupported').mockReturnValue(true);
jest.spyOn(utils, 'isWorkerSupported').mockReturnValue(true);

describe('TradePortalNotificationsStore', () => {
    const createRootStore = () => ({
        layoutStore: {
            trackingGoalId: 'trackingGoalId',
            getSetting: jest.fn(p => p),
            setIsNotificationsTimerStarted: jest.fn(),
        },
        trackingStore: { trackPushNotification: jest.fn() },
    });
    let rootStore;

    beforeEach(() => {
        jest.useFakeTimers();
        mockCheckIfSafari.mockReturnValue(false);
        rootStore = createRootStore();
        setNotificationPermission(NotificationPermission.Granted);
        setSafariPermission(NotificationPermission.Default);
    });

    describe('initSubscribeFlow', () => {
        it('should NOT call getWorkerRegistration when permission is denied', async () => {
            setNotificationPermission(NotificationPermission.Denied);

            const store = new TradePortalNotificationsStore(rootStore);

            store.getWorkerRegistration = jest.fn();

            await store.initSubscribeFlow();

            expect(store.getWorkerRegistration).not.toHaveBeenCalled();
        });

        it('should NOT call getWorkerRegistration, call setIsNotificationsTimerStarted and set isAskNotificationsShown to true when permission is default', async () => {
            setNotificationPermission(NotificationPermission.Default);

            const store = new TradePortalNotificationsStore(rootStore);

            store.getWorkerRegistration = jest.fn();

            await store.initSubscribeFlow();

            expect(store.rootStore.layoutStore.setIsNotificationsTimerStarted).toHaveBeenCalledWith(true);
            waitFor(() => {
                expect(store.getWorkerRegistration).not.toHaveBeenCalled();
                expect(store.isAskNotificationsShown).toBe(true);
            });
        });

        it('should call getWorkerRegistration when permission is granted', async () => {
            const store = new TradePortalNotificationsStore(rootStore);
            const initializeSpy = jest.spyOn(store, 'initialize');

            store.getWorkerRegistration = jest.fn();

            await store.initSubscribeFlow();

            expect(initializeSpy).toHaveBeenCalled();
            expect(store.getWorkerRegistration).toHaveBeenCalled();
        });
    });

    describe('initSafariSubscribeFlow', () => {
        it('should NOT change values of isUserFinishedFlow and isAskNotificationsShown when is NOT Safari', async () => {
            const store = new TradePortalNotificationsStore(rootStore);

            store.initSafariSubscribeFlow();

            await waitFor(() => {
                expect(store.isUserFinishedFlow).toBe(false);
                expect(store.isAskNotificationsShown).toBe(false);
            });
        });

        it('should call setIsNotificationsTimerStarted and change value of isAskNotificationsShown to true when safari permission is default', async () => {
            mockCheckIfSafari.mockReturnValue(true);

            const store = new TradePortalNotificationsStore(rootStore);
            store.initSafariSubscribeFlow();

            expect(store.rootStore.layoutStore.setIsNotificationsTimerStarted).toHaveBeenLastCalledWith(true);
            await waitFor(() => {
                expect(store.isAskNotificationsShown).toBe(true);
                expect(store.isUserFinishedFlow).toBe(false);
            });
        });

        it('should change value of isUserFinishedFlow to true when safari permission is NOT default', async () => {
            mockCheckIfSafari.mockReturnValue(true);

            setSafariPermission(NotificationPermission.Denied);

            const store = new TradePortalNotificationsStore(rootStore);
            store.initSafariSubscribeFlow();

            await waitFor(() => {
                expect(store.isUserFinishedFlow).toBe(true);
                expect(store.isAskNotificationsShown).toBe(false);
            });
        });
    });
});
