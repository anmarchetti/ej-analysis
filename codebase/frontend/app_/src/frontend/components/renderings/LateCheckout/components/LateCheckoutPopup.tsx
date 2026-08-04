import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import JSSImage from 'frontend/components/common/JSSImage';
import { Popup } from 'frontend/components/common/Popup';

import styles from './LateCheckoutPopup.module.scss';

export interface ILateCheckoutPopupFields {
    PopUpDescription: ISitecoreField<string>;
    PopUpIcon: ISitecoreField<ISitecoreImage>;
    PopUpTitle: ISitecoreField<string>;
}

interface ILateCheckoutPopupProps extends ILateCheckoutPopupFields {
    closePopup: () => void;
    isLateCheckoutPopupShown: boolean;
}

const LateCheckoutPopup = (props: ILateCheckoutPopupProps) => {
    const { isScreenMedium, isLateCheckoutEnabledBySitecore, getPhrase } = useStore(stores => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        isLateCheckoutEnabledBySitecore: stores.layoutStore.isLateCheckoutEnabledBySitecore,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!isLateCheckoutEnabledBySitecore) {
        return null;
    }

    const renderContent = () => (
        <>
            <JSSImage field={props.PopUpIcon} className={styles.icon} />
            <Text field={props.PopUpTitle} tag='h2' className={styles.title} />
            <Text field={props.PopUpDescription} tag='p' className={styles.description} />
        </>
    );

    return isScreenMedium ? (
        <>
            {props.isLateCheckoutPopupShown ? (
                <Popup
                    isContentCentered
                    showCloseButton
                    containerClass={styles.container}
                    dialogClass={styles.popupDialog}
                    onClose={props.closePopup}
                    footerContent={
                        <Button onClick={props.closePopup} className={styles.action}>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                        </Button>
                    }
                >
                    {renderContent()}
                </Popup>
            ) : null}
        </>
    ) : (
        <Drawer open={props.isLateCheckoutPopupShown} className='text-start'>
            <div className={styles.container}>{renderContent()}</div>
            <div className={classNames(styles.actions, 'drawer__actions')}>
                <Button onClick={props.closePopup} className={styles.action}>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
            </div>
        </Drawer>
    );
};

export default LateCheckoutPopup;
