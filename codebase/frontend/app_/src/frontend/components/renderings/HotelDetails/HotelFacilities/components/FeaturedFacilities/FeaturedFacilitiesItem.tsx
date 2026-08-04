import React, { useCallback, useEffect, useState } from 'react';

import { cmsUrls } from 'code/endpoints';
import { getImage } from 'frontend/utils/getImage';
import { IFeaturedFacility } from 'models/data/IFeaturedFacility';
import { getMediaSizeParams, MediaSize } from 'models/data/MediaSizeParams';
import { ImageSize } from 'models/enum/ImageSize';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { RichTextWithLinks } from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

interface IFeaturedFacilitiesItemProps {
    id: number;
    item: IFeaturedFacility;
    itemClass?: string;
}

const FeaturedFacilitiesItem: React.FC<IFeaturedFacilitiesItemProps> = ({ id, item, itemClass }) => {
    const [isMounted, setIsMounted] = useState(false);
    const [imageUrl, setImageUrl] = useState('');

    const getImageSrc = useCallback(async () => {
        if (item.image) {
            const url = cmsUrls.media(item.image, getMediaSizeParams(MediaSize.Medium));
            setImageUrl(url);
        } else {
            const url = await getImage(item.externalImage, ImageSize.Medium);

            if (isMounted) {
                setImageUrl(url);
            }
        }
    }, [item, isMounted]);

    useEffect(() => {
        setIsMounted(true);
        getImageSrc();

        return () => {
            setIsMounted(false);
        };
    }, [getImageSrc]);

    useEffect(() => {
        getImageSrc();
    }, [item.externalImage, item.image, getImageSrc]);

    const link: ISitecoreField<ISitecoreLink> = {
        value: {
            href: item.link.url,
            url: item.link.url,
            text: item.link.text,
            linktype: item.link.linkType,
            target: item.link.target,
        },
    };

    const hasDescription = !!item.description;
    const hasLink = !!link.value?.href;

    return (
        <div key={id} className={itemClass}>
            <div className='background' style={{ backgroundImage: `url(${imageUrl})` }} />
            <p className='title'>{item.title}</p>
            <div className='description'>
                {hasDescription && <RichTextWithLinks field={{ value: item.description }} tag='p' />}
                {hasLink && <SvgChevronRight className='icon-arrow' />}
            </div>
            {hasLink && <RouterLink link={link} className='link-overlay' />}
        </div>
    );
};

export default FeaturedFacilitiesItem;
