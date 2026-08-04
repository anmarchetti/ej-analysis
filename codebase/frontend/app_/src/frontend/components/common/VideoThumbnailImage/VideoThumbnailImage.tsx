import { FC } from 'react';
import classNames from 'classnames';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { FALLBACK_IMAGE_URL, getCloudinaryThumbnailUrl, getVideoThumbnailUrl } from 'frontend/utils/image.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import VideoPlayIcon from 'frontend/components/icons-new/VideoPlay';

import styles from './VideoThumbnailImage.module.scss';

export const VIDEO_THUMBNAIL_IMAGE = 'video-thumbnail-image';

export interface IVideoThumbnailImageProps {
    fallbackImage: string;
    className?: string;
    isSmall?: boolean;
    onClick?: () => void;
    publicId?: string;
    showPlayButton?: boolean;
    videoPlaceholder?: string;
    youtubeId?: string;
}

const VideoThumbnailImage: FC<IVideoThumbnailImageProps> = ({
    className,
    youtubeId,
    fallbackImage,
    videoPlaceholder,
    isSmall,
    onClick,
    showPlayButton,
    publicId,
}) => {
    const { getPhrase, isCloudinaryDisabled } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isCloudinaryDisabled: stores.layoutStore.isCloudinaryDisabled,
    }));

    const imageSrc =
        cmsUrls.media(videoPlaceholder ?? '') ||
        getCloudinaryThumbnailUrl(publicId, isCloudinaryDisabled) ||
        getVideoThumbnailUrl(youtubeId ?? '');

    return (
        <div
            data-tid='video-thumbnail-wrapper'
            className={className}
            style={{
                backgroundImage: `url(${cmsUrls.media(fallbackImage ?? FALLBACK_IMAGE_URL)})`,
            }}
        >
            {isSmall && <div data-tid='video-thumbnail-transparent-wrapper' className={styles.transparentWrapper} />}
            {!!showPlayButton && (
                <button
                    className={classNames(styles.playButton, { [styles.smallPlayButton]: isSmall })}
                    onClick={onClick}
                    data-tid='video-thumbnail-play-icon'
                    aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsYoutubePlayButton)}
                    disabled={isSmall}
                >
                    <VideoPlayIcon className={styles.playIcon} />
                </button>
            )}

            <div
                className={styles.thumbnailImage}
                style={{
                    backgroundImage: `url(${imageSrc})`,
                }}
                data-tid={VIDEO_THUMBNAIL_IMAGE}
            />
        </div>
    );
};

export default VideoThumbnailImage;
