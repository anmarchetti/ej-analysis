import React, { useEffect, useState } from 'react';
import Select from 'react-select';

import { getMonthName } from 'frontend/utils/date.utils';
import { TReactFlatpickr } from 'frontend/components/common/Calendar/components/FlatPickerDynamic';
import DropdownIndicator from 'frontend/components/common/Select/DropdownIndicator/DropdownIndicator';
import MenuList from 'frontend/components/common/Select/MenuList';
import Option from 'frontend/components/common/Select/Option';

interface ISelectMonthOption {
    label: string;
    value: number;
}

export interface IPickerMonthYearState {
    month: number;
    year: number;
}

export interface IFiltersContainerProps {
    calendarRef: React.RefObject<TReactFlatpickr>;
    hasOverlay: boolean;
    initialPickerState: IPickerMonthYearState;
    maxDate: Date;
    minDate: Date;
    value: Date | undefined;
    className?: string;
    classNamePrefix?: string;
}

const MAX_MENU_HEIGHT = 210;

export const SelectMonthYear: React.FC<IFiltersContainerProps> = props => {
    const [isMonthsDropdownOpened, toggleMonthsDropdownOpened] = useState(false);
    const [currentPickerState, setCurrentPickerState] = useState(props.initialPickerState);

    const getOptionLabel = (month: number, year: number): string => `${getMonthName(month)} ${year}`;

    const getActiveMonthOption = (): ISelectMonthOption => ({
        value: 0,
        label: getOptionLabel(currentPickerState.month, currentPickerState.year),
    });

    const getOptions = (): ISelectMonthOption[] => {
        const options: ISelectMonthOption[] = [];
        const { minDate, maxDate } = props;
        const numberOfMonthsAvailable =
            (maxDate.getFullYear() - minDate.getFullYear()) * 12 + maxDate.getMonth() - minDate.getMonth() + 1;

        for (let i = 0; i < numberOfMonthsAvailable; i++) {
            const date = new Date(minDate.getFullYear(), minDate.getMonth() + i);
            const year = date.getFullYear();
            const month = date.getMonth();

            options.push({
                value: (year - currentPickerState.year) * 12 + month - currentPickerState.month,
                label: getOptionLabel(month, year),
            });
        }

        return options.reverse();
    };

    const onChangeMonthYear = ({ value }: ISelectMonthOption): void => {
        const flatpickr = props.calendarRef.current?.flatpickr;

        if (flatpickr) {
            // Don't use flatpickr.changeMonth(value), because it set wrong date if need jump by 2 and more years. (EJH-15124)
            flatpickr.jumpToDate(new Date(flatpickr.currentYear, flatpickr.currentMonth + value, 1), true);
        }

        toggleMonthsDropdownOpened(false);
    };

    interface IFlatpickrInstance {
        currentMonth: number;
        currentYear: number;
    }

    const onMonthChange = (_: Date[], __: string, fp: IFlatpickrInstance): void => {
        setCurrentPickerState({ month: fp.currentMonth, year: fp.currentYear });
    };

    const overlayClickHandler = e => {
        e.preventDefault();
        toggleMonthsDropdownOpened(false);
    };

    useEffect(() => {
        if (props.calendarRef.current) {
            props.calendarRef.current.flatpickr.config.onMonthChange.push(onMonthChange); // add monthChange handler to flatpicker
        }
    }, [props.calendarRef.current]);

    useEffect(() => {
        const ignoreFocus = elements => props.calendarRef.current?.flatpickr.set('ignoredFocusElements', elements);

        // for IE 11 to fix bug when clicking on month dropdown
        if (!!window.MSInputMethodContext && !!(document as any).documentMode) {
            // if is IE 11: disable closing flatpickr on months dropdown click
            isMonthsDropdownOpened ? ignoreFocus(null) : setTimeout(() => ignoreFocus([]), 100);
        } else {
            ignoreFocus(
                isMonthsDropdownOpened
                    ? [
                          document.querySelector('.year-dropdown__overlay'),
                          document.querySelector('.custom-select__menu-list'),
                      ]
                    : [],
            );
        }
    }, [isMonthsDropdownOpened]);

    useEffect(() => {
        setCurrentPickerState(props.initialPickerState); // reset dropdown to selected month/year when the calendar opens
    }, [props.initialPickerState]);

    return (
        <Select
            className={props.className}
            classNamePrefix={props.classNamePrefix}
            options={getOptions()}
            value={getActiveMonthOption()}
            isSearchable={false}
            components={{ DropdownIndicator, MenuList, Option }}
            onMenuOpen={() => {
                toggleMonthsDropdownOpened(true);
            }}
            onOverlayClick={overlayClickHandler}
            menuIsOpen={isMonthsDropdownOpened}
            hasOverlay={props.hasOverlay && isMonthsDropdownOpened}
            blurInputOnSelect={true}
            maxMenuHeight={MAX_MENU_HEIGHT}
            onChange={onChangeMonthYear}
        />
    );
};

export default SelectMonthYear;
