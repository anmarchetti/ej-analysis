import { trackingApi } from '@sitecore-jss/sitecore-jss-nextjs';
import { action, makeObservable, observable } from 'mobx';

import { notificationsUrls } from 'code/endpoints';
import { envPublic } from 'code/env';
import { trackingApiOptions } from 'code/tracking.config';
import notificationsService from 'frontend/services/notifications.service';
import { TRootStore } from 'frontend/store/IStores';
import isBackend from 'frontend/utils/isBackend';
import { setWebStorageItem } from 'frontend/utils/webStorage.utils';
import {
    checkIfSafari,
    isNotificationsSupported,
    isWorkerSupported,
    registerServiceWorker,
} from 'frontend/utils/worker.utils';
import { NotificationPermission } from 'models/enum/NotificationPermissions';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

const workerPath = process.env.NEXT_PUBLIC_WORKER_URL ?? '';

export class BaseNotificationsStore {
    isInitialized = false;
    workerRegistration: ServiceWorkerRegistration | undefined;
    isAskNotificationsShown = false;
    isAskNotificationsPostponed = false;
    isUserFinishedFlow = false;
    goalId: string | null;

    constructor(public rootStore: TRootStore) {
        makeObservable(this, {
            isAskNotificationsShown: observable,
            isAskNotificationsPostponed: observable,
        });
    }

    initialize = async (): Promise<void> => {
        if (this.isInitialized) return;

        if (!isBackend() && isWorkerSupported()) {
            navigator.serviceWorker?.addEventListener('message', event => {
                if (!event?.data?.type) {
                    return;
                }

                if (event.data.type === 'PUSH_UNSUBSCRIBED' && event.data.subscription) {
                    this.unsubscribe(event.data.subscription, event.data.apiVersion ?? 0);
                }
            });

            await this.checkSubscription();
        }

        this.isInitialized = true;
    };

    checkSubscription = async (): Promise<void> => {
        // no need to check if service worker is no enabled or safari browser is used
        if (checkIfSafari()) {
            return;
        }

        let registration: ServiceWorkerRegistration | undefined;

        // get service worker registration
        if (this.workerRegistration) {
            registration = this.workerRegistration;
        } else {
            registration = await navigator.serviceWorker.getRegistration(workerPath);
        }

        // no registration found, seem user has not subsscribed yet
        if (!registration) {
            return;
        }

        // ask service worker to check if user unsubscribed from notifications
        registration.active?.postMessage({
            type: 'PUSH_CHECK_SUBSCRIPTION',
        });
    };

    // make request to server to remove unsubscribed user
    unsubscribe = async (subscription: PushSubscriptionJSON, apiVersion = 0): Promise<void> => {
        await this.initialize();

        if (!(subscription?.endpoint && subscription?.keys)) {
            return;
        }

        const success = await notificationsService.unsubscribe(subscription, apiVersion);

        // re-save subscription to indexDB, so unsubscribe will be triggered once again on next reload
        if (!success) {
            this.workerRegistration?.active?.postMessage({
                type: 'PUSH_SAVE_SUBSCRIPTION',
                payload: {
                    subscription,
                },
            });
        }
    };

    // returned save service worker registration if any, register service worker otherwise
    getWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
        await this.initialize();

        if (this.workerRegistration) {
            return this.workerRegistration;
        }

        try {
            const registration = await registerServiceWorker(workerPath);
            this.workerRegistration = registration;

            return this.workerRegistration;
        } catch (e) {
            return null;
        }
    };

    subscribeToPushNotifications = async (): Promise<void> => {
        await this.initialize();

        this.closeAskPopup();

        if (isBackend()) {
            return;
        }

        if (checkIfSafari()) {
            this.subscribeToSafariPushNotifications();

            return;
        }

        if (!isNotificationsSupported()) {
            return;
        }

        const [registration, permission] = await Promise.all([
            registerServiceWorker(workerPath),
            globalThis.Notification.requestPermission(),
        ]);

        if (permission !== NotificationPermission.Granted) {
            this.rootStore.trackingStore.trackPushNotification(false);

            return;
        }

        this.rootStore.trackingStore.trackPushNotification(true);

        await notificationsService.subscribeToNotifications(registration);

        trackingApi.trackEvent(
            [{ goalId: this.goalId || this.rootStore.layoutStore.trackingGoalId }],
            trackingApiOptions,
        );

        this.isUserFinishedFlow = true;
    };

    checkRemotePermission = (permissionData: { deviceToken: string; permission: PermissionState }): void => {
        const { permission, deviceToken } = permissionData;
        const { trackPushNotification } = this.rootStore.trackingStore;

        switch (permission) {
            case NotificationPermission.Denied:
                trackPushNotification(false);
                this.isUserFinishedFlow = true;
                break;
            case NotificationPermission.Granted:
                trackPushNotification(true);
                this.isUserFinishedFlow = true;
                notificationsService.subscribeToSafariNotifications(deviceToken);
                break;
            default:
                break;
        }
    };

    subscribeToSafariPushNotifications = async (): Promise<void> => {
        await this.initialize();

        trackingApi.trackEvent(
            [{ goalId: this.goalId || this.rootStore.layoutStore.trackingGoalId }],
            trackingApiOptions,
        );

        const { layoutStore } = this.rootStore;
        const webServiceUrl = `${layoutStore.protocol}://${layoutStore.domain}${envPublic.NOTIFICATIONS_URL}`; // we need absolute path
        checkIfSafari() &&
            globalThis.safari.pushNotification.requestPermission(
                webServiceUrl,
                envPublic.PUSH_ID,
                {}, // extra data
                this.checkRemotePermission, // The callback function.
            );
    };

    denyNotifications = action(() => {
        setWebStorageItem(WebStorageKeys.IsNotificationsDenied, 'true');

        this.closeAskPopup();
        this.isUserFinishedFlow = true;
        this.rootStore.trackingStore.trackPushNotification(false);
    });

    closeAskPopup = action(() => {
        this.isAskNotificationsShown = false;
    });

    trackUrl = action((relativeUrl?: string) => {
        const body: { [key: string]: string } = {
            url: relativeUrl
                ? globalThis.location.origin + this.rootStore.layoutStore.basePath + relativeUrl
                : globalThis.location.href,
        };

        if (this.rootStore.bookingStore.accommodationId) {
            body.accId = this.rootStore.bookingStore.accommodationId;
        }

        notificationsService.trackDataForNotification(notificationsUrls.trackHotelData(), body);
    });
}

export default BaseNotificationsStore;
