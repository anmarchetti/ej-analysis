import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

import styles from './AmendEntityPopup.module.scss';

export interface IAmendEntityPopup {
    children: React.ReactNode;
    onClose: () => void;
    onConfirm: () => void;
    subtitle: ISitecoreField<string>;
    tidPrefix: string;
    title: ISitecoreField<string>;
    contentClassName?: string;
    isConfirmDisabled?: boolean;
}

const AmendEntityPopup: FC<IAmendEntityPopup> = ({
    title,
    subtitle,
    tidPrefix,
    onClose,
    onConfirm,
    children,
    contentClassName,
    isConfirmDisabled,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <Popup bodyClass={styles.popupContainer} dialogClass={styles.popupDialog}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <Text data-tid={tidPrefix + '-title'} tag='h2' field={title} />
                    <Text data-tid={tidPrefix + '-subtitle'} tag='span' field={subtitle} />
                </div>

                <div className={classNames(styles.content, contentClassName)}>{children}</div>
            </div>
            <div className={styles.footer}>
                <Button dataTid={tidPrefix + '-cancel'} onClick={onClose} isMedium isTransparent>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                </Button>
                <Button dataTid={tidPrefix + '-confirm'} onClick={onConfirm} disabled={isConfirmDisabled} isMedium>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsConfirm)}
                </Button>
            </div>
        </Popup>
    );
};

export default AmendEntityPopup;
