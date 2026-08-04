import React, { FC } from 'react';

import { getHotelLocation } from 'frontend/utils/getHotelLocation';
import { IOffer } from 'models/data/IOffer';
import Checkbox from 'frontend/components/common/Checkbox';
import OfferCardHotelTitle from 'frontend/components/common/OfferCardHotelTitle/OfferCardHotelTitle';
import StarRating from 'frontend/components/common/StarRating';
import TripadvisorInfo from 'frontend/components/renderings/HotelDetails/components/TripadvisorInfo';
import ShortlistButton from 'frontend/components/renderings/Shortlists/components/ShortlistButton/ShortlistButton';

export interface IOfferCardHotelHeadProps {
    hotelLink: string;
    offer: IOffer;
    onChangeEditSelection: () => void;
    onClickSelect: () => void;
    hasShortlistBookmark?: boolean;
    isSelectedToEdit?: boolean;
    isSelectionEditMode?: boolean;
}

const OfferCardHotelHead: FC<IOfferCardHotelHeadProps> = ({
    hotelLink,
    onClickSelect,
    hasShortlistBookmark,
    isSelectionEditMode,
    isSelectedToEdit,
    onChangeEditSelection,
    offer,
}) => {
    const { hotel } = offer;
    const starRating = hotel?.starRating ? Number.parseInt(hotel.starRating.substring(-1, 1)) : null;

    return (
        <div className='hotel-card-head hotel-card-head-v2' data-tid='hotel-card-head'>
            <div className='hotel-card-head-title-box'>
                <OfferCardHotelTitle offer={offer} hotelLink={hotelLink} onClick={onClickSelect} />

                {hotel && (
                    <div className='hotel-card-head-location hotel-card-head-location-v2'>
                        {getHotelLocation(hotel)}
                    </div>
                )}
                <div className='hotel-card-head-views'>
                    <StarRating rating={starRating} />
                    {hotel && !!hotel.numberOfReviews && !!hotel.rating && (
                        <TripadvisorInfo rating={hotel.rating} reviews={hotel.numberOfReviews} />
                    )}
                </div>
            </div>
            {hasShortlistBookmark && <ShortlistButton offer={offer} />}
            {isSelectionEditMode && (
                <div className='hotel-card-check-control'>
                    <Checkbox isRadioStyle checked={isSelectedToEdit} onChange={onChangeEditSelection} />
                </div>
            )}
        </div>
    );
};

export default OfferCardHotelHead;
