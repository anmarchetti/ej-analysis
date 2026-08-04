import { FunctionComponent, ReactNode } from 'react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { Popup } from 'frontend/components/common/Popup';

import styles from './CrisisBannerPopup.module.scss';

export interface ICrisisBannerPopupProps {
    content: ReactNode;
    ctaCloseButtonLabel: ISitecoreField<string>;
    ctaCloseButtonScreenReaderLabel: ISitecoreField<string>;
    onClose: () => void;
    open: boolean;
}

export const CrisisBannerPopup: FunctionComponent<ICrisisBannerPopupProps> = ({
    open,
    onClose,
    ctaCloseButtonLabel,
    ctaCloseButtonScreenReaderLabel,
    content,
}) => {
    const isMobile = useMobileViewport();

    if (isMobile) {
        return (
            <Drawer open={open} dataTid='crisis-banner-drawer'>
                {content}
                <div data-tid='drawer-actions' className='drawer__actions'>
                    <Button
                        isMedium
                        onClick={onClose}
                        isTransparent
                        aria-label={ctaCloseButtonScreenReaderLabel?.value}
                        dataTid='crisis-banner-close-mobile-btn'
                    >
                        {ctaCloseButtonLabel?.value}
                    </Button>
                </div>
            </Drawer>
        );
    }

    if (!open) {
        return null;
    }

    return (
        <Popup
            onClose={onClose}
            bodyClass={styles.popupBodyClass}
            id='crisis-banner-popup'
            footerContent={
                <Button
                    isOutlined
                    onClick={onClose}
                    aria-label={ctaCloseButtonScreenReaderLabel?.value}
                    dataTid='crisis-banner-close-btn'
                >
                    {ctaCloseButtonLabel?.value}
                </Button>
            }
        >
            {content}
        </Popup>
    );
};

export default CrisisBannerPopup;
