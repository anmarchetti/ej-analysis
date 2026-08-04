import { FC } from 'react';
import classNames from 'classnames';

import SvgTripAdvisor from 'frontend/components/icons-new/TripAdvisor';

import { HALF_OF_STAR, roundRating, STAR_IDS } from './TripadvisorRating.helpers';

import styles from './TripadvisorRating.module.scss';

export interface ITripadvisorRatingProps {
    rating: number;
    customClass?: string;
    hasIcon?: boolean;
    showRatingValue?: boolean;
}

const TripadvisorRating: FC<ITripadvisorRatingProps> = ({
    rating,
    customClass,
    hasIcon,
    showRatingValue,
}): JSX.Element => {
    const roundedRating: number = roundRating(rating);

    return (
        <div className={classNames('tripadvisor_rating', customClass)}>
            {hasIcon && <SvgTripAdvisor />}
            {STAR_IDS.map((star, idx) => {
                const isFullStart: boolean = roundedRating >= idx + 1;
                const isHalfStar: boolean = !isFullStart && roundedRating >= idx + HALF_OF_STAR;

                return <span key={star} className={classNames({ active: isFullStart, 'active--half': isHalfStar })} />;
            })}
            {showRatingValue && (
                <span data-tid='tripadvisor-rating-value' className={styles.ratingValue}>
                    {rating}
                </span>
            )}
        </div>
    );
};

export default TripadvisorRating;
