import { FC } from 'react';
import classNames from 'classnames';

import BoardCardSkeleton from 'frontend/components/common/BoardCardSkeleton/BoardCardSkeleton';

import styles from './AltBoardsPopupSkeleton.module.scss';

const AltBoardsPopupSkeleton: FC = () => (
    <div data-tid='alt-board-popup-skeleton-box'>
        <div className={classNames('placeholder-shimmer', styles.shimmerTitle)} />
        <div className={classNames('placeholder-shimmer', styles.shimmerSubtitle)} />
        <BoardCardSkeleton linesAmount={2} />
        <div className={classNames('placeholder-shimmer', styles.shimmerSubtitle)} />
        <BoardCardSkeleton linesAmount={0} />
        <BoardCardSkeleton />
        <BoardCardSkeleton linesAmount={2} />
    </div>
);

export default AltBoardsPopupSkeleton;
