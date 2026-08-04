import React, { FunctionComponent } from 'react';
import classNames from 'classnames';

import styles from './LoadingState.module.scss';

export const LoadingState: FunctionComponent<{ useMasonryStyle?: boolean }> = ({ useMasonryStyle }) => (
    <div
        className={classNames(styles.sizeContainer, useMasonryStyle && styles.masonry, 'no-print')}
        data-tid='cancel-booking-banner-loading'
    >
        <div className={styles.container}>
            <div className={styles.contentContainer}>
                <div className={classNames(styles.shimmerTitle, 'placeholder-shimmer')} />
                <div className={classNames(styles.shimmer, styles.shimmerLine, 'placeholder-shimmer')} />
                <div className={classNames(styles.shimmer, styles.shimmerLine2, 'placeholder-shimmer')} />
            </div>
            <div className={classNames(styles.shimmerButton, 'placeholder-shimmer')} />
        </div>
    </div>
);

export default LoadingState;
