import { FC } from 'react';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IMonthItem } from 'models/data/IMonthAvailability';
import IconCalendar from 'frontend/components/icons/Calendar';
import SvgTick from 'frontend/components/icons-new/Tick';

import styles from './MonthOptionOld.module.scss';

export interface IMonthOptionProps {
    isVisible: boolean;
    month: IMonthItem;
    onMonthChange: (month: IMonthItem) => void;
}

const MonthOption: FC<IMonthOptionProps> = ({ month, isVisible, onMonthChange }) => {
    const { from } = useStore((stores: TStores) => ({
        from: stores.searchStore.searchWhen.from,
    }));

    const isAvailable = month.availability ?? false;
    const id = `${month.monthName}-${month.year}`;
    const isMonthSelected = month.date.isSame(dayjs(from), 'month');

    return (
        <div key={id} aria-hidden={!isVisible} data-tid='month-option'>
            <input
                type='radio'
                name='month'
                value={id}
                disabled={!isAvailable}
                checked={isMonthSelected}
                onChange={(): void => onMonthChange(month)}
                aria-label={`${month.monthName} ${month.year}`}
                aria-checked={isMonthSelected}
                aria-disabled={!isAvailable}
                aria-hidden={!isVisible}
                id={id}
                className={styles.input}
                data-tid={`${id}-input`}
            />
            <label
                htmlFor={id}
                className={classNames(
                    styles.monthLabel,
                    !isAvailable && styles.disabledMonthLabel,
                    isMonthSelected && styles.selectedMonthLabel,
                )}
                data-tid={`${id}-label`}
            >
                <SvgTick className={styles.tickIcon} />
                <IconCalendar className={styles.calendarIcon} isUnwrapped />
                <span className={styles.monthName}>{month.monthName}</span>
                <span className={styles.year}>{month.year}</span>
            </label>
        </div>
    );
};

export default observer(MonthOption);
