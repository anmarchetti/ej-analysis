import { FC } from 'react';
import classNames from 'classnames';

import styles from 'frontend/components/common/LeftHandFilter/LeftHandFilter.module.scss';

interface IFilterSkeletonProps {
    withMap: boolean;
}

const FilterSkeleton: FC<IFilterSkeletonProps> = ({ withMap }) => (
    <div className={styles.skeletonWrapper}>
        {withMap && (
            <div
                data-tid='search-results-map-skeleton'
                className={classNames(styles.mapSkeleton, 'placeholder-shimmer')}
            />
        )}
        <div
            data-tid='search-pod-filters-skeleton'
            className={classNames('placeholder-shimmer', styles.filtersSkeleton)}
        />
    </div>
);

export default FilterSkeleton;
