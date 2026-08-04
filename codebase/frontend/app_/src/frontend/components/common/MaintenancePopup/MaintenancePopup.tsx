import { useEffect } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isTradeStore } from 'frontend/store/tradePortal';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

import MaintenanceContent from './components/MaintenanceContent/MaintenanceContent';

import styles from './MaintenancePopup.module.scss';

export const MaintenancePopup = () => {
    const { getPhrase, isMaintenance, hideMaintenancePopup, isTradeLoginPage, wasMaintenancePopupShown } = useStore(
        stores => ({
            getPhrase: stores.layoutStore.getPhrase,
            isMaintenance: stores.layoutStore.isMaintenance,
            isTradeLoginPage: isTradeStore(stores) && stores.layoutStore.isLoginPage,
            hideMaintenancePopup: stores.appStore.hideMaintenancePopup,
            wasMaintenancePopupShown: stores.appStore.wasMaintenancePopupShown,
        }),
    );

    useEffect(() => {
        if (isMaintenance && !wasMaintenancePopupShown) {
            sessionStorage.setItem(WebStorageKeys.IsMaintenancePopupWasShown, JSON.stringify(true));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (wasMaintenancePopupShown || !isMaintenance || isTradeLoginPage) {
        return null;
    }

    return (
        <Popup
            containerClass={styles.container}
            id='maintenance-popup'
            onClose={hideMaintenancePopup}
            footerContent={
                <Button onClick={hideMaintenancePopup}>
                    {getPhrase(SitecoreDictionary.MaintenancePopupButtonsGotIt)}
                </Button>
            }
        >
            <MaintenanceContent />
        </Popup>
    );
};

export default observer(MaintenancePopup);
