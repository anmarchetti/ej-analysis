import { FC } from 'react';

import { IReviewsData } from 'frontend/store/base/hotelReviews/BaseHotelReviewsStore';

import TripAdvisorReview from './Review';

export interface IReviewsListProps {
    isExpanded: boolean;
    reviewsData: IReviewsData;
}

export const ReviewsList: FC<IReviewsListProps> = ({ reviewsData, isExpanded }) => (
    <div className='reviews__feed--content mb-4' data-tid='reviews-list' aria-hidden={!isExpanded}>
        {reviewsData.reviews?.map(review => (
            <TripAdvisorReview key={review.publishedDate} {...review} />
        ))}
    </div>
);

export default ReviewsList;
