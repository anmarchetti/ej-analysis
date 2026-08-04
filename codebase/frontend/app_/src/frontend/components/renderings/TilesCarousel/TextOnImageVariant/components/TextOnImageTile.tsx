import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { ICarouselTile } from 'frontend/components/renderings/TilesCarousel/TilesCarouselInterfaces';

import styles from './TextOnImageTile.module.scss';

const TextOnImageTile: FC<ICarouselTile> = ({ Description, Subtitle, Title, Image }) => (
    <div data-tid='text-on-image-tile-wrapper' className={styles.wrapper}>
        <div data-tid='text-on-image-tile-image-wrapper' className={styles.imageWrapper}>
            <JSSImageNext field={Image} className={styles.image} data-tid='text-on-image-tile-image' />
            <div className={styles.textWrapper}>
                <Text field={Subtitle} className={styles.subtitle} data-tid='text-on-image-tile-subtitle' tag='p' />
                <Text field={Title} className={styles.title} data-tid='text-on-image-tile-title' tag='p' />
            </div>
        </div>
        <div className={styles.descriptionWrapper}>
            <RichTextWithLinks
                field={Description}
                className={styles.description}
                dataId='text-on-image-tile-description'
                tag='p'
            />
        </div>
    </div>
);
export default TextOnImageTile;
