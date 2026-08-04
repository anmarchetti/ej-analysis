import React, { FC, useMemo } from 'react';
import ReactFlatpickr, { DateTimePickerProps } from 'react-flatpickr';
import classNames from 'classnames';
import flatpickr from 'flatpickr';

import { MONDAY } from 'code/dates';

import 'flatpickr/dist/flatpickr.css';
import styles from './FlatPicker.module.scss';

export interface IFlatPickerProps extends DateTimePickerProps {
    calendarRef?: React.RefObject<ReactFlatpickr>;
    withOpenedCalendar?: boolean;
}

const FlatPicker: FC<IFlatPickerProps> = ({ calendarRef, className, withOpenedCalendar, ...props }) => {
    /**
     * Memoized to prevent a production-only bug where date clicks do nothing.
     * react-flatpickr diffs options by reference (===), so an inline locale object triggers
     * flatpickr.set('locale', ...) every render, which calls clearNode(daysContainer) and
     * rebuilds all day elements. In production this DOM mutation can land between mousedown
     * and mouseup, causing the browser to suppress the click event entirely.
     * See: https://github.com/haoxins/react-flatpickr#the-date-picker-closes-after-a-value-is-selected
     */
    const locale = useMemo(
        () => ({
            firstDayOfWeek: MONDAY,
            ...(props.options?.locale as flatpickr.Locale | undefined),
        }),
        // Only recompute if the caller's locale actually changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.options?.locale],
    );

    return (
        <div
            className={classNames(
                styles.datePickerDynamic,
                'flat-picker',
                { [styles.datePicker]: withOpenedCalendar },
                className,
            )}
        >
            <ReactFlatpickr ref={calendarRef} {...props} options={{ ...props.options, locale }} />
        </div>
    );
};
export default FlatPicker;
