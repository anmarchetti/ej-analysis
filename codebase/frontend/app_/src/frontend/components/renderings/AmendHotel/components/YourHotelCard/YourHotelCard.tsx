import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import { getHotelLocation } from 'frontend/utils/getHotelLocation';
import { IBookingInfo } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BlockSelected from 'frontend/components/common/BlockSelected';
import EcoCertifiedPill from 'frontend/components/common/EcoCertifiedPill';
import OfferCardSlider from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import StarRating from 'frontend/components/common/StarRating';
import OfferExtras from 'frontend/components/renderings/AmendHotel/components/OfferExtras/OfferExtras';
import TripadvisorInfo from 'frontend/components/renderings/HotelDetails/components/TripadvisorInfo';
import { getHotelMeta } from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel.utils';

import styles from './YourHotelCard.module.scss';

export interface IYourHotelCardProps {
    booking: IBookingInfo;
    fallbackImage: string;
}

const YourHotelCard: FunctionComponent<IYourHotelCardProps> = ({ booking, fallbackImage }) => {
    const { hotel } = booking;

    const starRating = hotel?.starRating ? parseInt(hotel.starRating.substring(-1, 1)) : null;

    const room = booking.package.accom.rooms[0];
    const { roomType, boardType } = room;
    const transfer = booking.transfers[0];

    const { hotelImages } = getHotelMeta(booking);

    return (
        <div className={styles.yourHotelCard} data-tid='your-hotel-card'>
            <div className={styles.imageCarousel} data-tid='hotel-images'>
                <OfferCardSlider images={hotelImages} fallbackImage={fallbackImage} showIndex isFullScreenEnabled />
            </div>
            <div className={styles.cardBody}>
                <div className={styles.detailsSection}>
                    <div className={styles.hotelDetails}>
                        <div>
                            {hotel && (
                                <>
                                    <div className={styles.hotelName} data-tid='hotel-name'>
                                        {hotel.name}
                                    </div>
                                    <div className={styles.hotelLocation} data-tid='hotel-location'>
                                        {getHotelLocation(hotel)}
                                    </div>
                                </>
                            )}
                            <div className={styles.reviewSection}>
                                <StarRating rating={starRating} />
                                {hotel && !!hotel.numberOfReviews && !!hotel.rating && (
                                    <TripadvisorInfo rating={hotel.rating} reviews={hotel.numberOfReviews} />
                                )}
                            </div>
                        </div>
                        {hotel?.ecoFacility?.name && hotel?.ecoFacility?.tooltip && (
                            <EcoCertifiedPill title={hotel.ecoFacility.name} tooltip={hotel.ecoFacility.tooltip} />
                        )}
                    </div>
                    <OfferExtras
                        roomType={roomType}
                        boardType={boardType}
                        transfer={transfer}
                        className={styles.offerExtras}
                    />
                </div>
                <div className={styles.selectedSection}>
                    <BlockSelected
                        siteCoreKey={SitecoreDictionary.TransferButtonsSelected}
                        className={styles.selected}
                    />
                </div>
            </div>
        </div>
    );
};

export default observer(YourHotelCard);
