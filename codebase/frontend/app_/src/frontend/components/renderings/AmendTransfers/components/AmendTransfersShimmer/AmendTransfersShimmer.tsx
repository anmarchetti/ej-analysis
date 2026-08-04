import { FC } from 'react';
import classNames from 'classnames';

import BoardCardSkeleton from 'frontend/components/common/BoardCardSkeleton/BoardCardSkeleton';

import styles from './AmendTransfersShimmer.module.scss';

const AmendTransfersShimmer: FC = () => (
    <div data-tid='amend-transfer-skeleton'>
        <BoardCardSkeleton className={styles.card} />
        <div className={classNames(styles.title, 'placeholder-shimmer')} />

        <BoardCardSkeleton className={styles.card} />
        <BoardCardSkeleton className={styles.card} />
    </div>
);

export default AmendTransfersShimmer;
