import React, { FC, ReactElement, RefObject, useMemo, useRef } from 'react';
import DatePicker from 'react-datepicker';
import { ReactDatePickerCustomHeaderProps } from 'react-datepicker/dist/calendar';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import dayjs from 'dayjs';

import useResize from 'frontend/hooks/useResize';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { customLocale } from 'frontend/utils/customLangConfig';
import { IDatePickerComponentProps } from 'models/data/IDataPicker';
import { TDatePickerAnswer } from 'models/data/IHolidayInspiration';
import { KeyboardKey } from 'models/enum/KeyboardKey';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import FlyingPlaneAnimation from 'frontend/components/common/FlyingPlaneAnimation/FlyingPlaneAnimation';
import useReactDataPickerFocus from 'frontend/components/renderings/SearchPod/hooks/useReactDataPickerFocus';

import MonthHeader from './components/MonthHeader/MonthHeader';

import styles from './DatePickerComponent.module.scss';

export const TWO_MONTHS_DATE_PICKER_MIN_WIDTH = 640;
const ONE_MONTH = 1;
const TWO_MONTHS = 2;
const SENSITIVE_KEYBOARD_KEYS = [
    KeyboardKey.ArrowLeft,
    KeyboardKey.ArrowRight,
    KeyboardKey.ArrowUp,
    KeyboardKey.ArrowDown,
];

const DatePickerComponent: FC<IDatePickerComponentProps> = props => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { minDate, maxDate, selectedDates, excludedDates, isLoading, onChange } = props;

    const datePickerRef: RefObject<DatePicker> | null = useRef(null);
    const datePickerWrapper: RefObject<HTMLDivElement> | null = useRef(null);

    useReactDataPickerFocus({ datePickerWrapper });
    const { width: datePickerWrapperWidth } = useResize(datePickerWrapper);
    const isOneMonthView = useMemo(
        () => datePickerWrapperWidth <= TWO_MONTHS_DATE_PICKER_MIN_WIDTH,
        [datePickerWrapperWidth],
    );

    const onChangeHandler = (dates: [Date | null, Date | null] | Date | null): void => {
        if (!Array.isArray(dates)) {
            return;
        }

        const [start, end] = dates;

        const safeDates: TDatePickerAnswer = [start ?? undefined, end ?? undefined];

        if (dayjs(start).isSame(end)) {
            return;
        }

        onChange(safeDates);
    };

    const renderHeader = (customHeaderProps: ReactDatePickerCustomHeaderProps): ReactElement => (
        <MonthHeader {...props} {...customHeaderProps} isOneMonthView={isOneMonthView} />
    );

    return (
        <div className={styles.wrapper} ref={datePickerWrapper}>
            {isLoading && (
                <div className={styles.animation}>
                    <Text>{getPhrase(SitecoreDictionary.GlobalsLabelsLoading)}</Text>
                    <FlyingPlaneAnimation />
                </div>
            )}

            <DatePicker
                ref={datePickerRef}
                inline
                renderCustomHeader={renderHeader}
                monthsShown={isOneMonthView ? ONE_MONTH : TWO_MONTHS}
                selectsRange
                onChange={onChangeHandler}
                startDate={selectedDates[0] ?? undefined}
                endDate={selectedDates[1]}
                excludeDates={excludedDates}
                minDate={minDate}
                maxDate={maxDate}
                locale={customLocale as any}
                calendarClassName={classNames(styles.datePicker, isOneMonthView && styles.oneMonth)}
                fixedHeight
                calendarStartDay={dayjs.localeData().firstDayOfWeek() as any}
            />
        </div>
    );
};

export default DatePickerComponent;
