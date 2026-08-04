import { useState } from 'react';
import classNames from 'classnames';

import useShouldRenderVideo from 'frontend/hooks/useShouldRenderVideo';
import useStore from 'frontend/hooks/useStore';
import { getSitecoreImageBackgroundStyles } from 'frontend/utils/getImage';
import { booleanToStringNumber } from 'frontend/utils/url.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './MediaVideo.module.scss';

type TMediaVideoFields = {
    IsFullScreenAvailable: ISitecoreField<boolean>;
    IsHoverEffectEnabled: ISitecoreField<boolean>;
    IsMuted: ISitecoreField<boolean>;
    PlayIcon?: ISitecoreField<ISitecoreImage>;
    Preview?: ISitecoreField<ISitecoreImage>;
    ShowPreviewOnMobile?: ISitecoreField<boolean>;
    YouTubeVideoCode?: ISitecoreField<string>;
};

export type TMediaVideoParams = {
    ClassName: string;
};

export type TMediaVideoProps = ISitecoreComponent<TMediaVideoFields, TMediaVideoParams>;

export const MediaVideo = ({ fields, params }: TMediaVideoProps) => {
    const shouldRenderVideo = useShouldRenderVideo();

    const { isEditMode, isScreenLessMedium } = useStore(stores => ({
        isEditMode: stores.layoutStore.isEditMode,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
    }));

    const {
        YouTubeVideoCode,
        Preview,
        PlayIcon,
        IsHoverEffectEnabled,
        IsFullScreenAvailable,
        IsMuted,
        ShowPreviewOnMobile,
    } = fields || {};
    const className = params?.ClassName ?? '';
    const embedCode = YouTubeVideoCode?.value;
    const hasPreviewImage = !!Preview?.value?.src;
    const hasPlayIconImage = !!PlayIcon?.value?.src;
    const hasPreviewAndPlayIconImages = hasPreviewImage && hasPlayIconImage;
    const isPreviewAvailable = hasPreviewAndPlayIconImages && (!isScreenLessMedium || ShowPreviewOnMobile?.value);

    const [isPreviewShown, setIsPreviewShown] = useState(isPreviewAvailable);

    const showPreviewHoverAnimation = isPreviewShown && !!IsHoverEffectEnabled?.value;
    const shouldAutoplay = isPreviewAvailable && !isPreviewShown;

    const renderPreviewBg = () =>
        isEditMode ? (
            <JSSImage field={Preview} />
        ) : (
            <div
                className={styles.preview}
                style={getSitecoreImageBackgroundStyles(Preview, MediaSize.Large, isScreenLessMedium, isEditMode)}
            />
        );

    const renderPlayIcon = () => {
        let additionalProps = {};

        if (!isEditMode) {
            additionalProps = {
                className: styles.playIcon,
                onClick: () => setIsPreviewShown(false),
            };
        }

        return <JSSImage field={PlayIcon} {...additionalProps} />;
    };

    const renderPreview = () =>
        isPreviewShown && (
            <>
                {renderPlayIcon()}
                {renderPreviewBg()}
            </>
        );

    if (!shouldRenderVideo || !fields) {
        return null;
    }

    return (
        <div
            className={classNames(styles.container, styles[className], {
                [styles.hoverAnimation]: showPreviewHoverAnimation,
            })}
            data-tid='media-video-iframe-container'
        >
            {renderPreview()}
            {!!embedCode && (
                <iframe
                    src={`https://www.youtube.com/embed/${embedCode}?autoplay=${booleanToStringNumber(
                        !!shouldAutoplay,
                    )}&mute=${booleanToStringNumber(!!IsMuted?.value)}`}
                    width='100%'
                    height='100%'
                    allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'
                    data-hj-allow-iframe
                    allowFullScreen={!!IsFullScreenAvailable?.value} // for IE\Edge
                    data-tid='media-video-iframe'
                />
            )}
        </div>
    );
};

export default MediaVideo;
