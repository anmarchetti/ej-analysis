import { FC } from 'react';
import classNames from 'classnames';

import SvgLuxuryGradient from 'frontend/components/icons-new/LuxuryGradient';

import styles from './LuxuryBadge.module.scss';

export interface ILuxuryBadgeProps {
    wrapperClassName?: string;
}

const LuxuryBadge: FC<ILuxuryBadgeProps> = ({ wrapperClassName }) => (
    <div className={classNames(styles.wrapper, wrapperClassName)} data-tid='luxury-badge-icon'>
        <SvgLuxuryGradient className={styles.icon} />
    </div>
);

export default LuxuryBadge;
