import { notificationsUrls } from 'code/endpoints';
import { envPublic } from 'code/env';
import AxiosRequest from 'frontend/utils/request';
import { urlB64ToUint8Array } from 'frontend/utils/worker.utils';

import logger from './logging/logger.service';

class NotificationsService {
    subscribeToNotifications = async (registration: ServiceWorkerRegistration): Promise<boolean> => {
        try {
            const subscription = await registration.pushManager.subscribe({
                applicationServerKey: urlB64ToUint8Array(envPublic.VAPID_PUBLIC_KEY),
                userVisibleOnly: true,
            });

            // notify service worker that user has just subscribed to push notifications
            registration.active?.postMessage({
                type: 'PUSH_SUBSCRIBED',
            });

            await AxiosRequest.post(
                notificationsUrls.subscribe(),
                { subscription },
                { headers: { 'Accept-Version': '1' } },
            );

            return true;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            return false;
        }
    };

    subscribeToSafariNotifications = async (token: string): Promise<boolean> => {
        try {
            await AxiosRequest.post(
                notificationsUrls.subscribe(),
                { subscription: { token } },
                { headers: { 'Accept-Version': '1' } },
            );

            return true;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            return false;
        }
    };

    unsubscribe = async (subscription: PushSubscriptionJSON, apiVersion = 0): Promise<boolean> => {
        try {
            await AxiosRequest.post(
                notificationsUrls.unsubscribe(),
                { subscription },
                {
                    headers: {
                        // provide accept-version header, to ensure it's from updated service worker
                        'Accept-Version': String(apiVersion),
                    },
                },
            );

            return true;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            return false;
        }
    };

    trackDataForNotification = async (url: string, data: { [key: string]: any }): Promise<void> => {
        try {
            await AxiosRequest.post(url, data);
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }
        }
    };
}

const notificationsService = new NotificationsService();
export default notificationsService;
