import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { ITopicFields } from 'models/data/ITopicFields';
import { getMediaSizeParams, MediaSize } from 'models/data/MediaSizeParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

import TopicLink from './TopicLink';

export interface ITopicTileItemFields {
    Image: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
    name: string;
    Topic?: ISitecoreCompositeField<ITopicFields>;
}

type TTopicTileItemProps = ISitecoreComponent<ITopicTileItemFields>;

const TopicTileItem: React.FC<TTopicTileItemProps> = ({ fields }) => {
    const { isEditMode } = useStore(stores => ({
        isEditMode: stores.layoutStore.isEditMode,
    }));

    const backgroundImage = (): string => {
        const src = fields?.Image.value.src || '';

        return src ? `url(${cmsUrls.media(src, getMediaSizeParams(MediaSize.Medium))})` : '';
    };

    if (!fields) {
        return null;
    }

    const topic = fields.Topic?.fields?.Name?.value;
    const titleContent = (
        <>
            <Text field={fields.Title} tag='span' />
            <SvgChevronRight className='icon-arrow' />
        </>
    );

    return (
        <div className='topic-tiles__item'>
            {isEditMode ? (
                <div className='background exp-editor-bg-image'>
                    <JSSImage field={fields.Image} />
                </div>
            ) : (
                <div className='background' style={{ backgroundImage: backgroundImage() }} />
            )}
            <h3 className='topic-tiles__item-title'>
                {topic ? (
                    <TopicLink topic={topic} className='link-pseudo-overlay'>
                        {titleContent}
                    </TopicLink>
                ) : (
                    titleContent
                )}
            </h3>
        </div>
    );
};

export default TopicTileItem;
