import classNames from 'classnames';

import HotelMainSidebarShimmer from 'frontend/components/renderings/HotelDetails/components/HotelMainSidebarShimmer';
import styles from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/HotelImageCatousel.module.scss';

const HotelImageCarouselShimmer: React.FC = () => (
    <div className={styles.placeholderHotelDetailsContainer} data-tid='hotel-image-carousel-shimmer'>
        <div>
            <div className={classNames(styles.placeholderHotelDetails, 'placeholder-shimmer')} />
        </div>
        <HotelMainSidebarShimmer />
    </div>
);

export default HotelImageCarouselShimmer;
