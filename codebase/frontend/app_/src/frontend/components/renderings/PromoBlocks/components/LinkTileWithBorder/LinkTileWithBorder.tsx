import { FC, useContext } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { IPromoBlockFields, IPromoBlockProps } from 'models/data/IPromoBlockFields';
import { JSSImage } from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { TrackingContext } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksTrackingWrapper/PromoBlocksTrackingWrapper';

import styles from './LinkTileWithBorder.module.scss';

export const LinkTileWithBorder: FC<IPromoBlockProps> = ({ items, titleClassName }) => {
    const { trackItemClick } = useContext(TrackingContext);

    if (!items?.length) return null;

    const getItemContent = (item: IPromoBlockFields): JSX.Element => (
        <>
            <JSSImage field={item.fields.Image} className={styles.icon} dataTid='icon' />
            <div className={styles.textContent}>
                <Text
                    field={item.fields.Title}
                    tag='h3'
                    className={classNames(styles.title, titleClassName)}
                    data-tid='title'
                />
                <RichTextWithLinks
                    tag='div'
                    field={item.fields.Description}
                    className={styles.description}
                    dataId='description'
                />
            </div>
        </>
    );

    return (
        <div className={styles.container}>
            {items.map(item =>
                item.fields.Link.value.href ? (
                    <RouterLink
                        link={item.fields.Link}
                        key={item.id}
                        className={styles.tile}
                        dataId='link-tile'
                        onClick={(): void => trackItemClick?.(item)}
                    >
                        {getItemContent(item)}
                    </RouterLink>
                ) : (
                    <div key={item.id} className={styles.tile} data-tid='tile'>
                        {getItemContent(item)}
                    </div>
                ),
            )}
        </div>
    );
};
export default LinkTileWithBorder;
