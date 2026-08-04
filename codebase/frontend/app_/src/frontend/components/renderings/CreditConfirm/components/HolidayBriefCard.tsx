import React from 'react';

import { TrailingZeroDisplay } from 'code/currency';
import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { useBoard, useDatesLabel, useGuests, useNightsLabel } from 'frontend/hooks/viewBooking.hooks';
import { getHotelLocation } from 'frontend/utils/getHotelLocation';
import { getTotalPaidAmount } from 'frontend/utils/payment.utls';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IImage } from 'models/data/IHotel';
import { ImageSize } from 'models/enum/ImageSize';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import FormattedMoney from 'frontend/components/common/FormattedMoney/FormattedMoney';
import HotelImage from 'frontend/components/common/HotelImage/HotelImage';
import StarRating from 'frontend/components/common/StarRating';
import SvgAdults from 'frontend/components/icons-new/Adults';
import SvgCalendarLined from 'frontend/components/icons-new/CalendarLined';
import BoardTypeIcon from 'frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon';
import TripadvisorInfo from 'frontend/components/renderings/HotelDetails/components/TripadvisorInfo';

interface IHolidaySummaryCardProps {
    booking: IBookingInfo;
    fallbackImage?: string;
}

export const HolidayBriefCard = ({ fallbackImage, booking }: IHolidaySummaryCardProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const accom = booking.package?.accom || null;
    const hotelName = accom?.hotel?.name ?? booking.hotel?.name;
    const hotelImages = booking.hotel?.images ?? accom?.hotel?.images;
    const hotelImage = hotelImages?.length ? hotelImages[0] : null;
    const hotelLocation = accom?.hotel ? getHotelLocation(accom.hotel) : undefined;
    const starRating = accom?.hotel?.starRating ? parseInt(accom.hotel.starRating, 10) : null;
    const taRating = accom?.hotel?.rating;
    const numberOfReviews = accom?.hotel?.numberOfReviews;
    const totalPaid = getTotalPaidAmount(booking.paymentInfo);

    const guestsLabel = useGuests(
        booking,
        getPhrase,
        SitecoreDictionary.CreditConfirmHolidaySummaryGuest,
        SitecoreDictionary.CreditConfirmHolidaySummaryGuests,
    );
    const nightsLabel = useNightsLabel(accom?.startDate, accom?.endDate, getPhrase);
    const [datesLabel] = useDatesLabel(booking, false, getPhrase);
    const board = useBoard(booking);
    const datesAndNightsLabel = nightsLabel && datesLabel ? `${datesLabel}, ${nightsLabel}` : null;

    return (
        <div className='holiday-brief-card'>
            <HotelImage
                image={hotelImage as IImage}
                defaultSize={ImageSize.Medium}
                fallbackImage={fallbackImage && cmsUrls.media(fallbackImage)}
                className='holiday-brief-card__image'
            />
            <div className='holiday-brief-card__text'>
                <h3 className='holiday-brief-card__title'>{hotelName}</h3>

                <div className='holiday-brief-card__rating'>
                    <StarRating rating={starRating} />
                    {!!(taRating && numberOfReviews) && <TripadvisorInfo rating={taRating} reviews={numberOfReviews} />}
                </div>

                {hotelLocation && <div className='holiday-brief-card__location'>{hotelLocation}</div>}

                <div className='holiday-brief-card__details' data-cs-mask>
                    <div className='holiday-brief-card__details-item'>
                        <SvgAdults />
                        <span>{guestsLabel}</span>
                    </div>
                    {!!datesAndNightsLabel && (
                        <div className='holiday-brief-card__details-item'>
                            <SvgCalendarLined />
                            <span>{datesAndNightsLabel}</span>
                        </div>
                    )}

                    {board.label && (
                        <div className='holiday-brief-card__details-item'>
                            <BoardTypeIcon iconUrl={board.iconUrl} />
                            <span>{board.label}</span>
                        </div>
                    )}
                </div>

                <div className='holiday-brief-card__price'>
                    <div>{getPhrase(SitecoreDictionary.CreditConfirmHolidaySummaryTotal)}</div>
                    <div className='holiday-brief-card__price-value' data-cs-mask>
                        <FormattedMoney
                            amount={totalPaid}
                            options={{
                                currency: booking?.currency?.code,
                                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                            }}
                            className='holiday-brief-card__price-small'
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HolidayBriefCard;
