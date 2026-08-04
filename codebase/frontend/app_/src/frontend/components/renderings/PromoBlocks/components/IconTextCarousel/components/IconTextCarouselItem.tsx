import { FC, useContext } from 'react';
import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import { IconTextCarouselIconAlignment } from 'models/enum/PromoBlocksIconTextCarouselVariantParams';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { TrackingContext } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksTrackingWrapper/PromoBlocksTrackingWrapper';

import styles from './IconTextCarouselItem.module.scss';

export interface IIconTextCarouselItemProps {
    item: IPromoBlockFields;
    titleClassName: string;
    alignment?: IconTextCarouselIconAlignment;
    hasShadow?: boolean;
}

const IconTextCarouselItem: FC<IIconTextCarouselItemProps> = ({
    item,
    alignment = IconTextCarouselIconAlignment.Left,
    hasShadow,
    titleClassName,
}) => {
    const { trackItemClick } = useContext(TrackingContext);

    return (
        <div
            data-tid='icon-text-carousel-item'
            className={classNames(styles.item, {
                [styles.shadow]: hasShadow,
                [styles.iconCenter]: alignment === IconTextCarouselIconAlignment.Center,
            })}
        >
            <div className={styles.content}>
                <div className={styles.icon}>
                    <JSSImageNext field={item.fields.Image} fill mediaSize={MediaSize.Small} />
                </div>
                <Text field={item.fields.Title} tag='p' className={classNames(styles.title, titleClassName)} />
            </div>

            <RichTextWithLinks field={item.fields.Description} className={styles.description} />
            {!!item.fields.Link?.value?.href && (
                <RouterLink
                    link={item.fields.Link}
                    className='link-overlay'
                    onClick={(): void => trackItemClick?.(item)}
                />
            )}
        </div>
    );
};

export default IconTextCarouselItem;
