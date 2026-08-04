import { useEffect } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import { Popup } from 'frontend/components/common/Popup';
import SvgChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import { IAmendPassengersFields } from 'frontend/components/renderings/AmendPassengers/AmendPassengers';
import { useAmendPassengersLocalStore } from 'frontend/components/renderings/AmendPassengers/stores/amendPassengerLocalStore';

import styles from './PageLeavePopUp.module.scss';

export interface IAmendGuestPopupProps {
    isLoading: boolean;
    onCancel: () => void;
    onClose: () => void;
    onSave: () => void;
    fields?: IAmendPassengersFields;
}

export const PageLeavePopUp = ({ fields, isLoading, onSave, onCancel, onClose }: IAmendGuestPopupProps) => {
    const { tracking } = useAmendPassengersLocalStore();
    const { HeaderBackText, UnsavedPopupTitle, UnsavedPopupSubtext, PopupWarningIcon } = fields || {};

    const { getPhrase, isScreenLessMedium } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
    }));

    useEffect(() => {
        if (UnsavedPopupSubtext?.value) {
            tracking.onUnSavedPassengerNotify(UnsavedPopupSubtext.value);
        }
    }, []);

    return (
        <Popup
            id='amend-guests-leave-popup'
            dialogClass={styles.dialog}
            contentClass={styles.content}
            bodyClass={styles.body}
        >
            {HeaderBackText?.value && (
                <Button className={styles.headerBackButton} isTransparent onClick={onClose}>
                    <SvgChevronLeft />
                    {HeaderBackText?.value}
                </Button>
            )}
            <div className={styles.title}>
                {PopupWarningIcon && <JSSImage className={styles.guestIcon} field={PopupWarningIcon} />}
                {UnsavedPopupTitle?.value && <Text field={UnsavedPopupTitle} tag='h4' />}
            </div>

            {UnsavedPopupSubtext?.value && <Text field={UnsavedPopupSubtext} className={styles.subtext} tag='p' />}

            <div className={styles.buttons}>
                <Button
                    isOutlined={!isScreenLessMedium}
                    isTransparent={isScreenLessMedium}
                    onClick={onCancel}
                    className={styles.closeBtn}
                >
                    {getPhrase(SitecoreDictionary.GlobalsButtonsCancelChanges)}
                </Button>
                <Button onClick={onSave} className={styles.closeBtn} isLoading={isLoading}>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsSaveChanges)}
                </Button>
            </div>
        </Popup>
    );
};
