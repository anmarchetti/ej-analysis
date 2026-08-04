import React, { FunctionComponent } from 'react';
import classNames from 'classnames';

import styles from './LoadingState.module.scss';

export const LoadingState: FunctionComponent = () => (
    <div
        className={classNames('wrapper-component-container__inner', styles.container)}
        data-tid='assisted-travel-form-loading-state'
    >
        {['placeholder1', 'placeholder2', 'placeholder3'].map(index => (
            <div key={index} className={styles.contentContainer}>
                <div className={classNames(styles.shimmerTitle, 'placeholder-shimmer')} />
                <div className={classNames(styles.shimmer, styles.shimmerLine2, 'placeholder-shimmer')} />
                <div className={classNames(styles.shimmer, styles.shimmerLine2, 'placeholder-shimmer')} />
                <div className={classNames(styles.shimmer, styles.shimmerLine, 'placeholder-shimmer')} />
            </div>
        ))}
        <div className={styles.buttonContainer}>
            <div className={classNames(styles.shimmerButton, 'placeholder-shimmer')} />
            <div className={classNames(styles.shimmerButton, 'placeholder-shimmer')} />
        </div>
    </div>
);

export default LoadingState;
