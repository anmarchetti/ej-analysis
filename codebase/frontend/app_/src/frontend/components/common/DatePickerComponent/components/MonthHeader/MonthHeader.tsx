import { FC } from 'react';
import classNames from 'classnames';
import dayjs from 'dayjs';

import { DATE_FORMATS } from 'code/dates';
import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { IMonthHeaderProps } from 'models/data/IDataPicker';
import Button from 'frontend/components/common/Button';
import SvgArrow from 'frontend/components/icons-new/Arrow';

import MonthPicker from './components/MonthPicker/MonthPicker';
import MonthYearSelector from './components/MonthYearSelector/MonthYearSelector';

import styles from './MonthHeader.module.scss';

const MonthHeader: FC<IMonthHeaderProps> = props => {
    const {
        monthDate,
        customHeaderCount,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
        onChangeShownDates,
        isOneMonthView,
        IsCROVariant,
    } = props;

    const onPrevMonthClick = (): void => {
        decreaseMonth();
    };

    const onNextMonthClick = (): void => {
        // when displaying two months, the next month is also shown
        const secondMonthAfterSelected = dayjs(monthDate).add(1, 'month');
        onChangeShownDates(secondMonthAfterSelected);
        increaseMonth();
    };

    const isFirstMonthHeader = customHeaderCount === 0;
    const isSecondMonthHeader = customHeaderCount === 1;

    const isPrevButtonDisabled = isOneMonthView
        ? prevMonthButtonDisabled
        : isSecondMonthHeader || prevMonthButtonDisabled;
    const isNextButtonDisabled = isOneMonthView
        ? nextMonthButtonDisabled
        : isFirstMonthHeader || nextMonthButtonDisabled;
    const formattedMonthYear = formatDateL10n(monthDate, DATE_FORMATS.fullMonthAndYear);

    const isSelectShown = isSitecoreCheckboxSelected(IsCROVariant);

    const isExtraSmallMobile = useXSMobileViewport();

    return (
        <div className={styles.header}>
            {isFirstMonthHeader && !isExtraSmallMobile && <MonthPicker {...props} />}

            <div className={styles.wrapper}>
                <Button
                    aria-label='Previous Month'
                    className={classNames(styles.button, styles.prevButton, isPrevButtonDisabled && styles.hidden)}
                    onClick={onPrevMonthClick}
                    removeDefaultClass
                    dataTid='month-year-picker-prev-button'
                    tabIndex={0}
                >
                    <SvgArrow />
                </Button>

                {!isExtraSmallMobile && (
                    <div className={styles.monthName} data-tid='month-year-picker-current-month-label'>
                        {formattedMonthYear}
                    </div>
                )}
                {isExtraSmallMobile && !isSelectShown && <MonthPicker {...props} />}
                {isExtraSmallMobile && isSelectShown && <MonthYearSelector {...props} />}

                <Button
                    aria-label='Next Month'
                    className={classNames(styles.button, styles.nextButton, isNextButtonDisabled && styles.hidden)}
                    onClick={onNextMonthClick}
                    removeDefaultClass
                    dataTid='month-year-picker-next-button'
                    tabIndex={0}
                >
                    <SvgArrow />
                </Button>
            </div>
        </div>
    );
};

export default MonthHeader;
