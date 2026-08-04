import { NotificationPermission } from 'models/enum/NotificationPermissions';

export const setNotificationPermission = (permission: NotificationPermission): void => {
    Object.defineProperty(globalThis, 'Notification', {
        configurable: true,
        value: {
            permission,
            requestPermission: jest.fn().mockResolvedValue(permission),
        },
    });
};

export const setSafariPermission = (permission: NotificationPermission): void => {
    Object.defineProperty(globalThis, 'safari', {
        configurable: true,
        value: {
            pushNotification: {
                permission: jest.fn().mockReturnValue({ permission }),
            },
        },
    });
};
