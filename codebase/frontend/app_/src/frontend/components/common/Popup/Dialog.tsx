import { CSSProperties, FunctionComponent, ReactNode } from 'react';
import classNames from 'classnames';

import PopupCloseButton from './PopupCloseButton';

type TWrapperType = (children: ReactNode) => JSX.Element;

const defaultWrapper: TWrapperType = children => <>{children}</>;

export interface IDialogProps {
    bodyClass?: string;
    children?: ReactNode;
    contentClass?: string;
    contentStyle?: CSSProperties;
    dataTid?: string;
    dialogClass?: string;
    footerClass?: string;
    footerContent?: JSX.Element;
    isFooterButtonsOnLeft?: boolean;
    onClose?: () => void;
    popupRef?: React.Ref<HTMLDivElement>;
    showCloseButton?: boolean;
    tabs?: JSX.Element | null;
    title?: string;
    wrapper?: TWrapperType;
}

const Dialog: FunctionComponent<IDialogProps> = ({
    bodyClass,
    children,
    contentClass,
    contentStyle,
    dialogClass,
    footerContent,
    footerClass,
    isFooterButtonsOnLeft,
    onClose,
    popupRef,
    showCloseButton,
    tabs,
    title,
    dataTid = 'dialog',
    wrapper = defaultWrapper,
}) => {
    const dialogContent = (
        <div
            className={classNames('popup__content', contentClass)}
            style={contentStyle}
            data-tid={`${dataTid}-content`}
        >
            {showCloseButton && <PopupCloseButton onClick={onClose} />}
            {!!tabs && <div className='popup__tabs'>{tabs}</div>}
            {title && (
                <div className='popup__header'>
                    <h2 className='popup__title'>{title}</h2>
                </div>
            )}
            <div className={classNames('popup__body', bodyClass)}>{children}</div>
            {footerContent && (
                <div className={classNames('popup__footer', footerClass, isFooterButtonsOnLeft && 'start')}>
                    {footerContent}
                </div>
            )}
        </div>
    );

    return (
        <div className={classNames('popup__dialog', dialogClass)} ref={popupRef} data-tid={dataTid}>
            {wrapper(dialogContent)}
        </div>
    );
};

export default Dialog;
