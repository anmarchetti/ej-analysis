import { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IAnchorParameters } from 'models/data/IAnchorParameters';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import Reviews from './components/Reviews';

type THotelReviewsBookingProps = ISitecoreComponent<null, IAnchorParameters>;

export const HotelReviewsBooking: FC<THotelReviewsBookingProps> = ({ params }) => {
    const { hotel } = useStore((stores: TStores) => ({
        hotel: stores.bookingStore.hotel,
    }));

    return (
        <Reviews
            anchor={params?.Anchor}
            reviews={hotel?.numberOfReviews}
            rating={hotel?.rating}
            tripadvisorId={hotel?.tripAdvisorId}
            showRatingValue
        />
    );
};

export default HotelReviewsBooking;
