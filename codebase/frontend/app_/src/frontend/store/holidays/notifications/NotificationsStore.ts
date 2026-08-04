import { action } from 'mobx';

import { envPublic } from 'code/env';
import { BaseNotificationsStore } from 'frontend/store/base';
import isBackend from 'frontend/utils/isBackend';
import { findComponentByName } from 'frontend/utils/layout.utils';
import { getWebStorageItem } from 'frontend/utils/webStorage.utils';
import { checkIfSafari, isNotificationsSupported } from 'frontend/utils/worker.utils';
import { NotificationPermission } from 'models/enum/NotificationPermissions';
import SiteSettings from 'models/enum/SiteSettings';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

const TIME_INTERVAL = 1000;

class NotificationsStore extends BaseNotificationsStore {
    initSubscribeFlow = action(async () => {
        await this.initialize();

        if (
            isBackend() ||
            getWebStorageItem(WebStorageKeys.IsNotificationsDenied) === 'true' ||
            this.isUserFinishedFlow
        ) {
            return;
        }

        this.goalId = this.rootStore.layoutStore.trackingGoalId;

        if (checkIfSafari()) {
            this.initSafariSubscribeFlow();

            return;
        }

        // stop if 1) we are on server 2) browser doesn't support notifications 3) already denied notifications 4) denied notifications inside our popup
        if (!isNotificationsSupported() || globalThis.Notification.permission === NotificationPermission.Denied) {
            return;
        }

        // permission already granted, highly likely we are already subscribed
        if (globalThis.Notification.permission === NotificationPermission.Granted) {
            const registration = await this.getWorkerRegistration();

            if (!registration) {
                return;
            }

            const subscription = await registration.pushManager.getSubscription();

            // we are already subscribed, nothing to do here
            if (subscription) {
                this.isUserFinishedFlow = true;

                // TODO: add check if request for sending subscription to sitecore failed
                return;
            }

            // permission were granted, but no subscription for some reason => initiate subscription once again
            this.subscribeToPushNotifications();
        } else {
            // we were not previously subscribed and no permission check => show subscribe popup
            this.toggleNotificationsIfPopunderIsNotShown();
        }
    });

    // INS-364: Delay Push notification pop-up from Airlines PopUnder
    toggleNotificationsIfPopunderIsNotShown = (): void => {
        const {
            appStore: { wasPopunderShown, isScreenLessMedium },
            queryParamsStore: { shouldShowPopunder, utmParams },
            layoutStore: { layout },
        } = this.rootStore;
        const popunderComponent = findComponentByName(layout, 'Pop Under');
        const isPopunderRenderedNow =
            !wasPopunderShown && shouldShowPopunder(utmParams) && !isScreenLessMedium && popunderComponent?.fields;

        if (isPopunderRenderedNow) {
            this.isAskNotificationsPostponed = true;

            return;
        }

        this.toggleNotifications();
    };

    toggleNotifications = action(() => {
        this.rootStore.layoutStore.setIsNotificationsTimerStarted(true);
        this.isAskNotificationsPostponed = false;

        setTimeout(() => {
            this.isAskNotificationsShown = true;
        }, this.rootStore.layoutStore.getSetting(SiteSettings.AskToSubscribePopupDelay) * TIME_INTERVAL || 0);
    });

    initSafariSubscribeFlow = action(() => {
        if (!checkIfSafari() || this.isUserFinishedFlow) {
            return;
        }

        // already subscribed
        if (
            globalThis.safari.pushNotification.permission(envPublic.PUSH_ID).permission !==
            NotificationPermission.Default
        ) {
            this.isUserFinishedFlow = true;

            return;
        }

        this.toggleNotificationsIfPopunderIsNotShown();
    });
}

export default NotificationsStore;
