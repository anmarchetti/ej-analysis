import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import FloatingPopup from 'frontend/components/common/FloatingPopup/FloatingPopup';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './ClaimFullOverviewPopup.module.scss';

export type TClaimFullOverviewPopupProps = {
    content: ISitecoreField<string>;
    icon: ISitecoreField<ISitecoreImage>;
    isPopupShown: boolean;
    onClose: () => void;
    title: ISitecoreField<string>;
};

const ClaimFullOverviewPopup: FC<TClaimFullOverviewPopupProps> = ({ isPopupShown, onClose, title, content, icon }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!isPopupShown) {
        return null;
    }

    return (
        <FloatingPopup
            onClose={onClose}
            footerContent={
                <Button onClick={onClose} isOutlined className={styles.closeButton} dataTid='close-button'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
            }
            hasFooterShadow
            contentClass={styles.popupContent}
        >
            <div className={styles.body}>
                <div className={styles.header}>
                    <JSSImage field={icon} className={styles.icon} dataTid='popup-icon' />
                    <Text field={title} className={styles.title} tag='h3' data-tid='popup-title' />
                </div>
                <RichTextWithLinks field={content} className={styles.content} dataId='popup-content' />
            </div>
        </FloatingPopup>
    );
};

export default ClaimFullOverviewPopup;
