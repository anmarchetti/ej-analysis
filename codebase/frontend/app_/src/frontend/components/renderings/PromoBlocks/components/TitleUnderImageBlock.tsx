import { FC, useContext } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { getMediaSizeParams, MediaSize } from 'models/data/MediaSizeParams';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { TrackingContext } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksTrackingWrapper/PromoBlocksTrackingWrapper';
import { shouldRenderPromoBlock } from 'frontend/components/renderings/PromoBlocks/PromoBlocks.utils';

export interface ITitleUnderImageBlockProps {
    item: IPromoBlockFields;
    titleClassName: string;
    itemClass?: string;
}

export const TitleUnderImageBlock: FC<ITitleUnderImageBlockProps> = ({ item, titleClassName, itemClass }) => {
    const { isEditMode } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
    }));
    const { trackItemClick } = useContext(TrackingContext);

    if (!shouldRenderPromoBlock(item, isEditMode)) {
        return null;
    }

    const src = item.fields?.Image?.value?.src;
    const imgSrc = src ? `url(${cmsUrls.media(src, getMediaSizeParams(MediaSize.Medium))})` : '';

    const hasLink = !!item.fields.Link?.value?.href;
    const hasDescription = !!item.fields.Description?.value;

    return (
        <div className={itemClass} data-tid='title-under-image'>
            {isEditMode ? (
                <div className='background'>
                    <JSSImage field={item.fields.Image} />
                </div>
            ) : (
                <div className='background' style={{ backgroundImage: imgSrc }} />
            )}

            <Text field={item.fields.Title} tag='p' className={classNames('title', titleClassName)} />

            <div className='description'>
                {(hasDescription || isEditMode) && <RichTextWithLinks field={item.fields.Description} />}
            </div>
            {hasLink && (
                <RouterLink
                    link={item.fields.Link}
                    className='link-overlay'
                    onClick={(): void => trackItemClick?.(item)}
                />
            )}
        </div>
    );
};

export default observer(TitleUnderImageBlock);
