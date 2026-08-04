import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { waitFor } from '@testing-library/dom';

import {
    setNotificationPermission,
    setSafariPermission,
} from 'frontend/store/base/notifications/__mocks__/permissionMock';
import { findComponentByName } from 'frontend/utils/layout.utils';
import * as utils from 'frontend/utils/worker.utils';
import { NotificationPermission } from 'models/enum/NotificationPermissions';

import NotificationsStore from './NotificationsStore';

jest.mock('frontend/utils/layout.utils');

Object.defineProperty(global['navigator'], 'serviceWorker', {
    value: {
        addEventListener: jest.fn(),
        getRegistration: jest.fn(),
    },
});

const mockCheckIfSafari = jest.spyOn(utils, 'checkIfSafari');
jest.spyOn(utils, 'isNotificationsSupported').mockReturnValue(true);
jest.spyOn(utils, 'isWorkerSupported').mockReturnValue(true);

describe('NotificationsStore', () => {
    const createRootStore = () => ({
        layoutStore: {
            trackingGoalId: 'trackingGoalId',
            getSetting: jest.fn(p => p),
            setIsNotificationsTimerStarted: jest.fn(),
            layout: {},
        },
        trackingStore: { trackPushNotification: jest.fn() },
        appStore: { wasPopunderShown: false, isScreenLessMedium: false },
        queryParamsStore: { shouldShowPopunder: jest.fn(), utmParams: {} },
    });
    let rootStore;

    beforeEach(() => {
        jest.useFakeTimers();
        mockCheckIfSafari.mockReturnValue(false);
        rootStore = createRootStore();
        setNotificationPermission(NotificationPermission.Granted);
        setSafariPermission(NotificationPermission.Default);

        jest.mocked(findComponentByName).mockReturnValue(null);
    });

    describe('initSubscribeFlow', () => {
        it('should NOT call either getWorkerRegistration or toggleNotificationsIfPopunderIsNotShown when permission is denied', async () => {
            setNotificationPermission(NotificationPermission.Denied);
            const store = new NotificationsStore(rootStore);
            const initializeSpy = jest.spyOn(store, 'initialize');

            store.getWorkerRegistration = jest.fn();
            store.toggleNotificationsIfPopunderIsNotShown = jest.fn();

            await store.initSubscribeFlow();

            expect(initializeSpy).toHaveBeenCalled();
            expect(store.getWorkerRegistration).not.toHaveBeenCalled();
            expect(store.toggleNotificationsIfPopunderIsNotShown).not.toHaveBeenCalled();
        });

        it('should NOT call getWorkerRegistration and call toggleNotificationsIfPopunderIsNotShown when permission is default', async () => {
            setNotificationPermission(NotificationPermission.Default);
            const store = new NotificationsStore(rootStore);

            store.getWorkerRegistration = jest.fn();
            store.toggleNotificationsIfPopunderIsNotShown = jest.fn();

            await store.initSubscribeFlow();

            expect(store.getWorkerRegistration).not.toHaveBeenCalled();
            expect(store.toggleNotificationsIfPopunderIsNotShown).toHaveBeenCalled();
        });

        it('should call getWorkerRegistration when permission is granted', async () => {
            const store = new NotificationsStore(rootStore);

            store.getWorkerRegistration = jest.fn();

            await store.initSubscribeFlow();

            expect(store.getWorkerRegistration).toHaveBeenCalled();
        });
    });

    describe('toggleNotifications', () => {
        it('should call setIsNotificationsTimerStarted and set actual values to isAskNotifications flags when call toggleNotifications', async () => {
            rootStore.isAskNotificationsPostponed = true;
            rootStore.isAskNotificationsShown = false;
            const store = new NotificationsStore(rootStore);

            store.toggleNotifications();

            expect(store.rootStore.layoutStore.setIsNotificationsTimerStarted).toHaveBeenCalledWith(true);
            expect(store.isAskNotificationsPostponed).toBe(false);
            await waitFor(() => {
                expect(store.isAskNotificationsShown).toBe(true);
            });
        });
    });

    describe('toggleNotificationsIfPopunderIsNotShown', () => {
        it('should call toggleNotifications and set isAskNotificationsPostponed to false when Popunder is not rendered at the moment of call', async () => {
            const store = new NotificationsStore(rootStore);

            store.toggleNotifications = jest.fn();

            store.toggleNotificationsIfPopunderIsNotShown();

            expect(store.isAskNotificationsPostponed).toBe(false);
            expect(store.toggleNotifications).toHaveBeenCalled();
        });

        it('should call toggleNotifications and set isAskNotificationsPostponed to true when Popunder is rendered at the moment of call', async () => {
            rootStore.appStore.wasPopunderShown = false;
            rootStore.appStore.isScreenLessMedium = false;
            rootStore.queryParamsStore.shouldShowPopunder = jest.fn().mockReturnValueOnce(true);
            jest.mocked(findComponentByName).mockReturnValueOnce({ fields: {} } as ComponentRendering);

            const store = new NotificationsStore(rootStore);

            store.toggleNotifications = jest.fn();

            store.toggleNotificationsIfPopunderIsNotShown();

            expect(store.isAskNotificationsPostponed).toBe(true);
            expect(store.toggleNotifications).not.toHaveBeenCalled();
        });
    });

    describe('initSafariSubscribeFlow', () => {
        it('should NOT change values of isUserFinishedFlow and isAskNotificationsShown when is NOT Safari', async () => {
            const store = new NotificationsStore(rootStore);

            store.initSafariSubscribeFlow();

            await waitFor(() => {
                expect(store.isUserFinishedFlow).toBe(false);
                expect(store.isAskNotificationsShown).toBe(false);
            });
        });

        it('should call setIsNotificationsTimerStarted and change value of isAskNotificationsShown to true when safari permission is default', async () => {
            mockCheckIfSafari.mockReturnValue(true);

            const store = new NotificationsStore(rootStore);
            store.initSafariSubscribeFlow();

            expect(store.rootStore.layoutStore.setIsNotificationsTimerStarted).toHaveBeenCalledWith(true);
            await waitFor(() => {
                expect(store.isAskNotificationsShown).toBe(true);
                expect(store.isUserFinishedFlow).toBe(false);
            });
        });

        it('should change value of isUserFinishedFlow to true when safari permission is NOT default', async () => {
            mockCheckIfSafari.mockReturnValue(true);
            setSafariPermission(NotificationPermission.Denied);

            const store = new NotificationsStore(rootStore);
            store.initSafariSubscribeFlow();

            await waitFor(() => {
                expect(store.isUserFinishedFlow).toBe(true);
                expect(store.isAskNotificationsShown).toBe(false);
            });
        });
    });
});
