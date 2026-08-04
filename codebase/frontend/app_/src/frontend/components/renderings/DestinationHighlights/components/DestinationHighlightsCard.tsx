import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { cmsUrls } from 'code/endpoints';
import { IDestinationHighlightItem } from 'models/data/IDestinationHighlightItem';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface IDestinationHighlightsCardProps {
    item: IDestinationHighlightItem;
}

export const DestinationHighlightsCard = ({ item }: IDestinationHighlightsCardProps) => {
    if (!item.fields) {
        return null;
    }

    const { Image, Title, Description } = item.fields;

    return (
        <div className='destination-highlights-card'>
            {Image?.value?.src && (
                <div className='destination-highlights-card__img-wrapper'>
                    <div
                        className='destination-highlights-card__img'
                        data-tid='fallback-image'
                        style={{
                            backgroundImage: `url(${cmsUrls.media(Image.value.src)})`,
                        }}
                    />
                </div>
            )}
            <div className='destination-highlights-card__body'>
                {Title && <Text field={Title} tag='h3' className='title' />}
                {Description && <RichTextWithLinks field={Description} className='description' />}
            </div>
        </div>
    );
};

export default DestinationHighlightsCard;
