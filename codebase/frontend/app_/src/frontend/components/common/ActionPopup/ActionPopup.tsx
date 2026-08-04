import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './ActionPopup.module.scss';

export interface IActionPopupProps {
    onCancel: () => void;
    onContinue: () => void;
    cancelLabel?: string;
    continueLabel?: string;
    isBigWrapper?: boolean;
    isInnerPopup?: boolean;
    onClose?: () => void;
    subtitle?: string;
    title?: string;
}

export const ActionPopup: FC<IActionPopupProps> = ({
    title = '',
    subtitle = '',
    continueLabel = '',
    cancelLabel = '',
    onContinue,
    onCancel,
    isBigWrapper,
    isInnerPopup,
    onClose,
}) => (
    <Popup
        containerClass={styles.cancelPopupContainer}
        dialogClass={classNames(styles.popupDialog, { [styles.bigWrapper]: isBigWrapper })}
        bodyClass={styles.popupBody}
        isInnerPopup={isInnerPopup}
        onClose={onClose}
    >
        <Text data-tid='action-popup-title' field={{ value: title }} tag='h2' className={styles.title} />
        <RichTextWithLinks
            field={{ value: subtitle }}
            tag='p'
            className={styles.content}
            dataId='action-popup-description'
        />
        <div className={styles.footer}>
            <Button data-tid='action-popup-continue' onClick={onContinue} className={styles.continueBtn}>
                <Text field={{ value: continueLabel }} />
            </Button>
            <Button data-tid='action-popup-cancel' onClick={onCancel} className={styles.cancelBtn}>
                <Text field={{ value: cancelLabel }} />
            </Button>
        </div>
    </Popup>
);

export default ActionPopup;
