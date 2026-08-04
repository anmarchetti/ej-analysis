import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

import styles from './InvalidLuggageInUrlPopup.module.scss';

const InvalidLuggageInUrlPopup = () => {
    const {
        isAskNotificationsShown,
        setShowInvalidLuggageInUrlPopup,
        showInvalidLuggageInUrlPopup,
        getPhrase,
        redirectToHomePage,
    } = useStore((stores: TStores) => ({
        showInvalidLuggageInUrlPopup: stores.bookingStore.showInvalidLuggageInUrlPopup,
        getPhrase: stores.layoutStore.getPhrase,
        redirectToHomePage: stores.routerStore.redirectToHomePage,
        setShowInvalidLuggageInUrlPopup: stores.bookingStore.setShowInvalidLuggageInUrlPopup,
        isAskNotificationsShown: stores.notificationsStore.isAskNotificationsShown,
    }));

    if (!showInvalidLuggageInUrlPopup || isAskNotificationsShown) {
        return null;
    }

    const handleClick = () => {
        redirectToHomePage();
        setShowInvalidLuggageInUrlPopup(false);
    };

    return (
        <Popup
            title={getPhrase(SitecoreDictionary.LuggageUrlPopupLabelsHeader)}
            bodyClass={styles.popupContent}
            containerClass={styles.popupContainer}
            contentClass={styles.popupContainer}
        >
            {getPhrase(SitecoreDictionary.LuggageUrlPopupLabelsContent)}
            <Button className={styles.backBtn} onClick={handleClick} data-tid='back-button'>
                {getPhrase(SitecoreDictionary.LuggageUrlPopupButtonsBackToHomepage)}
            </Button>
        </Popup>
    );
};

export default observer(InvalidLuggageInUrlPopup);
