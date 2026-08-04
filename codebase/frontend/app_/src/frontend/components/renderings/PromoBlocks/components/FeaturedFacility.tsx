import { FC, useContext, useEffect, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { getImage } from 'frontend/utils/getImage';
import { IImage } from 'models/data/IHotel';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { getMediaSizeParams, MediaSize } from 'models/data/MediaSizeParams';
import { ImageSize } from 'models/enum/ImageSize';
import { JSSImage } from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { TrackingContext } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksTrackingWrapper/PromoBlocksTrackingWrapper';
import { shouldRenderPromoBlock } from 'frontend/components/renderings/PromoBlocks/PromoBlocks.utils';

interface IFeaturedFacilityProps {
    item: IPromoBlockFields;
    titleClassName: string;
    itemClass?: string;
}

export const FeaturedFacility: FC<IFeaturedFacilityProps> = ({ item, itemClass, titleClassName }) => {
    const { isEditMode } = useStore(stores => ({
        isEditMode: stores.layoutStore.isEditMode,
    }));

    const [imageUrl, setImageUrl] = useState('');
    const isMounted = useRef(false);
    const { trackItemClick } = useContext(TrackingContext);

    const isPromoBlockUnavailable = !shouldRenderPromoBlock(item, isEditMode);

    useEffect(() => {
        if (isPromoBlockUnavailable) {
            return;
        }

        isMounted.current = true;
        getImageSrc(item);

        return () => {
            isMounted.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isPromoBlockUnavailable) {
        return null;
    }

    /** Gets image url from 'Image' field. If 'Image' field is empty gets image url from external images. **/
    const getImageSrc = async (item: IPromoBlockFields): Promise<void> => {
        const sitecoreImageSrc = item.fields?.Image?.value.src;

        if (sitecoreImageSrc) {
            const url = cmsUrls.media(sitecoreImageSrc, getMediaSizeParams(MediaSize.Medium));
            setImageUrl(url);
        } else {
            const image: IImage = {
                small: item.fields.Small?.value || '',
                medium: item.fields.Medium?.value || '',
                large: item.fields.Large?.value || '',
            };

            const url = await getImage(image, ImageSize.Medium);
            // Don't update state an unmounted component
            isMounted.current && setImageUrl(url);
        }
    };

    const { Link, Title, Description, Image } = item.fields;
    const hasLink = !!Link?.value?.href;
    const hasDescription = !!Description?.value;

    return (
        <div className={itemClass} data-tid='featured-facility'>
            {isEditMode ? (
                <div className='background'>
                    <JSSImage field={Image} />
                </div>
            ) : (
                <div className='background' style={{ backgroundImage: `url(${imageUrl})` }} />
            )}

            <Text field={Title} tag='p' className={classNames('title', titleClassName)} />

            <div className='description'>
                {(hasDescription || isEditMode) && <RichTextWithLinks field={Description} />}
            </div>
            {hasLink && (
                <RouterLink link={Link} className='link-overlay' onClick={(): void => trackItemClick?.(item)} />
            )}
        </div>
    );
};

export default observer(FeaturedFacility);
