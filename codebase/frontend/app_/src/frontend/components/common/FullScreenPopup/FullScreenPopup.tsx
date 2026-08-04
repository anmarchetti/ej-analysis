import { FC, useEffect } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { setBodyOverflow } from 'frontend/utils/ui.utils';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import IconChevronLeft from 'frontend/components/icons/ChevronLeft';

import styles from './FullScreenPopup.module.scss';

interface IFullScreenPopupFields {
    BackToLabel: ISitecoreField<string>;
    BtnCancel: ISitecoreField<string>;
}

export interface IFullScreenPopupProps {
    children: React.ReactNode;
    fields: IFullScreenPopupFields;
    isInitialized: boolean;
    isMobile: boolean;
    onClose: () => void;
    ariaLabel?: string;
    disableReturnFocusOnUnmount?: boolean;
    isInnerPopup?: boolean;
    navigationActionBlock?: JSX.Element;
    popupBarContent?: JSX.Element;
}

export const FullScreenPopup: FC<IFullScreenPopupProps> = ({
    navigationActionBlock,
    children,
    fields,
    onClose,
    isMobile,
    isInnerPopup,
    popupBarContent,
    isInitialized,
    disableReturnFocusOnUnmount,
    ariaLabel,
}) => {
    const { BackToLabel, BtnCancel } = fields;

    useEffect(() => {
        setBodyOverflow('hidden');

        return () => setBodyOverflow('');
    }, [isInitialized]); // fix bug when scroll appeared after OverlaySpinner is unmounted

    return (
        <Popup
            aria-label={ariaLabel}
            removeDefaultClasses
            isCentered={false}
            containerClass='popup popup--opened'
            dialogClass={styles.popupDialog}
            contentClass={styles.popupContent}
            bodyClass={styles.popupBody}
            isInnerPopup={isInnerPopup} // Prevent body locking which causes visual issue on iOS EJH-16266
            disableReturnFocusOnUnmount={disableReturnFocusOnUnmount}
        >
            <div className={classNames(styles.popupBar, isMobile && styles.popupBarMobile)}>
                {popupBarContent}
                <div className={styles.popupBarContainer}>
                    {!isMobile ? (
                        <Button onClick={onClose} isText className={styles.popupBarClose} data-tid='popup-back-btn'>
                            <IconChevronLeft />
                            <Text field={BackToLabel} />
                        </Button>
                    ) : (
                        <Button
                            onClick={onClose}
                            isText
                            className={classNames(styles.popupBarClose, styles.popupBarCloseMobile)}
                            data-tid='popup-cancel-btn'
                        >
                            <Text field={BtnCancel} />
                        </Button>
                    )}
                    {navigationActionBlock}
                </div>
            </div>
            <div className={styles.mainContent}>{children}</div>
        </Popup>
    );
};
export default FullScreenPopup;
