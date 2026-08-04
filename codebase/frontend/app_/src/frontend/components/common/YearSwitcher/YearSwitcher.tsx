import { FC } from 'react';
import { ReactDatePickerCustomHeaderProps } from 'react-datepicker/dist/calendar';
import classNames from 'classnames';

import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import Button from 'frontend/components/common/Button';
import SvgArrow from 'frontend/components/icons-new/Arrow';

import styles from './YearSwitcher.module.scss';

type TYearSwitcherProps = Pick<
    ReactDatePickerCustomHeaderProps,
    'monthDate' | 'decreaseYear' | 'increaseYear' | 'prevYearButtonDisabled' | 'nextYearButtonDisabled'
> & {
    className?: string;
    labelClassName?: string;
};

const YearSwitcher: FC<TYearSwitcherProps> = props => {
    const {
        monthDate,
        decreaseYear,
        increaseYear,
        prevYearButtonDisabled,
        nextYearButtonDisabled,
        className,
        labelClassName,
    } = props;

    return (
        <div className={classNames(styles.wrapper, className)}>
            <Button
                aria-label='Previous Year'
                className={classNames(styles.button, styles.prevButton)}
                onClick={decreaseYear}
                disabled={prevYearButtonDisabled}
                removeDefaultClass
                dataTid='year-switcher-prev-year'
            >
                <SvgArrow />
            </Button>

            <div className={classNames(styles.label, labelClassName)} data-tid='year-switcher-current-year-label'>
                {formatDateL10n(monthDate, DATE_FORMATS.year)}
            </div>

            <Button
                aria-label='Next Year'
                className={classNames(styles.button, styles.nextButton)}
                onClick={increaseYear}
                disabled={nextYearButtonDisabled}
                removeDefaultClass
                dataTid='year-switcher-next-year'
            >
                <SvgArrow />
            </Button>
        </div>
    );
};

export default YearSwitcher;
