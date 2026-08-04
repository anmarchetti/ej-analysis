import React from 'react';
import classNames from 'classnames';

import BoardCardSkeleton from 'frontend/components/common/BoardCardSkeleton/BoardCardSkeleton';

import styles from './AmendBoardSkeleton.module.scss';

const AmendBoardSkeleton: React.FC = () => {
    const skeletonProps = {
        bodyClassName: styles.body,
        className: styles.card,
        linesAmount: 2,
    };

    return (
        <div className={styles.container} data-tid='amend-board-skeleton-box'>
            <BoardCardSkeleton {...skeletonProps} />
            <div className={classNames('placeholder-shimmer', styles.roomsDivider)} />
            <BoardCardSkeleton {...skeletonProps} />
        </div>
    );
};

export default AmendBoardSkeleton;
