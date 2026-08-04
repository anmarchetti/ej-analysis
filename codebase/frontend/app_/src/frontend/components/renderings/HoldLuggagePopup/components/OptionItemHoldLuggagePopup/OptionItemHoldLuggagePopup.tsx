import { FC } from 'react';

import { cmsUrls } from 'code/endpoints';

import styles from './OptionItemHoldLuggagePopup.module.scss';

export interface IOptionItemHoldLuggagePopupProps {
    icon: string | undefined;
    name: string | undefined;
    shouldRender: boolean;
    children?: React.ReactNode;
}

const OptionItemHoldLuggagePopup: FC<IOptionItemHoldLuggagePopupProps> = ({ children, name, icon, shouldRender }) => {
    if (!shouldRender) {
        return null;
    }

    return (
        <div data-tid='hold-luggage-item' className={styles.holdLuggageItem}>
            <div className={styles.block}>
                {icon && <img src={cmsUrls.media(icon)} className={styles.icon} data-tid='icon' alt='luggage icon' />}
                <span className={styles.name} data-tid='hold-luggage-option-name'>
                    {name}
                </span>
            </div>
            <div className={styles.block}>{children}</div>
        </div>
    );
};

export default OptionItemHoldLuggagePopup;
