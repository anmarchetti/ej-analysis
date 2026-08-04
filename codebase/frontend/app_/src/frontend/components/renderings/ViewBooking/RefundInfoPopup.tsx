import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import FloatingPopup from 'frontend/components/common/FloatingPopup/FloatingPopup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ExclamationMark from 'frontend/components/icons-new/ExclamationMark';
import { ICreditExpiryPopupItemFields } from 'frontend/components/renderings/ViewBooking/RefundInfo/RefundInfo';

import styles from './RefundInfoPopup.module.scss';

interface IRefundInfoPopupProps {
    ExpiryPopupCTA: ISitecoreField<string>;
    ExpiryPopupCancelCTA: ISitecoreField<string>;
    isOpened: boolean;
    onClickButton: () => void;
    onClosePopup: () => void;
    creditExpiryPopupFields?: ICreditExpiryPopupItemFields;
}

const RefundInfoPopup: FC<IRefundInfoPopupProps> = props => {
    if (!props.isOpened || !props.creditExpiryPopupFields) {
        return null;
    }

    const { Title, Subheading, Text: TextField } = props.creditExpiryPopupFields;

    return (
        <FloatingPopup
            onClose={props.onClosePopup}
            containerClass={styles.container}
            footerClass={styles.footer}
            bodyClass={styles.body}
            footerContent={
                <div className={styles.buttons}>
                    <Button isOutlined onClick={props.onClickButton} data-tid='continue-popup-button'>
                        {props.ExpiryPopupCTA?.value}
                    </Button>
                    <Button onClick={props.onClosePopup} data-tid='close-popup-button'>
                        {props.ExpiryPopupCancelCTA?.value}
                    </Button>
                </div>
            }
        >
            <div className={styles.content}>
                {!!Title?.value && (
                    <div className={styles.titleContainer}>
                        <ExclamationMark className={styles.icon} />
                        <Text field={Title} className={styles.title} tag='h3' />
                    </div>
                )}

                <Text field={Subheading} className={styles.subtitle} tag='h4' />
                <RichTextWithLinks field={TextField} className={styles.text} />
            </div>
        </FloatingPopup>
    );
};

export default RefundInfoPopup;
