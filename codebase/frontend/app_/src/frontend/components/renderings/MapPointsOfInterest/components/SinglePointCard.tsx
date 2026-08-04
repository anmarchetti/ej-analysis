import { FC } from 'react';

import GreyPin from 'frontend/components/icons-new/GreyPin';
import { IPointOfInterest } from 'frontend/components/renderings/MapPointsOfInterest/IMapPointsOfInterest';

import styles from './SinglePointCard.module.scss';

const SinglePointCard: FC<IPointOfInterest> = ({ distance, name, categoryName }) => (
    <div className={styles.wrapper} data-tid='point-of-interest-card'>
        <div className={styles.textWrapper}>
            {name && (
                <p className={styles.name} data-tid='point-of-interest-name'>
                    {name}
                </p>
            )}
            {categoryName && (
                <p className={styles.category} data-tid='point-of-interest-category'>
                    {categoryName}
                </p>
            )}
        </div>
        {distance && (
            <div className={styles.distanceWrapper} data-tid='point-of-interest-distance-wrapper'>
                <GreyPin className={styles.icon} />
                <p className={styles.distance} data-tid='point-of-interest-distance'>
                    {distance}
                </p>
            </div>
        )}
    </div>
);
export default SinglePointCard;
