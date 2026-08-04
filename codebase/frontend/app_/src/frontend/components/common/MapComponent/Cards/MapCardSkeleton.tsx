import { FC } from 'react';
import classNames from 'classnames';

import SvgCross from 'frontend/components/icons-new/Cross';

import styles from './MapCard.module.scss';

interface IMapCardSkeletonProps {
    onClose: () => void;
}

const MapCardSkeleton: FC<IMapCardSkeletonProps> = ({ onClose }) => (
    <div className={styles.skeleton}>
        <div className={styles.head}>
            <div className={classNames(styles.line, 'placeholder-shimmer')} />

            <button onClick={onClose}>
                <SvgCross />
            </button>
        </div>

        <div className={styles.content}>
            <div className={classNames(styles.thumbnail, 'placeholder-shimmer')} />

            <div className={styles.lines}>
                <div className={classNames(styles.line, 'placeholder-shimmer')} />
                <div className={classNames(styles.line, 'placeholder-shimmer')} />
                <div className={classNames(styles.line, 'placeholder-shimmer')} />
            </div>
        </div>
    </div>
);

export default MapCardSkeleton;
