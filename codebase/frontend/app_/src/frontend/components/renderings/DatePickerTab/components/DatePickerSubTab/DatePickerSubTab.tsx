import React, { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { Dayjs } from 'dayjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IDatePickerTabAnswers, TDatePickerAnswer } from 'models/data/IHolidayInspiration';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import DatePickerComponent from 'frontend/components/common/DatePickerComponent/DatePickerComponent';
import FlexibilityPills from 'frontend/components/common/Pills/FlexibilityPills/FlexibilityPills';

import { calculateExcludedDates } from './DatePickerSubTab.utils';

import styles from './DatePickerSubTab.module.scss';

export interface IDatePickerSubTabProps {
    ChangeMonthCTA: ISitecoreField<string>;
    FlexibleDatesLabel: ISitecoreField<string>;
    IsCROVariant: TSitecoreCheckboxValue;
    Subtitle: ISitecoreField<string>;
    flexibleDays: number;
    nightLabel: string;
    selectedDates: TDatePickerAnswer;
    setFlexibleDays: Dispatch<SetStateAction<number>>;
    setSelectedDates: Dispatch<TDatePickerAnswer>;
}

const DatePickerSubTab: FC<IDatePickerSubTabProps> = ({
    selectedDates,
    setSelectedDates,
    ChangeMonthCTA,
    Subtitle,
    FlexibleDatesLabel,
    flexibleDays,
    setFlexibleDays,
    nightLabel,
    IsCROVariant,
}) => {
    const {
        availableDates,
        loadAvailableDates,
        isAvailableDatesLoading,
        firstAvailableDate,
        lastAvailableDate,
        setAnswer,
    } = useStore((stores: IHolidaysStores) => ({
        availableDates: stores.inspireMeStore.availableDates,
        loadAvailableDates: stores.inspireMeStore.loadAvailableDates,
        isAvailableDatesLoading: stores.inspireMeStore.isAvailableDatesLoading,
        firstAvailableDate: stores.inspireMeStore.firstAvailableDate,
        lastAvailableDate: stores.inspireMeStore.lastAvailableDate,
        setAnswer: stores.inspireMeStore.setAnswer,
    }));

    const [excludedDates, setExcludedDates] = useState<Date[]>([]);

    useEffect(() => {
        if (selectedDates[0] && !selectedDates[1]) {
            const dates = calculateExcludedDates(availableDates, 'in');
            setExcludedDates(dates);
        } else {
            const dates = calculateExcludedDates(availableDates, 'out');
            setExcludedDates(dates);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableDates.length, selectedDates]);

    const handleCalendarChange = (dates: TDatePickerAnswer): void => {
        setSelectedDates(dates);
        setStoreAnswer(dates, flexibleDays);
    };

    const onFlexibilityPillChange = (value: number): void => {
        setFlexibleDays(value);
        setStoreAnswer(selectedDates, value);
    };

    const setStoreAnswer = (dates: TDatePickerAnswer, flexibleDaysValue: number): void => {
        const storeAnswer = dates[1] ? { from: dates[0], to: dates[1], flexibleDays: flexibleDaysValue } : null;
        setAnswer<IDatePickerTabAnswers | null>(storeAnswer);
    };

    const updateAvailableDates = async (firstDate: Dayjs, secondDate?: Dayjs): Promise<void> => {
        loadAvailableDates(firstDate, secondDate);
    };

    if (!firstAvailableDate || !lastAvailableDate) {
        return null;
    }

    return (
        <div className={styles.datePickerContent} data-tid='inspire-me-date-picker'>
            <Text tag='p' field={FlexibleDatesLabel} data-tid='flexible-dates-label' />
            <div className={styles.wrapper}>
                <FlexibilityPills
                    onChange={onFlexibilityPillChange}
                    flexDays={flexibleDays}
                    className={styles.flexibilityPills}
                />
                <span className={styles.selectedNights} data-tid='inspire-me-date-picker-nights-count'>
                    {nightLabel}
                </span>
            </div>
            <Text tag='p' field={Subtitle} data-tid='inspire-me-date-picker-subtitle' />
            <DatePickerComponent
                maxDate={new Date(lastAvailableDate)}
                minDate={new Date(firstAvailableDate)}
                selectedDates={selectedDates}
                onChange={handleCalendarChange}
                excludedDates={excludedDates}
                onChangeShownDates={updateAvailableDates}
                isLoading={isAvailableDatesLoading}
                changeMonthButtonLabel={ChangeMonthCTA}
                IsCROVariant={IsCROVariant}
            />
        </div>
    );
};

export default observer(DatePickerSubTab);
