import { createContext, FC, useMemo, useState } from 'react';
import classNames from 'classnames';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { Popup } from 'frontend/components/common/Popup';

import styles from './FloatingPopup.module.scss';

interface IFloatingPopupContext {
    onClose: () => void;
    setTranslateY: (translateY: number) => void;
}

export const FloatingPopupContext = createContext({} as IFloatingPopupContext);

export interface IFloatingPopupProps {
    children: React.ReactNode;
    onClose: () => void;
    bodyClass?: string;
    containerClass?: string;
    contentClass?: string;
    disableOutsideClick?: boolean;
    footerClass?: string;
    footerContent?: JSX.Element;
    hasFooterShadow?: boolean;
    id?: string;
    swipeable?: boolean;
}

// On desktop popups acts as usual, on mobile it floats from the bottom and covers not full height of the screen
const FloatingPopup: FC<IFloatingPopupProps> = ({
    onClose,
    id = 'floating-popup',
    children,
    hasFooterShadow = false,
    footerContent,
    contentClass,
    bodyClass,
    footerClass,
    swipeable,
    containerClass,
    disableOutsideClick,
}) => {
    const isMobile = useMobileViewport();
    const [translateY, setTranslateY] = useState(0);

    const value = useMemo(() => ({ setTranslateY, onClose }), [setTranslateY, onClose]);

    return (
        <Popup
            onClose={onClose}
            contentClass={classNames(styles.content, swipeable && styles.swipeable, contentClass)}
            contentStyle={{ transform: `translateY(${translateY}px)` }}
            overlayClass={styles.overlay}
            bodyClass={classNames(styles.body, bodyClass)}
            footerClass={classNames(styles.footer, footerClass, hasFooterShadow && styles.footerShadow)}
            isCentered={!isMobile}
            id={id}
            footerContent={footerContent}
            containerClass={containerClass}
            disableOutsideClick={disableOutsideClick}
        >
            <FloatingPopupContext.Provider value={value}>{children}</FloatingPopupContext.Provider>
        </Popup>
    );
};

export default FloatingPopup;
