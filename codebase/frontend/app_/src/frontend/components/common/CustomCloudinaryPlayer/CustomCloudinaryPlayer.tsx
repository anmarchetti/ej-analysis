import { FC } from 'react';
import classNames from 'classnames';

import VideoThumbnailImage from 'frontend/components/common/VideoThumbnailImage/VideoThumbnailImage';

import useCloudinaryPlayer, { ICloudinaryPlayerData, ICloudinaryPreviewData } from './CustomCloudinaryPlayer.utils';

import 'cloudinary-video-player/cld-video-player.min.css';
import styles from './CustomCloudinaryPlayer.module.scss';

export interface ICloudinaryPlayerProps {
    cloudinaryVideoSrc: string;
    isBasicPreview: boolean;
    autoPlay?: boolean;
    fallbackImage?: string;
    isDisplayed?: boolean;
    onPlayCallback?: () => void;
    setAutoPlay?: (value: boolean) => void;
    thumbnailClassName?: string;
    videoClassName?: string;
    videoPlaceholder?: string;
    wrapperClassName?: string;
}

const CloudinaryPlayer: FC<ICloudinaryPlayerProps> = ({
    cloudinaryVideoSrc: publicId,
    wrapperClassName,
    thumbnailClassName,
    videoClassName,
    isDisplayed,
    isBasicPreview,
    fallbackImage,
    videoPlaceholder,
    onPlayCallback,
    autoPlay = false,
    setAutoPlay,
}) => {
    const { preview, player } = useCloudinaryPlayer({
        isDisplayed,
        isBasicPreview,
        autoPlay,
        setAutoPlay,
        publicId,
        fallbackImage,
        videoPlaceholder,
        onPlayCallback,
    });

    if (!publicId) return null;

    const { isPreviewShown, ...previewProps } = preview as ICloudinaryPreviewData;
    const { isPlayerShown, playerRef, ...playerProps } = player as ICloudinaryPlayerData;

    return (
        <div className={wrapperClassName}>
            {isPreviewShown && (
                <VideoThumbnailImage className={classNames(styles.thumbnail, thumbnailClassName)} {...previewProps} />
            )}

            {isPlayerShown && (
                <div className={styles.playerWrapper}>
                    <video
                        ref={playerRef}
                        id={publicId}
                        className={classNames('cld-video-player cld-fluid', videoClassName)}
                        {...playerProps}
                    >
                        <track src='' kind='captions' default />
                    </video>
                </div>
            )}
        </div>
    );
};

export default CloudinaryPlayer;
