import { trackingApi } from '@sitecore-jss/sitecore-jss-nextjs';

import notificationsService from 'frontend/services/notifications.service';
import { TRootStore } from 'frontend/store/IStores';
import isBackend from 'frontend/utils/isBackend';
import { findComponentByName } from 'frontend/utils/layout.utils';
import AxiosRequest from 'frontend/utils/request';
import * as utils from 'frontend/utils/worker.utils';
import { NotificationPermission } from 'models/enum/NotificationPermissions';

import BaseNotificationStore from './BaseNotificationStore';

jest.mock('frontend/utils/layout.utils');
jest.mock('frontend/utils/request');
jest.mock('frontend/utils/isBackend', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    trackingApi: {
        trackEvent: jest.fn(),
    },
}));

Object.defineProperty(global['navigator'], 'serviceWorker', {
    value: {
        addEventListener: jest.fn(),
        getRegistration: jest.fn(),
        register: jest.fn().mockResolvedValue({}),
    },
});

Object.defineProperty(globalThis, 'safari', {
    value: {
        pushNotification: { permission: jest.fn().mockReturnValue({ permission: NotificationPermission.Default }) },
    },
});

Object.defineProperty(globalThis, 'Notification', {
    value: {
        permission: NotificationPermission.Granted,
        requestPermission: jest.fn().mockResolvedValue(NotificationPermission.Granted),
    },
});

const mockCheckIfSafari = jest.spyOn(utils, 'checkIfSafari');
const mockRegisterServiceWorker = jest.spyOn(utils, 'registerServiceWorker');
const mockIsWorkerSupported = jest.spyOn(utils, 'isWorkerSupported');
const workerPath = process.env.NEXT_PUBLIC_WORKER_URL ?? '';
jest.spyOn(utils, 'isNotificationsSupported').mockReturnValue(true);
jest.spyOn(utils, 'isWorkerSupported').mockReturnValue(true);
AxiosRequest.post = jest.fn().mockResolvedValue({ data: {} });

