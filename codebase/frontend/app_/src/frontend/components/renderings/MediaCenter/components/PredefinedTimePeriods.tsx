import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

const PREDEFINED_TIME_PERIODS = [
    {
        key: SitecoreDictionary.PressHubFiltersPredefinedTimePeriodsLastMonth,
        value: 30,
    },
    {
        key: SitecoreDictionary.PressHubFiltersPredefinedTimePeriodsLastThreeMonths,
        value: 90,
    },
    {
        key: SitecoreDictionary.PressHubFiltersPredefinedTimePeriodsLastHalfYear,
        value: 180,
    },
    {
        key: SitecoreDictionary.PressHubFiltersPredefinedTimePeriodsLastYear,
        value: 365,
    },
];

export const PredefinedTimePeriods = () => {
    const {
        getPhrase,
        isScreenLessMedium,
        activePredefinedTimePeriod,
        selectedDatesFilters,
        setActivePredefinedTimePeriod,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        selectedDatesFilters: stores.mediaCenterStore.selectedDatesFilters,
        activePredefinedTimePeriod: stores.mediaCenterStore.activePredefinedTimePeriod,
        setActivePredefinedTimePeriod: stores.mediaCenterStore.setActivePredefinedTimePeriod,
    }));

    const changeActivePeriod = period => {
        setActivePredefinedTimePeriod(
            !activePredefinedTimePeriod || activePredefinedTimePeriod?.key !== period.key ? period : undefined,
        );
    };

    return (
        <div
            className={!isScreenLessMedium ? 'predefined-period' : 'predefined-period__mobile'}
            data-tid='predefined-period'
        >
            <div className='predefined-period__title'>
                {getPhrase(SitecoreDictionary.PressHubFiltersPredefinedTimePeriodsTitle)}
            </div>
            <div
                className={classNames({
                    'predefined-period__pills-block': true,
                    'predefined-period__pills-block--bordered': isScreenLessMedium && selectedDatesFilters.length > 0,
                })}
            >
                {PREDEFINED_TIME_PERIODS.map(period => (
                    <div
                        key={period.key}
                        className={classNames({
                            'predefined-period__pill': true,
                            'predefined-period__pill--selected': activePredefinedTimePeriod?.key === period.key,
                        })}
                        data-tid='predefined-period-pill'
                        onClick={() => changeActivePeriod(period)}
                    >
                        <span className='predefined-period__pill-label'>{getPhrase(period.key)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default observer(PredefinedTimePeriods);
