import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import FloatingPopup from 'frontend/components/common/FloatingPopup/FloatingPopup';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import ExclamationMark from 'frontend/components/icons-new/ExclamationMark';

import styles from './ResetPasswordErrorPopup.module.scss';

export interface IResetPasswordErrorPopupProps {
    onClose: () => void;
}

const ResetPasswordErrorPopup: FC<IResetPasswordErrorPopupProps> = ({ onClose }) => {
    const { getPhrase, isGuestDetailsPage } = useStore(({ layoutStore }: IHolidaysStores) => ({
        getPhrase: layoutStore.getPhrase,
        isGuestDetailsPage: layoutStore.isGuestDetailsPage,
    }));

    return (
        <FloatingPopup
            onClose={onClose}
            contentClass={styles.content}
            bodyClass={styles.body}
            footerClass={styles.footer}
            footerContent={
                <Button
                    onClick={onClose}
                    type='button'
                    dataTid='reset-password-popup-primary-cta'
                    className={styles.primaryButton}
                >
                    {isGuestDetailsPage
                        ? getPhrase(SitecoreDictionary.ResetPasswordErrorPopupBookingButton)
                        : getPhrase(SitecoreDictionary.ResetPasswordErrorPopupButton)}
                </Button>
            }
        >
            <div className={styles.heading} data-tid='reset-password-popup-heading'>
                <div className={styles.iconWrapper}>
                    <ExclamationMark className={styles.titleIcon} />
                </div>

                <h2 className={styles.title} data-tid='reset-password-popup-title'>
                    {isGuestDetailsPage
                        ? getPhrase(SitecoreDictionary.ResetPasswordErrorPopupBookingTitle)
                        : getPhrase(SitecoreDictionary.ResetPasswordErrorPopupTitle)}
                </h2>
            </div>

            <RichTextDictionary
                content={
                    isGuestDetailsPage
                        ? getPhrase(SitecoreDictionary.ResetPasswordErrorPopupBookingDescription)
                        : getPhrase(SitecoreDictionary.ResetPasswordErrorPopupDescription)
                }
                tag='div'
                className={styles.subtext}
                dataId='reset-password-popup-description'
            />
        </FloatingPopup>
    );
};

export default observer(ResetPasswordErrorPopup);
