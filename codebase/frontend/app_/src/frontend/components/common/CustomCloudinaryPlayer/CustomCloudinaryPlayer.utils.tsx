import { useEffect, useRef, useState } from 'react';
import { Cloudinary } from 'cloudinary-video-player';

import useShouldRenderVideo from 'frontend/hooks/useShouldRenderVideo';
import { FALLBACK_IMAGE_URL } from 'frontend/utils/image.utils';

export interface IUseCloudinaryPlayerProps {
    isBasicPreview: boolean;
    publicId: string;
    autoPlay?: boolean;
    fallbackImage?: string;
    isDisplayed?: boolean;
    onPlayCallback?: () => void;
    setAutoPlay?: (value: boolean) => void;
    videoPlaceholder?: string;
}

export interface ICloudinaryPreviewData {
    fallbackImage: string;
    isPreviewShown: boolean;
    onClick: () => void;
    publicId: string;
    showPlayButton: boolean;
    videoPlaceholder?: string;
}

export interface ICloudinaryPlayerData {
    isPlayerShown: boolean;
    onEnded: ({ target }) => void;
    playerRef: React.RefObject<HTMLVideoElement>;
}

export interface IUseCloudinaryPlayerData {
    player?: ICloudinaryPlayerData;
    preview?: ICloudinaryPreviewData;
}

const DEFAULT_VIDEO_WIDTH = 1280;

export const initPlayer = async ({ cloudinaryRef, playerRef, publicId, setVideo, onPlayCallback }): Promise<void> => {
    if (cloudinaryRef.current) return;

    cloudinaryRef.current = await import('cloudinary-video-player');

    const player = cloudinaryRef.current.videoPlayer(playerRef.current, {
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        secure: true,
        controls: true,
        bigPlayButton: false,
        muted: true,
    });

    player.videojs.on('ready', e => {
        setVideo(e.target.player);
    });

    player.videojs.on('play', () => {
        onPlayCallback?.();
    });

    player.on('touchstart', e => {
        if (e.target instanceof HTMLVideoElement) {
            if (e.target.paused) {
                e.target.play();
            } else {
                e.target.pause();
            }
        }
    });

    player.source(publicId, {
        transformation: {
            crop: 'limit',
            width: DEFAULT_VIDEO_WIDTH,
            fetch_format: 'auto',
            quality: 'auto',
        },
    });
};

const useCloudinaryPlayer = ({
    isBasicPreview,
    isDisplayed,
    autoPlay,
    setAutoPlay,
    publicId,
    videoPlaceholder,
    fallbackImage = FALLBACK_IMAGE_URL,
    onPlayCallback,
}: IUseCloudinaryPlayerProps): IUseCloudinaryPlayerData => {
    const [isPreviewShown, setIsPreviewShown] = useState<boolean>(isBasicPreview);
    const [video, setVideo] = useState<HTMLVideoElement | null>(null);
    const playerRef = useRef<HTMLVideoElement>(null);
    const cloudinaryRef = useRef<Cloudinary | null>(null);

    const cookiesAccepted = useShouldRenderVideo();

    useEffect(() => {
        if (cookiesAccepted) {
            initPlayer({ cloudinaryRef, playerRef, publicId, setVideo, onPlayCallback });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cookiesAccepted]);

    useEffect(() => {
        if (!video) return;

        if (!isDisplayed) {
            video.pause();

            return;
        }

        if (isDisplayed && autoPlay) {
            setIsPreviewShown(false);

            video.play();

            // turn off autoplay after the first play
            setAutoPlay?.(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDisplayed, video, autoPlay]);

    if (!publicId) return {};

    return {
        preview: {
            isPreviewShown,
            onClick: (): void => {
                setIsPreviewShown(false);
                video?.play();
            },
            showPlayButton: cookiesAccepted && !!video,
            videoPlaceholder,
            fallbackImage,
            publicId,
        },
        player: {
            isPlayerShown: cookiesAccepted,
            onEnded: ({ target: video }): void => {
                video.pause();
                video.currentTime = 0;

                setIsPreviewShown(true);
            },
            playerRef,
        },
    };
};

export default useCloudinaryPlayer;
