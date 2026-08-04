import { FC } from 'react';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './PromotingBanner.module.scss';

export interface IPromotingBannerProps {
    color: string;
    children?: React.ReactNode;
    textContent?: ISitecoreField<string>;
}

export const PromotingBanner: FC<IPromotingBannerProps> = ({ color, textContent, children }) => {
    const backgroundColor = `${color}1A`;

    return (
        <div
            style={{ background: backgroundColor, borderColor: color }}
            className={styles.banner}
            data-tid='promoting-banner-container'
        >
            {textContent && (
                <div style={{ color: color }} data-tid='promoting-banner-text-content'>
                    <RichTextWithLinks field={textContent} tag='div' className={styles.text} />
                </div>
            )}
            {children}
        </div>
    );
};

export default PromotingBanner;
