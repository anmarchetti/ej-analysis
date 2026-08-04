import { FC } from 'react';
import { omit } from 'lodash';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import CustomCloudinaryPlayer from 'frontend/components/common/CustomCloudinaryPlayer/CustomCloudinaryPlayer';
import CustomYoutubePlayer from 'frontend/components/common/CustomYoutubePlayer/CustomYoutubePlayer';

export interface IVideoPlayerProps {
    fallbackImage: string;
    isBasicPreview: boolean;
    isDisplayed: boolean;
    autoPlay?: boolean;
    cloudinaryVideoSrc?: string;
    id?: string;
    onPlayCallback?: () => void | undefined;
    setAutoPlay?: (value: boolean) => void;
    thumbnailClassName?: string;
    title?: string;
    videoClassName?: string;
    videoPlaceholder?: string;
    wrapperClassName?: string;
    youtubeVideoId?: string;
}

const VideoPlayer: FC<IVideoPlayerProps> = props => {
    const { isCloudinaryDisabled } = useStore(stores => ({
        isCloudinaryDisabled: stores.layoutStore.isCloudinaryDisabled,
    }));

    if (!isCloudinaryDisabled && props.cloudinaryVideoSrc)
        return <CustomCloudinaryPlayer {...omit(props, ['wrapperClassName', 'youtubeVideoId'])} />;

    if (props.youtubeVideoId)
        return <CustomYoutubePlayer {...omit(props, ['thumbnailClassName', 'cloudinaryVideoSrc'])} />;

    return null;
};

export default observer(VideoPlayer);
