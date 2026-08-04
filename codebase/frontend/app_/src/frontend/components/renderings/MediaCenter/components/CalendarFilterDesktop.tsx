import React, { FC, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

import { lockBodyScroll, prepareBodyScrollLock, unLockBodyScroll } from 'frontend/utils/ui.utils';
import { DynamicFlatPicker, TReactFlatpickr } from 'frontend/components/common/Calendar/components/FlatPickerDynamic';
import FakeInput from 'frontend/components/common/FakeInput/FakeInput';
import IconCalendar from 'frontend/components/icons/Calendar';

import SelectMonthYear from './SelectMonthYear';

export interface ICalendarFilterDesktopProps {
    id: string;
    label: string;
    maxDate: Date;
    minDate: Date;
    onChange: (dates: Date[]) => void;
    placeholder: string;
    value: Date | undefined;
}

const CalendarFilterDesktop: FC<ICalendarFilterDesktopProps> = props => {
    const calendarRef = useRef() as React.RefObject<TReactFlatpickr>;

    const onReady = (_, __, fp) => {
        fp.calendarContainer.classList.add('date-filter-calendar-wrapper');
    };

    const onOpen = (_, __, fp) => {
        lockBodyScroll();
        fp.calendarContainer.classList.add('active');
        const flatPickerMonthNode = fp.calendarContainer.querySelector('.flatpickr-month');

        if (!flatPickerMonthNode) return;

        ReactDOM.render(
            <SelectMonthYear
                className='year-dropdown__select'
                classNamePrefix='custom-select'
                minDate={props.minDate}
                maxDate={props.maxDate}
                value={props.value}
                calendarRef={calendarRef}
                hasOverlay={true}
                initialPickerState={{
                    month: (props.value || props.maxDate).getMonth(),
                    year: (props.value || props.maxDate).getFullYear(),
                }}
            />,
            flatPickerMonthNode,
        );
    };

    const onClose = (selectedDates, __, fp) => {
        // reset flatpicker to selected date
        fp.setDate(selectedDates[0]);
        unLockBodyScroll();
    };

    useEffect(() => {
        prepareBodyScrollLock();
    }, []);

    return (
        <DynamicFlatPicker
            calendarRef={calendarRef}
            value={props.value}
            options={{
                altInput: true,
                altFormat: 'd.m.Y',
                wrap: true,
                maxDate: props.maxDate,
                minDate: props.minDate,
                disableMobile: true,
                ignoredFocusElements: [],
            }}
            onChange={props.onChange}
            onReady={onReady}
            onOpen={onOpen}
            onClose={onClose}
        >
            {
                <FakeInput
                    id={props.id}
                    staticIcon={<IconCalendar />}
                    label={props.label}
                    placeholder={props.placeholder}
                    value={!!props.value ? props.value.toDateString() : ''}
                    showClearButton={false}
                />
            }
        </DynamicFlatPicker>
    );
};

export default CalendarFilterDesktop;
