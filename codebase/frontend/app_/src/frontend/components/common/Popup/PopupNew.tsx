import { AriaAttributes, FC, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import FocusTrap from 'focus-trap-react';

import useUniqueId from 'frontend/hooks/useUniqueId';
import { lockBodyScroll, unLockBodyScroll } from 'frontend/utils/ui.utils';

import Dialog, { IDialogProps } from './Dialog';

import styles from './PopupNew.module.scss';

export interface IPopupNewProps extends AriaAttributes, Omit<IDialogProps, 'children'> {
    children: ((props?: Omit<IPopupNewProps, 'children'>) => ReactNode) | ReactNode;
    onClose: () => void;
    containerClass?: string;
    dialogClass?: string;
    disableFocusTrap?: boolean;
    footerContent?: JSX.Element;
    fullWidth?: boolean;
    id?: string;
    showCloseButton?: boolean;
}

export const PopupNew: FC<IPopupNewProps> = props => {
    const uniqueId = useUniqueId('popup-dialog');
    const modalOverlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const target = document.getElementById('__next') as HTMLElement;

        lockBodyScroll(target);

        return () => unLockBodyScroll(target);
    }, []);

    const {
        id = uniqueId,
        title,
        fullWidth,
        children,
        onClose,
        footerContent,
        dialogClass,
        showCloseButton,
        containerClass,
        disableFocusTrap,
    } = props;

    const render = (
        <FocusTrap
            active={!disableFocusTrap}
            focusTrapOptions={{
                escapeDeactivates: true,
                clickOutsideDeactivates: !disableFocusTrap,
                initialFocus: `#${id}`,
                fallbackFocus: `#${id}`,
                returnFocusOnDeactivate: false,
                onDeactivate: onClose,
            }}
        >
            <div
                ref={modalOverlayRef}
                tabIndex={-1}
                id={id}
                data-tid={id}
                aria-modal='true'
                aria-label={props['aria-label'] || title}
                aria-labelledby={props['aria-labelledby']}
                className={classNames(styles.popup, containerClass, {
                    [styles.fullWidth]: fullWidth,
                })}
            >
                {typeof children === 'function' ? (
                    children()
                ) : (
                    <Dialog
                        dataTid={`${id}-dialog`}
                        footerContent={footerContent}
                        dialogClass={dialogClass}
                        showCloseButton={showCloseButton}
                        onClose={onClose}
                    >
                        {children}
                    </Dialog>
                )}
            </div>
        </FocusTrap>
    );

    return createPortal(render, document.getElementById('modal-portal-root') as HTMLDivElement);
};

export default PopupNew;
