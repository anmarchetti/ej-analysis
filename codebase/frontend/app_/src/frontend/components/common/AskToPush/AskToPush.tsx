import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import AnimatedPopup from 'frontend/components/common/AnimatedPopup/AnimatedPopup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import Bell from 'frontend/components/icons-new/Bell';

import styles from './AskToPush.module.scss';

const AskToPush: FC = () => {
    const {
        isShown,
        subscribeToPushNotifications,
        denyNotifications,
        getSetting,
        getPhrase,
        isCookiesPopupWasShown,
        setIsNotificationsTimerStarted,
    } = useStore(stores => ({
        isShown: stores.notificationsStore.isAskNotificationsShown,
        subscribeToPushNotifications: stores.notificationsStore.subscribeToPushNotifications,
        denyNotifications: stores.notificationsStore.denyNotifications,
        getSetting: stores.layoutStore.getSetting,
        getPhrase: stores.layoutStore.getPhrase,
        isCookiesPopupWasShown: stores.appStore.isCookiesPopupWasShown,
        setIsNotificationsTimerStarted: stores.layoutStore.setIsNotificationsTimerStarted,
    }));

    const onApproveClick = (): void => {
        subscribeToPushNotifications();
        setIsNotificationsTimerStarted(false);
    };

    const onDeclineClick = (): void => {
        denyNotifications();
        setIsNotificationsTimerStarted(false);
    };

    return (
        <AnimatedPopup
            isShown={isShown && isCookiesPopupWasShown && getSetting(SiteSettings.IsAskToSubscribePopupEnabled) === '1'}
            onClose={onDeclineClick}
            firstButton={{
                content: getPhrase(SitecoreDictionary.NotificationsButtonsAllow),
                onClick: onApproveClick,
                dataTid: 'ask-to-push-approve-button',
            }}
            content={
                <>
                    <Bell className={styles.icon} />
                    <Text
                        tag='div'
                        className={styles.title}
                        field={{ value: getSetting(SiteSettings.AskNotificationsTitle) }}
                    />
                    <RichTextWithLinks
                        tag='div'
                        className={styles.description}
                        field={{ value: getSetting(SiteSettings.AskNotificationsDescription) }}
                    />
                </>
            }
            showCloseButton
        />
    );
};

export default observer(AskToPush);
