import { FC, KeyboardEvent, RefObject } from 'react';
import { ReactDatePickerCustomHeaderProps } from 'react-datepicker/dist/calendar';
import classNames from 'classnames';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { KeyboardKey } from 'models/enum/KeyboardKey';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import SvgArrow from 'frontend/components/icons-new/Arrow';
import { MONTH_NAME_CLASS } from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchPodCalendar/constants';

import styles from './SPMonthHeader.module.scss';

interface ISPMonthHeaderProps extends ReactDatePickerCustomHeaderProps {
    datePickerWrapper: RefObject<HTMLDivElement> | null;
}

const SPMonthHeader: FC<ISPMonthHeaderProps> = ({
    monthDate,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
    customHeaderCount,
    datePickerWrapper,
}) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const formattedMonthYear = formatDateL10n(monthDate, DATE_FORMATS.fullMonthAndYear);
    const isFirstMonthHeader = customHeaderCount === 0;
    const isSecondMonthHeader = customHeaderCount === 1;

    const onNextMonthClick = (): void => {
        increaseMonth();
    };

    const onPrevMonthClick = (): void => {
        decreaseMonth();
    };

    const keyDownHandler = (event: KeyboardEvent, action: () => void): void => {
        if (event.key === KeyboardKey.ENTER || event.key === KeyboardKey.SPACE) {
            event.preventDefault();
            action();

            requestAnimationFrame(() => {
                // when click on show first\last available month, prev\next buttons disappear
                // focus set to body and search pod is closed
                if (!document.body.contains(event?.target as Node)) {
                    const firstAvailableDay: Nullable<HTMLElement> = datePickerWrapper?.current?.querySelector(
                        '.react-datepicker__day:not(.react-datepicker__day--disabled):not(.react-datepicker__day--outside-month)',
                    );

                    firstAvailableDay?.focus();
                }
            });
        }
    };

    const onPrevKeyDownHandler = (event: KeyboardEvent): void => {
        keyDownHandler(event, onPrevMonthClick);
    };

    const onNextKeyDownHandler = (event: KeyboardEvent): void => {
        keyDownHandler(event, onNextMonthClick);
    };

    return (
        <div className={styles.wrapper}>
            {isFirstMonthHeader && !prevMonthButtonDisabled && (
                <Button
                    className={classNames(styles.button, styles.prevButton)}
                    onClick={onPrevMonthClick}
                    removeDefaultClass
                    dataTid='sp-month-prev-button'
                    tabIndex={0}
                    aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsPreviousButton)}
                    onKeyDown={onPrevKeyDownHandler}
                >
                    <SvgArrow />
                </Button>
            )}

            <div className={classNames(styles.monthName, MONTH_NAME_CLASS)} data-tid='month-label'>
                {formattedMonthYear}
            </div>

            {isSecondMonthHeader && !nextMonthButtonDisabled && (
                <Button
                    className={classNames(styles.button, styles.nextButton)}
                    onClick={onNextMonthClick}
                    removeDefaultClass
                    dataTid='sp-month-next-button'
                    tabIndex={0}
                    aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsNextButton)}
                    onKeyDown={onNextKeyDownHandler}
                >
                    <SvgArrow />
                </Button>
            )}
        </div>
    );
};

export default SPMonthHeader;
