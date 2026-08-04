import classNames from 'classnames';

import styles from './HotelInfoShimmer.module.scss';

export type THotelInfoShimmerProps = {
    isExtrasPage: boolean;
};

const HotelInfoShimmer: React.FC<THotelInfoShimmerProps> = ({ isExtrasPage }) => (
    <div data-tid='shimmer'>
        <div className={classNames(styles.hotelDescription, 'hotel-description')}>
            <div className={classNames(styles.hotelInfoTitle, 'placeholder-shimmer')} />
            <div className={classNames(styles.hotelInfoDescription, 'placeholder-shimmer')} />
        </div>
        {!isExtrasPage && (
            <>
                <div
                    className={classNames(styles.hotelInfoBanner, 'placeholder-shimmer')}
                    data-tid='placeholder-hotel-info-banner'
                />
                <div
                    className={classNames(styles.hotelInfoFacilities, 'placeholder-shimmer hotel-facilities')}
                    data-tid='placeholder-hotel-info-facilities'
                />
            </>
        )}
    </div>
);

export default HotelInfoShimmer;
