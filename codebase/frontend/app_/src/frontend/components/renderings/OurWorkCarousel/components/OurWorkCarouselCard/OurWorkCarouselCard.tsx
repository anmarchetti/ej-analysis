import { forwardRef } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import JSSImage from 'frontend/components/common/JSSImage';
import RouterLink from 'frontend/components/common/RouterLink';
import SvgArrow from 'frontend/components/icons-new/Arrow';
import { IOurWorkCarouselCardFields } from 'frontend/components/renderings/OurWorkCarousel/OurWorkCarousel';

import styles from './OurWorkCarouselCard.module.scss';

export interface IOurWorkCarouselCardProps {
    fields: IOurWorkCarouselCardFields;
    titleHeight?: number;
}

const OurWorkCarouselCard = ({ fields, titleHeight }: IOurWorkCarouselCardProps, ref) => {
    if (!fields) {
        return null;
    }

    const { Image, Subtitle, Title, Link } = fields;

    const titleStyle = !!titleHeight ? { height: titleHeight } : {};

    return (
        <div className={styles.card} data-tid='carousel-card-link'>
            {Image?.value.src && (
                <div className={styles.imageContainer}>
                    <JSSImage
                        field={Image}
                        className={styles.image}
                        role='presentation'
                        data-tid='carousel-card-image'
                    />
                </div>
            )}
            <div className={styles.content}>
                <div
                    ref={ref}
                    className={styles.titleWrapper}
                    style={titleStyle}
                    data-tid='carousel-card-title-wrapper'
                >
                    <Text field={Title} tag='h3' className={styles.title} data-tid='carousel-card-title' />
                </div>
                <Text field={Subtitle} tag='p' className={styles.subtitle} data-tid='carousel-card-subtitle' />
                {Link?.value.text && (
                    <RouterLink link={Link} className={styles.link} data-tid='carousel-card-link'>
                        {Link.value.text}
                        <span className={styles.linkArrow} data-tid='carousel-card-link-icon'>
                            <SvgArrow />
                        </span>
                    </RouterLink>
                )}
            </div>
        </div>
    );
};

export default forwardRef(OurWorkCarouselCard);
