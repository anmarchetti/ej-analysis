import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import { Popup } from 'frontend/components/common/Popup';

import styles from './ComparePriceInfoPopup.module.scss';

interface IComparePriceInfoPopupProps {
    onClose: () => void;
    shouldShow: boolean;
    type: string;
    icon?: ISitecoreField<ISitecoreImage>;
    isSmall?: boolean;
    subtitle?: ISitecoreField<string>;
    title?: ISitecoreField<string>;
}

const ComparePriceInfoPopup: FC<IComparePriceInfoPopupProps> = ({
    onClose,
    shouldShow,
    type,
    subtitle,
    title,
    icon,
    isSmall,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!shouldShow) {
        return null;
    }

    return (
        <Popup
            isCentered={false}
            containerClass={classNames(styles.infoPopup, isSmall && styles.small)}
            contentClass={classNames(styles.content)}
            footerContent={<Button onClick={onClose}>{getPhrase(SitecoreDictionary.GlobalsButtonsClose)}</Button>}
            overlayClass={classNames(styles.overlay, styles.priority)}
            withPortal
            disableOutsideClick
        >
            <JSSImage dataTid={`${type}-popup-icon`} field={icon} alt={`${type} icon`} className={styles.icon} />
            <Text data-tid={`${type}-popup-title`} tag='div' className={styles.title} field={title} />
            <Text data-tid={`${type}-popup-subtitle`} tag='div' className={styles.subtitle} field={subtitle} />
        </Popup>
    );
};

export default ComparePriceInfoPopup;
