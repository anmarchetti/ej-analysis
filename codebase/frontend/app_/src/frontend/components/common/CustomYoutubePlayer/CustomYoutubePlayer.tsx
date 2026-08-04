import { FC, useEffect, useState } from 'react';
import Youtube, { YouTubeEvent } from 'react-youtube';
import classNames from 'classnames';

import useShouldRenderVideo from 'frontend/hooks/useShouldRenderVideo';
import { FALLBACK_IMAGE_URL } from 'frontend/utils/image.utils';
import VideoThumbnailImage from 'frontend/components/common/VideoThumbnailImage/VideoThumbnailImage';

import styles from './CustomYoutubePlayer.module.scss';

export interface IYoutubePlayerProps {
    isBasicPreview: boolean;
    autoPlay?: boolean;
    fallbackImage?: string;
    isDisplayed?: boolean;
    onPlayCallback?: () => void;
    setAutoPlay?: (value: boolean) => void;
    title?: string;
    videoPlaceholder?: string;
    wrapperClassName?: string;
    youtubeVideoId?: string;
}

interface IYoutubePlayer {
    pauseVideo: () => void;
    playVideo: () => void;
}

const youtubePlayerOptions = { height: '100%', width: '100%', playerVars: { rel: 0, mute: 1 } };

const YoutubePlayer: FC<IYoutubePlayerProps> = ({
    youtubeVideoId: videoId,
    wrapperClassName,
    isBasicPreview,
    fallbackImage,
    isDisplayed,
    videoPlaceholder,
    title = '',
    onPlayCallback,
    autoPlay = false,
    setAutoPlay,
}) => {
    const shouldRenderVideo = useShouldRenderVideo();
    const [player, setPlayer] = useState<Nullable<IYoutubePlayer>>(null);
    const [isPreviewShown, setIsPreviewShown] = useState<boolean>(isBasicPreview);
    const [hasVideoBeenPlayed, setHasVideoBeenPlayed] = useState<boolean>(false);

    useEffect(() => {
        if (!player) return;

        if (!isDisplayed) {
            // Prevent react-youtube library from crashing when the player is unmounted while the video is playing
            try {
                player?.pauseVideo();
            } catch (error) {
                console.error('Error pausing video:', error);
            }
        }

        if (isDisplayed && autoPlay) {
            onThumbnailClick();
            setAutoPlay?.(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDisplayed, player, autoPlay]);

    if (!videoId) return null;

    const onVideoEndHandler = (e: YouTubeEvent<number>) => {
        e.target.stopVideo();
        setIsPreviewShown(true);
        setHasVideoBeenPlayed(false);
    };

    const onThumbnailClick = () => {
        setIsPreviewShown(false);
        player?.playVideo();
        setHasVideoBeenPlayed(true);
    };

    return (
        <div className={classNames(styles.player, wrapperClassName)}>
            {isPreviewShown && (
                <VideoThumbnailImage
                    fallbackImage={fallbackImage || FALLBACK_IMAGE_URL}
                    youtubeId={videoId}
                    className={styles.thumbnail}
                    onClick={onThumbnailClick}
                    showPlayButton={shouldRenderVideo && !!player}
                    videoPlaceholder={videoPlaceholder}
                />
            )}

            {shouldRenderVideo && (
                <Youtube
                    className={classNames({
                        [styles.hidden]: !hasVideoBeenPlayed,
                    })}
                    videoId={videoId}
                    opts={youtubePlayerOptions}
                    onReady={e => setPlayer(e.target)}
                    onEnd={onVideoEndHandler}
                    onPlay={onPlayCallback}
                    title={title}
                />
            )}
        </div>
    );
};

export default YoutubePlayer;
