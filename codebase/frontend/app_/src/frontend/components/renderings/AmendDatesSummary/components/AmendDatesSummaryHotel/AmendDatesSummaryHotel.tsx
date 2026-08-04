import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import Link from 'next/link';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { buildHotelDetailsUrl } from 'frontend/utils/getHotelLocation';
import { IBookingInfo } from 'models/data/IBookingInfo';
import OfferCardSlider from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import StarRating from 'frontend/components/common/StarRating';
import ChevronRight from 'frontend/components/icons-new/ChevronRight';
import { getHotelMeta } from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel.utils';

import styles from './AmendDatesSummaryHotel.module.scss';

interface IAmendSummaryHotelProps {
    fallbackHotelImage: string;
    linkLabel: string;
    className?: string;
}

const AmendSummaryDatesHotel = ({ fallbackHotelImage, linkLabel, className }: IAmendSummaryHotelProps) => {
    const { booking, basePath } = useStore(({ amendDatesStore, layoutStore }: IHolidaysStores) => ({
        booking: amendDatesStore.booking,
        basePath: layoutStore.basePath,
    }));

    if (!booking) {
        return null;
    }

    const { hotelImages, hotelName, starRating } = getHotelMeta(booking as IBookingInfo);

    const hotelPath = buildHotelDetailsUrl(booking.hotel);

    const hotelDetailsUrl = hotelPath ? `${basePath}${hotelPath}` : undefined;

    return (
        <div className={classNames(styles.hotel, className, 'summary-hotel')} data-tid='amend-dates-summary-hotel'>
            <div className='hotel-card-img-box-wr'>
                <div className='img-carousel-container' data-tid='hotel-card-images'>
                    <OfferCardSlider
                        images={hotelImages}
                        fallbackImage={fallbackHotelImage}
                        showIndex
                        isFullScreenEnabled
                    />
                </div>
            </div>
            <div className={styles.titleRating}>
                <h3 className={styles.title}>{hotelName}</h3>
                <StarRating rating={starRating} />
            </div>
            {hotelDetailsUrl && (
                <Link
                    className={styles.link}
                    href={hotelDetailsUrl}
                    data-tid='amend-dates-summary-hotel-view-link'
                    target='_blank'
                >
                    <span>{linkLabel}</span>
                    <ChevronRight />
                </Link>
            )}
        </div>
    );
};

export default observer(AmendSummaryDatesHotel);
