import classNames from 'classnames';

import roomStyles from 'frontend/components/renderings/RoomTypes/components/Room.module.scss';

import styles from './RoomSkeleton.module.scss';

interface IRoomSkeletonProps {
    containerClass?: string;
    contentClassName?: string;
    contentLines?: number;
    height?: number;
    isLarge?: boolean;
}

const RoomSkeleton = ({ isLarge, height, contentLines = 1, contentClassName, containerClass }: IRoomSkeletonProps) => {
    const shimmerLines: JSX.Element[] = [];
    for (let i = 0; i < contentLines; i++) {
        shimmerLines.push(<div key={i} className={`placeholder-shimmer content-line ${styles.shimmerMiddle}`} />);
    }

    return (
        <div className='room-skeleton-container'>
            <div
                className={classNames(roomStyles.card, styles.card, containerClass, {
                    [roomStyles.selected]: isLarge,
                    [styles.large]: isLarge,
                })}
                data-tid='room-skeleton-box'
            >
                <div
                    className={`col-12 col-md-4 col-lg-3 placeholder-shimmer ${roomStyles.img} ${styles.img}`}
                    style={height ? { height: `${height}px` } : {}}
                />
                <div className={`col-md-8 col-lg-9 col-12 ${roomStyles.details} ${styles.details}`}>
                    <div className={classNames('placeholder-shimmer', styles.shimmer, styles.shimmerTop)} />
                    <div className={classNames('placeholder-shimmer', styles.shimmerLarge)} />
                    <div className={classNames('row', contentClassName)}>
                        <div className='col-lg-9 shimmer-content'>
                            {shimmerLines}
                            {isLarge && <div className={`placeholder-shimmer ${styles.shimmerMiddle}`} />}
                        </div>
                        <div className='col-lg-3 mt-auto'>
                            <div className={`placeholder-shimmer ms-auto me-auto me-md-0 ${styles.shimmerBtn}`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomSkeleton;
