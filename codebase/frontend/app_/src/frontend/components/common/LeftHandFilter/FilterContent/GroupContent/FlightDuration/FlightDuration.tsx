import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { MAX_FLIGHT_DURATION, MIN_FLIGHT_DURATION } from 'frontend/store/base/search/BaseSearchFilterStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { CompoundSlider } from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/PriceFilter/CompoundSlider';

import useFlightDuration from './FlightDuration.utils';
import FlightDurationCounter from './FlightDurationCounter';

import styles from './FlightDuration.module.scss';

const FlightDuration: FC = () => {
    const {
        getPhrase,
        slider: sliderProps,
        leftCounter: leftCounterProps,
        rightCounter: rightCounterProps,
    } = useFlightDuration();

    return (
        <div className={classNames(styles.wrapper, styles.left)}>
            <div className={styles.sliderWrapper}>
                <span className={styles.duration} data-tid='flight-duration-filter-min-value'>
                    {MIN_FLIGHT_DURATION} {getPhrase(SitecoreDictionary.GlobalsLabelsTimeHoursAny)}
                </span>
                <div className={styles.slider}>
                    <CompoundSlider getPhrase={getPhrase} {...sliderProps} />
                </div>
                <span className={styles.duration} data-tid='flight-duration-filter-max-value'>
                    {MAX_FLIGHT_DURATION}+ {getPhrase(SitecoreDictionary.GlobalsLabelsTimeHoursPlural)}
                </span>
            </div>

            <div className={styles.content}>
                <span className={styles.text}>
                    {getPhrase(SitecoreDictionary.SearchPodFiltersLabelsFlightDurationShowFlightsBetween)}:
                </span>

                <div className={styles.counterWrapper}>
                    <FlightDurationCounter {...leftCounterProps} />

                    <span className={styles.text}>
                        {getPhrase(SitecoreDictionary.GlobalsLabelsTimeHoursAny)}{' '}
                        {getPhrase(SitecoreDictionary.GlobalConjunctionsAnd)}
                    </span>
                </div>

                <div className={styles.counterWrapper}>
                    <FlightDurationCounter {...rightCounterProps} />

                    <span className={styles.text}>{getPhrase(SitecoreDictionary.GlobalsLabelsTimeHoursPlural)}</span>
                </div>
            </div>
        </div>
    );
};

export default observer(FlightDuration);