describe('BaseNotificationStore', () => {
    const createRootStore = () =>
        ({
            layoutStore: {
                trackingGoalId: 'trackingGoalId',
                layout: {},
                isCabinBagsEnabled: false,
            },
            trackingStore: { trackPushNotification: jest.fn() },
            appStore: {
                isScreenExtraSmall: false,
                isScreenSmall: false,
                isScreenMedium: false,
                isScreenLarge: false,
                isScreenExtraLarge: true,
            },
            bookingStore: {
                accommodationId: 'SWEDFR362',
            },
        } as unknown as TRootStore);
    let rootStore;
    let store;

    beforeEach(() => {
        jest.useFakeTimers();
        mockCheckIfSafari.mockReturnValue(false);
        rootStore = createRootStore();
        store = new BaseNotificationStore(rootStore);
        jest.mocked(findComponentByName).mockReturnValue(null);
    });

    describe('initialize', () => {
        beforeEach(() => {
            (isBackend as jest.Mock).mockReturnValue(false);
            mockIsWorkerSupported.mockReturnValue(true);
        });

        it('should not re-initialize when isInitialized=true', async () => {
            store.isInitialized = true;

            const checkSubscriptionSpy = jest.spyOn(store, 'checkSubscription');

            await store.initialize();

            expect(navigator.serviceWorker.addEventListener).not.toHaveBeenCalled();
            expect(checkSubscriptionSpy).not.toHaveBeenCalled();
        });

        it('should skip some logic but set isInitialized when isBackend=true', async () => {
            (isBackend as jest.Mock).mockReturnValue(true);

            await store.initialize();

            expect(navigator.serviceWorker.addEventListener).not.toHaveBeenCalled();
            expect(store.isInitialized).toBe(true);
        });

        it('should skip some logic but set isInitialized when isWorkerSupported=false', async () => {
            mockIsWorkerSupported.mockReturnValue(false);

            await store.initialize();

            expect(navigator.serviceWorker.addEventListener).not.toHaveBeenCalled();
            expect(store.isInitialized).toBe(true);
        });

        it('should add event listener and call checkSubscription when not isBackend and isWorkerSupported', async () => {
            const checkSubscriptionSpy = jest.spyOn(store, 'checkSubscription').mockResolvedValue(true);

            await store.initialize();

            expect(navigator.serviceWorker.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
            expect(checkSubscriptionSpy).toHaveBeenCalled();

            expect(store.isInitialized).toBe(true);
        });

        it('should add event listener once when called multiple times', async () => {
            await store.initialize();
            await store.initialize();

            expect(navigator.serviceWorker.addEventListener).toHaveBeenCalledTimes(1);
        });

        it('should skip logic when event.data.type is not present', async () => {
            const eventListenerSpy = jest.fn();
            navigator.serviceWorker.addEventListener = eventListenerSpy;

            const unsubscribeSpy = jest.spyOn(store, 'unsubscribe').mockImplementation(jest.fn());

            await store.initialize();

            const messageEvent = new MessageEvent('message', { data: {} });
            const eventHandler = eventListenerSpy.mock.calls[0][1];
            eventHandler(messageEvent);

            expect(eventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it('should call unsubscribe when event.data.type is PUSH_UNSUBSCRIBED and subscription exists', async () => {
            const eventListenerSpy = jest.fn();
            navigator.serviceWorker.addEventListener = eventListenerSpy;

            const unsubscribeSpy = jest.spyOn(store, 'unsubscribe').mockImplementation(jest.fn());

            await store.initialize();

            const subscription = { endpoint: 'test-endpoint', keys: { p256dh: 'key1', auth: 'key2' } };
            const messageEvent = new MessageEvent('message', {
                data: { type: 'PUSH_UNSUBSCRIBED', subscription, apiVersion: 1 },
            });
            const eventHandler = eventListenerSpy.mock.calls[0][1];
            eventHandler(messageEvent);

            expect(unsubscribeSpy).toHaveBeenCalledWith(subscription, 1);
        });
    });

    describe('checkSubscription', () => {
        it('should check if Safari', async () => {
            await store.checkSubscription();

            expect(mockCheckIfSafari).toHaveBeenCalled();
        });

        it('should register service worker if it is not', async () => {
            await store.checkSubscription();

            expect(navigator.serviceWorker.getRegistration).toHaveBeenCalled();
        });
    });

    describe('unsubscribe', () => {
        it('should not call unsubscribe if subscription empty', async () => {
            const initializeSpy = jest.spyOn(store, 'initialize');

            await store.unsubscribe({});

            expect(initializeSpy).toHaveBeenCalled();
            expect(AxiosRequest.post).not.toHaveBeenCalled();
        });

        it('should call unsubscribe if subscription exist', async () => {
            await store.unsubscribe({ endpoint: 'endpoint', keys: { key1: 'key1 ' } });

            expect(AxiosRequest.post).toHaveBeenCalledWith(
                'http://test/notification/unsubscribe',
                {
                    subscription: {
                        endpoint: 'endpoint',
                        keys: { key1: 'key1 ' },
                    },
                },
                { headers: { 'Accept-Version': '0' } },
            );
        });
    });

    describe('getWorkerRegistration', () => {
        it('should not call registerServiceWorker when workerRegistration exist', async () => {
            store.workerRegistration = {} as ServiceWorkerRegistration;
            const initializeSpy = jest.spyOn(store, 'initialize');

            await store.getWorkerRegistration();

            expect(initializeSpy).toHaveBeenCalled();
            expect(mockRegisterServiceWorker).not.toHaveBeenCalled();
        });

        it('should register Service Worker and store the registration', async () => {
            const mockRegistration = { scope: '/test-scope/' } as ServiceWorkerRegistration;
            mockRegisterServiceWorker.mockResolvedValue(mockRegistration);

            const result = await store.getWorkerRegistration();

            expect(mockRegisterServiceWorker).toHaveBeenCalledWith(workerPath);

            expect(result).toBe(mockRegistration);
            expect(store.workerRegistration).toBe(mockRegistration);
        });

        it('should return null when registerServiceWorker throws an error', async () => {
            mockRegisterServiceWorker.mockRejectedValueOnce({ message: 'Registration failed' });

            const result = await store.getWorkerRegistration();

            expect(mockRegisterServiceWorker).toHaveBeenCalledWith(workerPath);

            expect(result).toBeNull();
            expect(store.workerRegistration).toBeUndefined();
        });
    });

    describe('subscribeToPushNotifications', () => {
        beforeEach(() => {
            jest.spyOn(rootStore.trackingStore, 'trackPushNotification');
            jest.spyOn(notificationsService, 'subscribeToNotifications').mockResolvedValue(true);
            jest.spyOn(trackingApi, 'trackEvent').mockImplementation(async () => {});
        });

        it('should call subscribeToSafariPushNotifications when checkIfSafari is true', async () => {
            mockCheckIfSafari.mockReturnValue(true);

            const safariSpy = jest.spyOn(store, 'subscribeToSafariPushNotifications').mockImplementation(jest.fn());

            await store.subscribeToPushNotifications();

            expect(safariSpy).toHaveBeenCalled();

            expect(rootStore.trackingStore.trackPushNotification).not.toHaveBeenCalled();
        });

        it('should handle granted permission and call trackingStore', async () => {
            await store.subscribeToPushNotifications();

            expect(rootStore.trackingStore.trackPushNotification).toHaveBeenCalledWith(true);
            expect(notificationsService.subscribeToNotifications).toHaveBeenCalled();
            expect(store.isUserFinishedFlow).toBeTruthy();
        });

        it('should return early when isBackend is true', async () => {
            (isBackend as jest.Mock).mockReturnValue(true);

            const safariSpy = jest.spyOn(store, 'subscribeToSafariPushNotifications').mockImplementation(jest.fn());

            await store.subscribeToPushNotifications();

            expect(safariSpy).not.toHaveBeenCalled();
            expect(rootStore.trackingStore.trackPushNotification).not.toHaveBeenCalled();
        });

        it('should return early when notifications are not supported', async () => {
            jest.spyOn(utils, 'isNotificationsSupported').mockReturnValue(false);

            const safariSpy = jest.spyOn(store, 'subscribeToSafariPushNotifications').mockImplementation(jest.fn());

            await store.subscribeToPushNotifications();

            expect(safariSpy).not.toHaveBeenCalled();
            expect(rootStore.trackingStore.trackPushNotification).not.toHaveBeenCalled();
        });
    });

    describe('denyNotifications', () => {
        it('should close ask popup', () => {
            const store = new BaseNotificationStore(rootStore);

            store.closeAskPopup = jest.fn();
            store.denyNotifications();

            expect(store.closeAskPopup).toHaveBeenCalled();
        });

        it('should finish flow', () => {
            const store = new BaseNotificationStore(rootStore);

            store.isUserFinishedFlow = false;
            store.denyNotifications();

            expect(store.isUserFinishedFlow).toBeTruthy();
        });

        it('should deny notifications', () => {
            const store = new BaseNotificationStore(rootStore);

            store.denyNotifications();

            expect(store.rootStore.trackingStore.trackPushNotification).toHaveBeenCalledWith(false);
        });
    });

    describe('closeAskPopup', () => {
        it('should set isAskNotificationsShown to false', () => {
            const store = new BaseNotificationStore(rootStore);

            store.isAskNotificationsShown = true;
            store.closeAskPopup();

            expect(store.isAskNotificationsShown).toBeFalsy();
        });
    });

    describe('trackUrl', () => {
        it('should track url', async () => {
            await store.trackUrl('relativeUrl');

            expect(AxiosRequest.post).toHaveBeenCalledWith('http://test/cms-api/tracking/hotel-data', {
                accId: 'SWEDFR362',
                url: 'http://localhostundefinedrelativeUrl',
            });
        });
    });

    describe('checkRemotePermission', () => {
        it('should handle denied permission correctly', () => {
            rootStore.trackingStore.trackPushNotification = jest.fn();

            const permissionData = { permission: NotificationPermission.Denied };

            store.checkRemotePermission(permissionData);

            expect(rootStore.trackingStore.trackPushNotification).toHaveBeenCalledWith(false);

            expect(store.isUserFinishedFlow).toBe(true);
        });

        it('should handle granted permission correctly and subscribe to notifications', () => {
            rootStore.trackingStore.trackPushNotification = jest.fn();
            const subscribeSpy = jest
                .spyOn(notificationsService, 'subscribeToSafariNotifications')
                .mockResolvedValue(true);

            const permissionData = { permission: NotificationPermission.Granted, deviceToken: 'test-device-token' };

            store.checkRemotePermission(permissionData);

            expect(rootStore.trackingStore.trackPushNotification).toHaveBeenCalledWith(true);

            expect(subscribeSpy).toHaveBeenCalledWith('test-device-token');

            expect(store.isUserFinishedFlow).toBe(true);
        });
    });
});
