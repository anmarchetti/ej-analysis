import { FC, useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import classNames from 'classnames';
import dayjs from 'dayjs';

import { createDayjsDate, findClosestDate, isPeriodOutOfRange } from 'frontend/utils/date.utils';
import { IMonthHeaderProps } from 'models/data/IDataPicker';
import { TMonthOption, TYearOption } from 'models/data/ISelectOption';

import {
    createMonthOption,
    createYearOption,
    getMonthsOptions,
    getYearsOptions,
    isOptionDisabled,
} from './MonthYearSelector.utils';

import styles from './MonthYearSelector.module.scss';

const MonthYearSelector: FC<IMonthHeaderProps> = ({
    monthDate,
    changeYear,
    changeMonth,
    maxDate,
    minDate,
    onChangeShownDates,
}) => {
    const [selectedMonth, setSelectedMonth] = useState<TMonthOption>(() => createMonthOption(monthDate));
    const [selectedYear, setSelectedYear] = useState<TYearOption>(() => createYearOption(monthDate));

    useEffect(() => {
        setSelectedMonth(createMonthOption(monthDate));
        setSelectedYear(createYearOption(monthDate));
    }, [monthDate]);

    const monthsOptions: TMonthOption[] = useMemo(() => getMonthsOptions(), []);

    const yearOptions: TYearOption[] = useMemo(
        () => getYearsOptions(minDate, maxDate),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const monthChangeHandler = (selectedOption: TMonthOption): void => {
        const newMonth = selectedOption.value;

        setSelectedMonth(selectedOption);

        const fromDate = createDayjsDate(selectedYear.value, newMonth + 1, 1);
        // when displaying two months, the next month is also shown
        const toDate = dayjs(fromDate).add(1, 'month');

        onChangeShownDates(fromDate, toDate);
        changeMonth(newMonth);
    };

    const yearChangeHandler = (selectedOption: TYearOption): void => {
        const newYear = selectedOption.value;

        setSelectedYear(selectedOption);

        let fromDate = createDayjsDate(newYear, selectedMonth.value + 1, 1);
        let toDate = dayjs(fromDate).add(1, 'month');
        const isMonthOutOfRange = isPeriodOutOfRange([fromDate, toDate], [minDate, maxDate]);

        if (isMonthOutOfRange) {
            const closestAvailableDate = findClosestDate(fromDate, dayjs(minDate), dayjs(maxDate));
            const closestMonthIndex = closestAvailableDate.get('month');
            const closestMonthNumber = closestMonthIndex + 1;

            fromDate = createDayjsDate(newYear, closestMonthNumber, 1);
            toDate = dayjs(fromDate).add(1, 'month');

            setSelectedMonth(createMonthOption(fromDate));
            changeMonth(closestMonthIndex);
        }

        onChangeShownDates(fromDate, toDate);
        changeYear(newYear);
    };

    const calculateIfOptionDisabled = (option: TMonthOption): boolean =>
        isOptionDisabled(option, selectedYear, minDate, maxDate);

    return (
        <div className={styles.wrapper}>
            <Select
                key={`${selectedYear.value}`} // the key should be used to update month selector when the year changes
                options={monthsOptions}
                className={classNames('custom-select', styles.selector, styles.monthSelector)}
                classNamePrefix='custom-select'
                value={selectedMonth}
                onChange={monthChangeHandler}
                isOptionDisabled={calculateIfOptionDisabled}
                isSearchable={false}
                id='month-selector'
            />

            <Select
                options={yearOptions}
                className={classNames('custom-select', styles.selector, styles.yearSelector)}
                classNamePrefix='custom-select'
                value={selectedYear}
                onChange={yearChangeHandler}
                isSearchable={false}
                id='year-selector'
            />
        </div>
    );
};

export default MonthYearSelector;
