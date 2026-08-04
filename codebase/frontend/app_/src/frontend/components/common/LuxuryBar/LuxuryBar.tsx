import React from 'react';
import classNames from 'classnames';

import commonStyles from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper.module.scss';
import SvgLuxuryGradient from 'frontend/components/icons-new/LuxuryGradient';

import styles from './LuxuryBar.module.scss';

interface ILuxuryBarProps {
    label: string;
}

const LuxuryBar: React.FC<ILuxuryBarProps> = ({ label }) => (
    <div className={classNames(commonStyles.luxuryBanner, styles.luxuryBar)} data-tid='luxury-bar'>
        <div className={styles.luxuryBarWrapper}>
            <SvgLuxuryGradient />
            <span>{label}</span>
        </div>
    </div>
);

export default LuxuryBar;
