import { FC, ReactElement } from 'react';
import DatePicker from 'react-datepicker';
import { ReactDatePickerCustomHeaderProps } from 'react-datepicker/dist/calendar';
import dayjs from 'dayjs';

import { DATE_FORMATS } from 'code/dates';
import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import { customLocale } from 'frontend/utils/customLangConfig';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IMonthHeaderProps } from 'models/data/IDataPicker';
import YearSwitcher from 'frontend/components/common/YearSwitcher/YearSwitcher';

import ChangeMonthButton from './components/ChangeMonthButton/ChangeMonthButton';
import Month from './components/Month/Month';

const MonthPicker: FC<IMonthHeaderProps> = ({
    monthDate,
    changeYear,
    changeMonth,
    onChangeShownDates,
    minDate,
    maxDate,
    isOneMonthView,
    changeMonthButtonLabel,
}) => {
    const isExtraSmallMobile = useXSMobileViewport();
    const formatedMonthYear = formatDateL10n(monthDate, DATE_FORMATS.fullMonthAndYear);

    const renderMonthContent = (month: number): ReactElement => <Month month={month} />;

    const renderHeader = (props: ReactDatePickerCustomHeaderProps): ReactElement => {
        const { decreaseYear, increaseYear, prevYearButtonDisabled, nextYearButtonDisabled, monthDate } = props;

        return (
            <YearSwitcher
                monthDate={monthDate}
                decreaseYear={decreaseYear}
                increaseYear={increaseYear}
                prevYearButtonDisabled={prevYearButtonDisabled}
                nextYearButtonDisabled={nextYearButtonDisabled}
            />
        );
    };

    const onModalChange = (date: Date): void => {
        // when displaying two months, the next month is also shown
        const secondMonthAfterSelected = dayjs(date).add(1, 'month');
        onChangeShownDates(dayjs(date), secondMonthAfterSelected);
        changeMonth(date.getMonth());
        changeYear(date.getFullYear());
    };

    return (
        <DatePicker
            selected={monthDate}
            onChange={onModalChange}
            dateFormat='MMMM, yyyy'
            showMonthYearPicker
            minDate={minDate}
            maxDate={maxDate}
            locale={customLocale as any}
            renderMonthContent={renderMonthContent}
            popperPlacement={isOneMonthView ? 'bottom-center' : 'bottom-start'}
            renderCustomHeader={renderHeader}
            withPortal={isExtraSmallMobile}
            customInput={
                <ChangeMonthButton label={isExtraSmallMobile ? formatedMonthYear : changeMonthButtonLabel.value} />
            }
        />
    );
};

export default MonthPicker;
