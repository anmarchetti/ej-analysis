import React from 'react';

import styles from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/HotelImageCatousel.module.scss';

const HotelMainSidebarShimmer: React.FC = () => (
    <div className={styles.hotelMainSidebarShimmer} data-tid='hotel-main-sidebar-shimmer'>
        <div>
            <div className='placeholder-sidebar-head placeholder-shimmer' />
        </div>
    </div>
);

export default HotelMainSidebarShimmer;
