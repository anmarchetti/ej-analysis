import { FC } from 'react';
import classNames from 'classnames';
import { Dayjs } from 'dayjs';

import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import SvgCalendarLined from 'frontend/components/icons-new/CalendarLined';
import SvgTick from 'frontend/components/icons-new/Tick';

import styles from './Month.module.scss';

export interface IMonthProps {
    day: Dayjs;
    index: number;
    isMonthDisabled: boolean;
    isMonthSelected: boolean;
    onMonthClick: (day: Dayjs) => void;
}

const Month: FC<IMonthProps> = ({ day, onMonthClick, isMonthSelected, isMonthDisabled, index }) => {
    const yearId = `year-${index}`;
    const monthId = `month-${index}`;

    return (
        <button
            data-tid='month'
            onClick={(): void => onMonthClick(day)}
            className={classNames(
                styles.month,
                isMonthSelected && styles.selectedMonth,
                isMonthDisabled && styles.disabledMonth,
            )}
            disabled={isMonthDisabled}
            aria-labelledby={`${yearId} ${monthId}`}
        >
            <SvgTick className={styles.tickIcon} />
            <SvgCalendarLined className={styles.icon} />
            <span id={monthId} className={styles.monthName}>
                {formatDateL10n(day, DATE_FORMATS.fullMonth)}
            </span>
            <span id={yearId} className={styles.year}>
                {formatDateL10n(day, DATE_FORMATS.year)}
            </span>
        </button>
    );
};

export default Month;
