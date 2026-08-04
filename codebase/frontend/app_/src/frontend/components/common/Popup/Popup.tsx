import React, { AriaAttributes, FC, PropsWithChildren, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { FocusTarget } from 'focus-trap';
import FocusTrap from 'focus-trap-react';

import useUniqueId from 'frontend/hooks/useUniqueId';
import { pick } from 'frontend/utils/object.utils';
import { lockBodyScroll, unLockBodyScroll } from 'frontend/utils/ui.utils';
import { KeyboardKey } from 'models/enum/KeyboardKey';

import Dialog, { IDialogProps } from './Dialog';
import PopupCloseButton from './PopupCloseButton';

export interface IPopupProps extends AriaAttributes, IDialogProps {
    containerClass?: string;
    disableOutsideClick?: boolean;
    disableReturnFocusOnUnmount?: boolean;
    id?: string;
    initialFocus?: FocusTarget;
    isCentered?: boolean;
    isCloseButtonOutside?: boolean;
    isContentCentered?: boolean;
    isFullWidth?: boolean;
    isInnerPopup?: boolean;
    isSmall?: boolean;
    isToastPopup?: boolean;
    overlayClass?: string;
    removeDefaultClasses?: boolean;
    withPortal?: boolean;
    wrapper?: (children: React.ReactNode) => JSX.Element;
}

export const Popup: FC<PropsWithChildren<IPopupProps>> = props => {
    const {
        id,
        isInnerPopup,
        isToastPopup,
        disableOutsideClick,
        disableReturnFocusOnUnmount,
        initialFocus,
        title,
        removeDefaultClasses,
        isSmall,
        isContentCentered,
        tabs,
        isCentered = true,
        isFullWidth,
        containerClass,
        bodyClass,
        isCloseButtonOutside,
        children,
        onClose,
        overlayClass,
    } = props;
    const modalOverlayRef = useRef<HTMLDivElement>(null);
    const uniqueId = useUniqueId('popup-dialog');
    const popupID = id || uniqueId;
    const invokingElement = useRef<Nullable<HTMLElement>>(document.activeElement as HTMLElement);
    const returnFocusToInvokingElement = useRef<boolean>(!disableReturnFocusOnUnmount);

    useEffect(() => {
        // do not fix scroll for popups inside other popups
        if (!isInnerPopup && !isToastPopup) {
            lockBodyScroll();
        }

        // add event listener for check escape press
        document.addEventListener('keydown', onPressEscape, false);

        return () => {
            if (document.querySelectorAll('.popup--opened').length < 2 && !isInnerPopup && !isToastPopup) {
                // if no popups opened except this
                unLockBodyScroll();
            }

            document.removeEventListener('keydown', onPressEscape);

            // Return focus to element that invoked Popup
            setFocusToInvokingElement();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        returnFocusToInvokingElement.current = !disableReturnFocusOnUnmount;
    }, [disableReturnFocusOnUnmount]);

    const onPressEscape = (e: KeyboardEvent) => {
        if (e.key === KeyboardKey.ESCAPE || e.key === KeyboardKey.ESC) {
            onClosePopup();
        }
    };

    const onClickOutside = (e: React.MouseEvent<HTMLElement>) => {
        // check for click on overlay
        if (e.target === e.currentTarget && !isToastPopup && !disableOutsideClick) {
            onClosePopup();
        }
    };

    const onClosePopup = () => {
        //Using for imitation cancel button click if we don't have a onClose props and close logic include in footer component
        const cancelBtn = modalOverlayRef?.current?.querySelector(
            'button[data-tid=cancel-button]',
        ) as HTMLButtonElement;
        onClose?.() || cancelBtn?.click();
    };

    const setFocusToInvokingElement = () => {
        if (returnFocusToInvokingElement.current) {
            setTimeout(() => invokingElement?.current?.focus?.());
        }
    };

    const dialogProps = pick(props, [
        'bodyClass',
        'contentClass',
        'contentStyle',
        'dialogClass',
        'footerContent',
        'isFooterButtonsOnLeft',
        'onClose',
        'popupRef',
        'showCloseButton',
        'tabs',
        'title',
        'footerClass',
        'wrapper',
    ]);

    /* For a11y on tabbing the focus shouldn’t go out of the modal. FocusTrap is used for it. */
    const render = (
        <FocusTrap
            focusTrapOptions={{
                // Deactivate focus trap on click outside or Escape key,
                // else all outside clicks will be blocked and impossible to close other popups (EJH-12195)
                escapeDeactivates: true,
                clickOutsideDeactivates: true,
                initialFocus: initialFocus || `#${popupID}`,
                fallbackFocus: `#${popupID}`,

                // Returning focus implemented by ourselves, because lib doesn't allow to update the option after component mounting
                returnFocusOnDeactivate: false,
                tabbableOptions: {
                    getShadowRoot: true,
                },
            }}
        >
            {/* Don't use Fragment as child, because it breaks FocusTrap */}
            <div
                tabIndex={-1}
                id={popupID}
                data-tid={popupID}
                ref={modalOverlayRef}
                role={isToastPopup ? 'alertdialog' : 'dialog'}
                aria-modal='true'
                aria-label={props['aria-label'] || title}
                aria-labelledby={props['aria-labelledby']}
                className={classNames(
                    !removeDefaultClasses && 'popup popup--opened',
                    isSmall && 'popup--small',
                    isContentCentered && 'popup--text-center',
                    !!tabs && 'popup--with-tabs',
                    isCentered && 'popup--centered',
                    isFullWidth && 'popup--full-width',
                    containerClass,
                    bodyClass,
                )}
                onClick={onClickOutside}
            >
                {isCloseButtonOutside && <PopupCloseButton onClick={onClose} />}
                <Dialog {...dialogProps} dataTid={`${popupID}-dialog`}>
                    {children}
                </Dialog>
            </div>
        </FocusTrap>
    );

    return (
        <>
            {props.withPortal
                ? createPortal(render, document.getElementById('modal-portal-root') as HTMLDivElement)
                : render}
            {!isToastPopup && (
                <div
                    className={classNames('popup-overlay', overlayClass)}
                    data-tid='popup-overlay'
                    onClick={onClickOutside}
                />
            )}
        </>
    );
};
