import { FunctionComponent } from 'react';

import { IHotel } from 'models/data/IHotel';
import RatingsDetails from 'frontend/components/common/AmendHotelStickyHeader/components/RatingsDetails/RatingsDetails';
import HotelPreviewLink from 'frontend/components/common/AmendSummary/HotelPreviewLink/HotelPreviewLink';
import OfferCardSlider from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import ChevronRight from 'frontend/components/icons/ChevronRight';

import styles from './HotelDetails.module.scss';

export interface IHotelDropdownProps {
    fallbackHotelImage: string;
    hotel: IHotel;
    isHotelDetailsLinkShown?: boolean;
    linkLabel?: string;
}

const HotelDetails: FunctionComponent<IHotelDropdownProps> = ({
    fallbackHotelImage,
    linkLabel,
    hotel,
    isHotelDetailsLinkShown,
}) => {
    if (!hotel) {
        return null;
    }

    const { images, name } = hotel;

    return (
        <div className={styles.hotel}>
            <div className='hotel-card-img-box-wr'>
                <div className='img-carousel-container' data-tid='hotel-card-images'>
                    <OfferCardSlider images={images} fallbackImage={fallbackHotelImage} showIndex isFullScreenEnabled />
                </div>
            </div>
            <div className={styles.titleRating}>
                <h3 className={styles.title}>{name}</h3>
                <RatingsDetails {...hotel} className={styles.ratings} />
            </div>
            {isHotelDetailsLinkShown && linkLabel && (
                <HotelPreviewLink hotel={hotel} className={styles.link}>
                    <span>{linkLabel}</span>
                    <ChevronRight />
                </HotelPreviewLink>
            )}
        </div>
    );
};

export default HotelDetails;
