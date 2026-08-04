import React, { FC, useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { TEN } from 'code/commonNumbers';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { debounce } from 'frontend/utils/debounce';
import { getFirstNumbersFromString } from 'frontend/utils/numbers';
import {
    DATE_PICKER_CLASS,
    MONTH_NAME_CLASS,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchPodCalendar/constants';

import styles from './YearDropdown.module.scss';

interface IYearDropdownProps {
    minDate: Date;
}

interface IOption {
    label: number;
    value: number;
}

const TOP_VIEWPORT_RATIO = 0.4;

const YearDropdown: FC<IYearDropdownProps> = ({ minDate }) => {
    const { lastAvailableDate } = useStore((stores: TStores) => ({
        lastAvailableDate: stores.searchStore.searchWhen.lastAvailableDate,
    }));

    const [selectedYear, setSelectedYear] = useState<number>(minDate.getFullYear());
    const [isYearDropdownOpened, setIsYearDropdownOpened] = useState<boolean>(false);
    const isMobile = useMobileViewport();

    const openYearDropdown = (): void => {
        setIsYearDropdownOpened(true);
    };

    const closeYearDropdown = (): void => {
        setIsYearDropdownOpened(false);
    };

    const lastAvailableDateDependency = lastAvailableDate?.toString();
    const yearDropdownOptions = useMemo(() => {
        if (!lastAvailableDate) {
            return [
                {
                    value: minDate.getFullYear(),
                    label: minDate.getFullYear(),
                },
            ];
        }

        const firstYear = minDate.getFullYear();

        return new Array(lastAvailableDate.getFullYear() - firstYear + 1).fill({}).map((item, i) => ({
            value: firstYear + i,
            label: firstYear + i,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastAvailableDateDependency]);

    const onYearChange = ({ value }: IOption): void => {
        const months = document.querySelectorAll('.react-datepicker__month-container');
        // new value will be set up automatically after the scroll

        // Scroll to the month that matches the selected year
        for (const month of months) {
            const caption = month.querySelector('.react-datepicker__header');

            if (caption?.textContent?.includes(value.toString())) {
                month.scrollIntoView({ behavior: 'smooth', block: 'start' });
                break;
            }
        }
    };

    useEffect(() => {
        if (!isMobile) {
            return;
        }

        const allMonthElements = Array.from(document.querySelectorAll(`.${MONTH_NAME_CLASS}`));

        // set selected year based on the month in view
        const getViewedYear = debounce(() => {
            const closest = allMonthElements.filter(monthElement => {
                const rect = monthElement.getBoundingClientRect();
                const topThreshold = window.innerHeight * TOP_VIEWPORT_RATIO;

                return rect.top >= 0 && rect.top <= topThreshold;
            })[0];

            const visibleYear = closest?.textContent && getFirstNumbersFromString(closest.textContent);
            visibleYear && setSelectedYear(visibleYear);
        }, TEN);

        const handleScroll = (): void => {
            setIsYearDropdownOpened(false);
            getViewedYear();
        };

        const datePickerWrapper = document.querySelector(`.${DATE_PICKER_CLASS}`);

        datePickerWrapper?.addEventListener('scroll', handleScroll);

        return () => {
            datePickerWrapper?.removeEventListener('scroll', handleScroll);
        };
    }, [isMobile]);

    if (!isMobile) {
        return null;
    }

    return (
        <Select
            className={classNames('year-dropdown__select', styles.select)}
            classNamePrefix='custom-select'
            options={yearDropdownOptions}
            value={{
                value: selectedYear,
                label: selectedYear,
            }}
            onChange={onYearChange}
            menuIsOpen={isYearDropdownOpened}
            onMenuOpen={openYearDropdown}
            onMenuClose={closeYearDropdown}
        />
    );
};

export default observer(YearDropdown);
