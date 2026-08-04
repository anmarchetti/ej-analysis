import { FC } from 'react';

import TripadvisorRating from 'frontend/components/common/TripadvisorRating/TripadvisorRating';

interface IRatingCategoryItemProps {
    ratingNum: number;
    title: string;
}

export const RatingCategoryItem: FC<IRatingCategoryItemProps> = ({ title, ratingNum }) => (
    <>
        <span className='title'>{title}</span>
        <TripadvisorRating rating={ratingNum} />
    </>
);
