import React from 'react';

import useStore from 'frontend/hooks/useStore';
import isBackend from 'frontend/utils/isBackend';
import { isNotificationsSupported } from 'frontend/utils/worker.utils';

import Button from './Button';

const SubscribeToPushButton = () => {
    const { initSubscribeFlow } = useStore(stores => ({
        initSubscribeFlow: stores.notificationsStore.initSubscribeFlow,
    }));

    if (isBackend() || !isNotificationsSupported()) {
        return null;
    }

    const subscribeToNotifications = () => {
        initSubscribeFlow();
    };

    return (
        <Button onClick={subscribeToNotifications} dataTid='subscribe-to-push'>
            Subscribe to push
        </Button>
    );
};

export default SubscribeToPushButton;
