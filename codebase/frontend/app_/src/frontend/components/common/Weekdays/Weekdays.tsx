import React, { useMemo } from 'react';
import classNames from 'classnames';

import { MONDAY } from 'code/dates';

import getWeekdays, { WeekDayFormat } from './weekdays.utils';

import styles from './Weekdays.module.scss';

interface IWeekdaysProps {
    className?: string;
    format?: WeekDayFormat;
    weekStart?: number; // 0 = Sunday, 1 = Monday, etc.
}

const Weekdays: React.FC<IWeekdaysProps> = ({ className, format = WeekDayFormat.Min, weekStart = MONDAY }) => {
    const weekdays = useMemo(() => getWeekdays(format, weekStart), [format, weekStart]);

    return (
        <div className={classNames(styles.weekdays, className)}>
            {weekdays.map(day => (
                <span key={day}>{day}</span>
            ))}
        </div>
    );
};

export default Weekdays;
