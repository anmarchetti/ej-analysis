import { FC } from 'react';
import classNames from 'classnames';

import boardCardStyles from 'frontend/components/renderings/BoardTypes/components/BoardCard/BoardCard.module.scss';

import styles from './BoardCardSkeleton.module.scss';

export interface IBoardCardSkeletonProps {
    bodyClassName?: string;
    className?: string;
    height?: number;
    isSelected?: boolean;
    isSpoiler?: boolean;
    linesAmount?: number;
    titleClassName?: string;
}

const DEFAULT_LINES_AMOUNT = 1;

const BoardCardSkeleton: FC<IBoardCardSkeletonProps> = ({
    isSelected = false,
    isSpoiler = false,
    height,
    className,
    bodyClassName,
    titleClassName,
    linesAmount = DEFAULT_LINES_AMOUNT,
}: IBoardCardSkeletonProps) => {
    const contentLines = [
        <div key='content_0'>
            <span className={classNames('placeholder-shimmer', styles.shimmerMiddle)} />
            <span className={classNames('placeholder-shimmer', styles.shimmerMiddle)} />
        </div>,
        <div key='content_1'>
            <span className={classNames('placeholder-shimmer', styles.shimmerMiddle, styles.shimmerSmaller)} />
            <span className={classNames('placeholder-shimmer', styles.shimmerMiddle, styles.shimmerWider)} />
        </div>,
    ];

    return (
        <div className='board-skeleton-container'>
            <div
                className={classNames(styles.card, boardCardStyles.card, className, {
                    [styles.current]: isSelected,
                    [styles.spoiler]: isSpoiler,
                    [boardCardStyles.spoiler]: isSpoiler,
                })}
                style={height ? { height: `${height}px` } : {}}
                data-tid='board-skeleton-box'
            >
                <div className={classNames(boardCardStyles.content, styles.content)}>
                    <div className={classNames(styles.title, titleClassName)}>
                        <div
                            className={classNames('placeholder-shimmer', styles.icon)}
                            data-tid='board-skeleton-icon'
                        />
                        <div className={classNames('placeholder-shimmer', styles.shimmerTitle)} />
                    </div>
                    <div data-tid='board-skeleton-content' className={classNames(styles.body, bodyClassName)}>
                        {contentLines.slice(0, linesAmount)}
                    </div>
                    <div
                        data-tid='board-skeleton-btn'
                        className={classNames(
                            'placeholder-shimmer',
                            boardCardStyles.childrenContainer,
                            styles.shimmerBtn,
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export default BoardCardSkeleton;
