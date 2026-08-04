import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import ChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import ChevronRight from 'frontend/components/icons-new/ChevronRight';

import styles from './MonthPicker.module.scss';

interface IMonthPickerProps {
    monthOptions: string[];
}

const MonthPicker: React.FC<IMonthPickerProps> = ({ monthOptions }) => {
    const { getPhrase, setSelectedMonth, selectedMonth, availableMonths, isScreenLessMedium } = useStore(
        (stores: IHolidaysStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            setSelectedMonth: stores.amendDatesStore.setSelectedMonth,
            selectedMonth: stores.amendDatesStore.selectedMonth,
            availableMonths: stores.amendDatesStore.availableMonths,
            isScreenLessMedium: stores.appStore.isScreenLessMedium,
        }),
    );

    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeMonth, setActiveMonth] = useState<string>();
    const monthPickerContentRef = useRef<HTMLDivElement>(null);
    const toggleDropdownRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (selectedMonth) {
            setActiveMonth(selectedMonth.toDateString());
            setSelectedYear(new Date(selectedMonth).getFullYear());
        }
    }, [selectedMonth]);

    const closeDropdown = useCallback(() => {
        setActiveMonth(selectedMonth.toDateString());
        setSelectedYear(new Date(selectedMonth).getFullYear());
        setIsDropdownOpen(false);
    }, [selectedMonth]);

    const handleClickOutside = useCallback(
        event => {
            // If clicking toggle button, ignore because we handle separately
            if (toggleDropdownRef.current?.contains(event.target)) {
                return;
            }

            if (monthPickerContentRef.current && !monthPickerContentRef.current.contains(event.target)) {
                closeDropdown();
            }
        },
        [closeDropdown],
    );

    // Listen for clicks outside of the dropdown and close it if clicked
    useEffect(() => {
        if (!isDropdownOpen) {
            return undefined;
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen, handleClickOutside]);

    const groupedMonths = monthOptions.reduce((acc, month) => {
        const year = new Date(month).getFullYear();
        acc[year] = acc[year] || [];
        acc[year].push(month);

        return acc;
    }, {});

    const minYear = Number(Object.keys(groupedMonths)[0]);
    const maxYear = Number(Object.keys(groupedMonths)[Object.keys(groupedMonths).length - 1]);

    const isMinYear = selectedYear === minYear;
    const isMaxYear = selectedYear === maxYear;

    const validateYear = (year: number) => {
        if (year < minYear) {
            return minYear;
        }

        if (year > maxYear) {
            return maxYear;
        }

        return year;
    };

    const applySelectedMonth = () => {
        setIsDropdownOpen(false);
        const newMonth = new Date(activeMonth as string);
        setSelectedMonth(newMonth);
    };

    const toggleDropdownOpen = () => {
        if (isDropdownOpen) {
            closeDropdown();

            return;
        }

        setIsDropdownOpen(!isDropdownOpen);
    };

    return (
        <div className={styles.monthPicker} data-tid='month-picker'>
            <Button
                className={styles.monthPickerButton}
                isText={isScreenLessMedium}
                isOutlined={!isScreenLessMedium}
                onClick={toggleDropdownOpen}
                aria-expanded={isDropdownOpen}
                aria-controls='month-picker-dropdown'
                dataTid='month-picker-button'
                ref={toggleDropdownRef}
            >
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                {getPhrase(SitecoreDictionary.DatePickerButtonsSelectMonth)}{' '}
                <i className='d-flex align-items-center ms-2' data-tid='month-picker-button-icon'>
                    <SvgChevronDown />
                </i>
            </Button>
            {isDropdownOpen ? (
                <div
                    id='month-picker-dropdown'
                    ref={monthPickerContentRef}
                    className={styles.monthPickerContent}
                    data-tid='month-picker-dropdown'
                >
                    <div className={styles.monthPickerControls} data-tid='month-picker-controls'>
                        <div className={styles.yearChange} data-tid='month-picker-year-change'>
                            {!isMinYear ? (
                                <button
                                    className={styles.yearChangeButton}
                                    type='button'
                                    onClick={() => setSelectedYear(prevYear => validateYear(prevYear - 1))}
                                    data-tid='month-picker-year-decrement'
                                >
                                    <ChevronLeft />
                                </button>
                            ) : null}

                            <span
                                className={classNames(
                                    styles.yearChangeInput,
                                    isMinYear && styles.minYear,
                                    isMaxYear && styles.maxYear,
                                )}
                                data-tid='month-picker-year-input'
                            >
                                {selectedYear}
                            </span>

                            {!isMaxYear ? (
                                <button
                                    className={styles.yearChangeButton}
                                    type='button'
                                    onClick={() => setSelectedYear(prevYear => validateYear(prevYear + 1))}
                                    data-tid='month-picker-year-increment'
                                >
                                    <ChevronRight />
                                </button>
                            ) : null}
                        </div>
                        <div className={styles.monthsGridContainer} data-tid='month-picker-grid-container'>
                            <ul className={styles.monthsGrid} data-tid='month-picker-grid'>
                                {groupedMonths[selectedYear]?.map(month => {
                                    const isMonthUnavailable = !availableMonths?.includes(month);

                                    return (
                                        <li
                                            key={month}
                                            className={classNames({
                                                [styles.active]: activeMonth === month && !isMonthUnavailable,
                                                [styles.unavailable]: isMonthUnavailable,
                                            })}
                                            data-tid='month-picker-grid-item'
                                        >
                                            <Button
                                                disabled={isMonthUnavailable}
                                                onClick={() => setActiveMonth(month)}
                                                data-tid={`month-picker-grid-button-${formatDateL10n(month, 'MMM')}`}
                                            >
                                                {formatDateL10n(month, 'MMM')}
                                            </Button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                    <div className={styles.monthPickerActions}>
                        <Button isFullWidth onClick={applySelectedMonth} data-tid='month-picker-apply-button'>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                        </Button>
                    </div>
                </div>
            ) : null}
            {isDropdownOpen && isScreenLessMedium ? (
                <div className={styles.pageGreyOverlay} data-tid='month-picker-overlay' />
            ) : null}
        </div>
    );
};

export default observer(MonthPicker);
