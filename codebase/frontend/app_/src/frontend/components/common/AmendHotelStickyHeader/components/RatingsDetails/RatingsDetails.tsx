import { FunctionComponent } from 'react';
import classNames from 'classnames';

import StarRating from 'frontend/components/common/StarRating';
import TripadvisorInfo from 'frontend/components/renderings/HotelDetails/components/TripadvisorInfo';

import styles from './RatingsDetails.module.scss';

export interface IRatingsDetailsProps {
    className?: string;
    dataTid?: string;
    numberOfReviews?: number;
    rating?: number;
    starRating?: string;
}

const RatingsDetails: FunctionComponent<IRatingsDetailsProps> = ({
    className,
    dataTid = 'ratings-details',
    starRating,
    rating,
    numberOfReviews,
}) => {
    if (!starRating) {
        return null;
    }

    const isTripadvisorRatingShown = !!rating && !!numberOfReviews;

    const starRatingNumber = parseFloat(starRating);

    return (
        <div className={classNames(styles.ratings, className)} data-tid={dataTid}>
            <StarRating rating={starRatingNumber} />
            {isTripadvisorRatingShown && <TripadvisorInfo rating={rating} reviews={numberOfReviews} />}
        </div>
    );
};

export default RatingsDetails;
