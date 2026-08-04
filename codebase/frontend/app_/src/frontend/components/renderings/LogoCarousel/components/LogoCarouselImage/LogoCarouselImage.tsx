import { FC } from 'react';
import classNames from 'classnames';

import { isDefined } from 'frontend/utils/object.utils';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './LogoCarouselImage.module.scss';

export type TLogoCarouselImageProps = {
    image: ISitecoreField<ISitecoreImage>;
    dataSlideIndex?: number;
    isActive?: boolean;
};

const LogoCarouselImage: FC<TLogoCarouselImageProps> = ({ image, isActive, dataSlideIndex }) => {
    if (!image?.value?.src) {
        return null;
    }

    return (
        <div
            className={classNames(styles.card, isActive && styles.isActive)}
            data-tid='logo-carousel-image-wrapper'
            {...(isActive && { 'data-item-active': 'active' })}
            {...(isDefined<number>(dataSlideIndex) && { 'data-slide-index': `${dataSlideIndex}` })}
        >
            <JSSImage field={image} className={styles.image} />
        </div>
    );
};

export default LogoCarouselImage;
