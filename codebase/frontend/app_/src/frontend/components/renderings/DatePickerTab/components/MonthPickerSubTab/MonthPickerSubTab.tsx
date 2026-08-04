import React, { Dispatch, FC, useMemo } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { Dayjs } from 'dayjs';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { isDateIncludedInArray } from 'frontend/utils/date.utils';
import { IDatePickerTabAnswers } from 'models/data/IHolidayInspiration';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import MonthPicker from 'frontend/components/common/MonthPicker/MonthPicker';

import { getFirstAvailableMonth } from './MonthPickerSubTab.utils';

import styles from './MonthPickerSubTab.module.scss';

const TWELVE_MONTHS = 12;

export interface IMonthPickerSubTabProps {
    MonthPickerSubtitle: ISitecoreField<string>;
    MonthPickerTitle: ISitecoreField<string>;
    selectedMonths: Dayjs[];
    setSelectedMonths: Dispatch<Dayjs[]>;
}

const MonthPickerSubTab: FC<IMonthPickerSubTabProps> = ({
    MonthPickerTitle,
    MonthPickerSubtitle,
    selectedMonths,
    setSelectedMonths,
}) => {
    const { availableQuizAnswers, setAnswer } = useStore((stores: IHolidaysStores) => ({
        availableQuizAnswers: stores.inspireMeStore.availableQuizAnswers,
        setAnswer: stores.inspireMeStore.setAnswer,
    }));

    const monthPickerData = useMemo(() => {
        const startDate = getFirstAvailableMonth(availableQuizAnswers?.availableMonths || []);

        return {
            startDate,
            endDate: startDate.add(TWELVE_MONTHS, 'month'),
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onMonthSelect = (day: Dayjs): void => {
        const isMonthSelected = isDateIncludedInArray(day, selectedMonths);
        const newMonths = isMonthSelected
            ? selectedMonths.filter(selectedMonth => !selectedMonth.isSame(day, 'day'))
            : [...selectedMonths, day];

        setSelectedMonths(newMonths);
        const storeAnswer = newMonths.length ? { months: newMonths } : null;
        setAnswer<IDatePickerTabAnswers | null>(storeAnswer);
    };

    return (
        <div className={styles.monthPickerContent} data-tid='inspire-me-month-picker'>
            <div className={styles.monthsPickerHeader} data-tid='inspire-me-month-picker-header'>
                <Text
                    tag='h5'
                    field={MonthPickerTitle}
                    className={styles.monthsPickerTitle}
                    data-tid='inspire-me-month-picker-title'
                />
                <Text
                    tag='h5'
                    field={MonthPickerSubtitle}
                    className={styles.monthsPickerSubtitle}
                    data-tid='inspire-me-month-picker-subtitle'
                />
            </div>
            <MonthPicker
                endDate={monthPickerData.endDate}
                onMonthClick={onMonthSelect}
                selectedMonths={selectedMonths}
                startDate={monthPickerData.startDate}
                availableMonths={availableQuizAnswers?.availableMonths}
            />
        </div>
    );
};

export default MonthPickerSubTab;
