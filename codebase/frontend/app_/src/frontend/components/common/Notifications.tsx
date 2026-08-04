import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SvgCross from 'frontend/components/icons-new/Cross';

export const Notifications: FC = () => {
    const { notification, setNotification } = useStore(stores => ({
        notification: stores.appStore.notification,
        setNotification: stores.appStore.setNotification,
    }));

    if (!notification) {
        return null;
    }

    return (
        <div className='app-notification'>
            <button className='app-notification__button' onClick={(): void => setNotification(undefined)}>
                <SvgCross />
            </button>
            {notification.icon && (
                <div
                    data-tid='app-notification-image'
                    className='app-notification__image'
                    style={{ backgroundImage: `url(${notification.icon})` }}
                />
            )}
            <div className='app-notification__content'>
                <div className='app-notification__title'>{notification.title}</div>
                {notification.body && <div className='app-notification__body'>{notification.body}</div>}
            </div>
        </div>
    );
};

export default observer(Notifications);
