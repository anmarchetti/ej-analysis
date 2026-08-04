import React from 'react';
import classNames from 'classnames';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import RoomSkeleton from 'frontend/components/common/Room/RoomSkeleton/RoomSkeleton';

import styles from './AmendRoomSkeleton.module.scss';

export const MOBILE_HEIGHT = 165;
export const DESKTOP_HEIGHT = 240;

const AmendRoomSkeleton: React.FC = () => {
    const isMobile = useMobileViewport();
    const roomSkeletonHeight = isMobile ? MOBILE_HEIGHT : DESKTOP_HEIGHT;

    const skeletonProps = {
        containerClass: styles.container,
        contentClassName: styles.content,
        height: roomSkeletonHeight,
        contentLines: 3,
    };

    return (
        <div>
            <RoomSkeleton {...skeletonProps} />
            <div className={classNames('placeholder-shimmer', styles.roomsDivider)} />
            <RoomSkeleton {...skeletonProps} />
        </div>
    );
};

export default AmendRoomSkeleton;
