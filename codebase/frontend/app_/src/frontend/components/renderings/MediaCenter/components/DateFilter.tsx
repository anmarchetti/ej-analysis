import React, { FC, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { MIN_ARTICLE_DATE } from 'frontend/store/holidays/mediaCenter/MediaCenterStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import FakeInput from 'frontend/components/common/FakeInput/FakeInput';
import SelectedFilters from 'frontend/components/common/SearchFilters/SelectedFilters';
import IconCalendar from 'frontend/components/icons/Calendar';

import CalendarFilterDesktop from './CalendarFilterDesktop';
import CalendarFilterDrawer from './CalendarFilterDrawer';
import PredefinedTimePeriods from './PredefinedTimePeriods';

import styles from './DateFilter.module.scss';

export const DateFilter: FC = () => {
    const {
        isApplyDisabled,
        setIsApplyDisabledState,
        maxDateFrom,
        minDateTo,
        onChangeDatePickerFrom,
        onChangeDatePickerTo,
        getPhrase,
        formatDateDMY,
        availableFilters,
        selectedDatesFilters,
        onClearDatesFilter,
        onApply,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isApplyDisabled: stores.mediaCenterStore.isApplyDisabled,
        maxDateFrom: stores.mediaCenterStore.datePickerFromState,
        minDateTo: stores.mediaCenterStore.datePickerToState,
        setIsApplyDisabledState: stores.mediaCenterStore.setIsApplyDisabledState,
        onChangeDatePickerFrom: stores.mediaCenterStore.onChangeDatePickerFrom,
        onChangeDatePickerTo: stores.mediaCenterStore.onChangeDatePickerTo,
        formatDateDMY: stores.mediaCenterStore.formatDateDMY,
        availableFilters: stores.mediaCenterStore.filters,
        selectedDatesFilters: stores.mediaCenterStore.selectedDatesFilters,
        onClearDatesFilter: stores.mediaCenterStore.onClearDatesFilter,
        onApply: stores.mediaCenterStore.onApplyDateFilter,
    }));

    const [isActiveFromDrawer, setIsActiveFromDrawer] = useState(false);
    const [isActiveToDrawer, setIsActiveToDrawer] = useState(false);
    const isMobile = useMobileViewport();

    const onApplyFromDrawer = (): void => {
        onApply(false);
        setIsActiveFromDrawer(false);
    };

    const onApplyToDrawer = (): void => {
        onApply(false);
        setIsActiveToDrawer(false);
    };

    useEffect(() => {
        if (isApplyDisabled && (!!maxDateFrom || !!minDateTo)) {
            setIsApplyDisabledState(false);
        } else if (!isApplyDisabled && !maxDateFrom && !minDateTo) {
            setIsApplyDisabledState(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxDateFrom, minDateTo]);

    if (isMobile) {
        return (
            <div data-tid='date-filter-mobile' className={classNames('date-filter-mobile', styles.dateFilterMobile)}>
                <div className='date-filter-mobile__date-picker'>
                    <FakeInput
                        id='search-from-mobile'
                        staticIcon={<IconCalendar />}
                        label={getPhrase(SitecoreDictionary.GlobalsLabelsFrom)}
                        placeholder={getPhrase(SitecoreDictionary.PressHubFiltersPlaceHoldersFromField)}
                        value={formatDateDMY(maxDateFrom)}
                        onClick={(): void => setIsActiveFromDrawer(true)}
                        showClearButton={false}
                        highlightWhenFull
                    />
                </div>
                <div className='date-filter-mobile__date-picker'>
                    <FakeInput
                        id='search-to-mobile'
                        staticIcon={<IconCalendar />}
                        label={getPhrase(SitecoreDictionary.PressHubFiltersLabelsTo)}
                        placeholder={getPhrase(SitecoreDictionary.PressHubFiltersPlaceHoldersToField)}
                        value={formatDateDMY(minDateTo)}
                        onClick={(): void => setIsActiveToDrawer(true)}
                        showClearButton={false}
                        highlightWhenFull
                    />
                </div>

                <div className='date-filter-calendar-drawer'>
                    <CalendarFilterDrawer
                        id='search-from-drawer-input'
                        label={getPhrase(SitecoreDictionary.GlobalsLabelsFrom)}
                        value={maxDateFrom}
                        minDate={MIN_ARTICLE_DATE}
                        maxDate={minDateTo || new Date()}
                        placeholder={
                            !maxDateFrom ? getPhrase(SitecoreDictionary.PressHubFiltersPlaceHoldersFromField) : ''
                        }
                        isDrawerActive={isActiveFromDrawer}
                        onCancel={(): void => setIsActiveFromDrawer(false)}
                        onApply={onApplyFromDrawer}
                        onChange={onChangeDatePickerFrom}
                    />
                    <CalendarFilterDrawer
                        id='search-to-drawer-input'
                        label={getPhrase(SitecoreDictionary.PressHubFiltersLabelsTo)}
                        value={minDateTo}
                        minDate={maxDateFrom || MIN_ARTICLE_DATE}
                        maxDate={new Date()}
                        placeholder={!minDateTo ? getPhrase(SitecoreDictionary.PressHubFiltersPlaceHoldersToField) : ''}
                        isDrawerActive={isActiveToDrawer}
                        onCancel={(): void => setIsActiveToDrawer(false)}
                        onApply={onApplyToDrawer}
                        onChange={onChangeDatePickerTo}
                    />
                </div>

                <PredefinedTimePeriods />

                <SelectedFilters
                    selectedFilters={selectedDatesFilters}
                    onClearAll={onClearDatesFilter}
                    onRemoveFilter={onClearDatesFilter}
                    availableFilters={availableFilters}
                />
            </div>
        );
    }

    return (
        <>
            <div data-tid='date-filter' className={classNames('date-filter', styles.dateFilter)}>
                <CalendarFilterDesktop
                    id='search-from'
                    value={maxDateFrom}
                    minDate={MIN_ARTICLE_DATE}
                    maxDate={minDateTo || new Date()}
                    label={getPhrase(SitecoreDictionary.GlobalsLabelsFrom)}
                    placeholder={!maxDateFrom ? getPhrase(SitecoreDictionary.PressHubFiltersPlaceHoldersFromField) : ''}
                    onChange={onChangeDatePickerFrom}
                />

                <CalendarFilterDesktop
                    id='search-to'
                    value={minDateTo}
                    minDate={maxDateFrom || MIN_ARTICLE_DATE}
                    maxDate={new Date()}
                    label={getPhrase(SitecoreDictionary.PressHubFiltersLabelsTo)}
                    placeholder={!minDateTo ? getPhrase(SitecoreDictionary.PressHubFiltersPlaceHoldersToField) : ''}
                    onChange={onChangeDatePickerTo}
                />
            </div>
            <PredefinedTimePeriods />
        </>
    );
};

export default observer(DateFilter);
