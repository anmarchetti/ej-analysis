import React, { FC, ReactElement, RefObject, useEffect, useMemo, useRef } from 'react';
import DatePicker from 'react-datepicker';
import { ReactDatePickerCustomHeaderProps } from 'react-datepicker/dist/calendar';
import classNames from 'classnames';
import dayjs, { Dayjs } from 'dayjs';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { cmsUrls } from 'code/endpoints';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { customLocale } from 'frontend/utils/customLangConfig';
import { getCountOfNightLabel, getMonthsDifference } from 'frontend/utils/date.utils';
import { isDateAvailable } from 'frontend/utils/dateAvailability.utils';
import { IAvailableDate } from 'models/data/IAvailableDate';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import {
    unavailabilityOverlay,
    UNAVAILABLE_OVERLAY_CLASS,
} from 'frontend/components/common/Calendar/components/calendar.utils';
import FlyingPlaneAnimation from 'frontend/components/common/FlyingPlaneAnimation/FlyingPlaneAnimation';
import FlexibilityPills from 'frontend/components/common/Pills/FlexibilityPills/FlexibilityPills';
import SPMonthHeader from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchPodCalendar/components/SPMonthHeader';
import YearDropdown from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchPodCalendar/components/YearDropdown';
import {
    DATE_PICKER_CLASS,
    MONTH_NAME_CLASS,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchPodCalendar/constants';
import {
    getFirstDisplayedMonthOnDesktop,
    getUnavailableMonths,
    isAvailabilityForMonthLoaded,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchPodCalendar/SearchPodCalendar.utils';
import useReactDataPickerFocus from 'frontend/components/renderings/SearchPod/hooks/useReactDataPickerFocus';

import styles from './SearchPodCalendar.module.scss';

const TWO_MONTHS = 2;
const ANIMATION_DURATION = 500;
const MIN_DAYS_AHEAD = 2; // Min allowed date can't be earlier than today & tomorrow;
const MOBILE_TOP_PADDING_BEFORE_MONTH = 10;

const DATE_OFFSET = 3;
const MONTHS_OFFSET = 3;
const MONTHS_TO_SUBTRACT = 1;

const SearchPodCalendar: FC = () => {
    const {
        getPhrase,
        lastAvailableDate,
        isAvailableDatesLoading,
        availableDates, // DO NOT USE directly, use filteredAvailableDates instead
        from,
        to,
        onChangeFlexible,
        flexDays,
        selectedNumberOfNights,
        getSetting,
        onChangeDates,
        changeDateAvailabilityInterval,
        trackWhenDropdownSelection,
        trackWhenFlexibilityChange,
        updateAvailableDates,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        lastAvailableDate: stores.searchStore.searchWhen.lastAvailableDate,
        isAvailableDatesLoading: stores.searchStore.searchWhen.isAvailableDatesLoading,
        availableDates: stores.searchStore.searchWhen.availableDates,
        from: stores.searchStore.searchWhen.from,
        to: stores.searchStore.searchWhen.to,
        onChangeFlexible: stores.searchStore.searchWhen.onChangeFlexible,
        flexDays: stores.searchStore.searchWhen.flexDays,
        selectedNumberOfNights: stores.searchStore.searchWhen.selectedNumberOfNights,
        getSetting: stores.layoutStore.getSetting,
        onChangeDates: stores.searchStore.searchWhen.onChangeDates,
        updateAvailableDates: stores.searchStore.searchWhen.updateAvailableDates,
        changeDateAvailabilityInterval: stores.searchStore.searchWhen.changeDateAvailabilityInterval,
        trackWhenDropdownSelection: stores.trackingStore.searchPod.trackWhenDropdownSelection,
        trackWhenFlexibilityChange: stores.trackingStore.searchPod.trackWhenFlexibilityChange,
    }));

    const datePickerWrapper: RefObject<HTMLDivElement> | null = useRef(null);

    const isMobile = useMobileViewport();
    useReactDataPickerFocus({ datePickerWrapper });

    const nightsSelectedLabel =
        selectedNumberOfNights > 0 ? getCountOfNightLabel(selectedNumberOfNights, getPhrase) : '';
    const minDate = dayjs().add(MIN_DAYS_AHEAD, 'day').toDate();
    const availableDatesFromMinDate: IAvailableDate[] | null =
        availableDates?.filter(date => {
            const min = dayjs(minDate);
            const filteredDate = dayjs(date.date);

            return filteredDate.isAfter(min) || filteredDate.isSame(min, 'day');
        }) ?? null; // exclude MIN_DAYS_AHEAD

    const unavailableMonths = useMemo(
        () => getUnavailableMonths(availableDatesFromMinDate, from),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [availableDatesFromMinDate?.length, from],
    );

    const firstDisplayedMonthOnDesktop = useMemo(
        () => getFirstDisplayedMonthOnDesktop(availableDatesFromMinDate, from, minDate, unavailableMonths),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const [lastMonthDisplayedOnDesktop, setLastMonthDisplayedOnDesktop] = React.useState<Dayjs>(
        dayjs(firstDisplayedMonthOnDesktop).add(1, 'month').startOf('month'),
    );
    const lastMonthTimestamp = lastMonthDisplayedOnDesktop?.valueOf();

    const onChangeHandler = (dates: [Date | null, Date | null]): void => {
        if (dayjs(dates[0]).isSame(dates[1])) {
            return;
        }

        if (dates[0] && !dates[1]) {
            onChangeDates([dates[0]]);
            updateAvailableDates(false);
        }

        if (dates[0] && dates[1]) {
            onChangeDates([dates[0], dates[1]]);
            updateAvailableDates(false);
            trackWhenDropdownSelection();
        }
    };

    const isAvailabilityForLastDisplayedMonthsLoaded = useMemo(
        () => isAvailabilityForMonthLoaded(availableDatesFromMinDate, lastMonthDisplayedOnDesktop),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [availableDatesFromMinDate?.length, lastMonthTimestamp],
    );

    const lastAvailableDateDependency = lastAvailableDate?.toString();
    const countOfAvailableMonths = useMemo(() => {
        if (!lastAvailableDate) {
            return TWO_MONTHS;
        }

        return getMonthsDifference(lastAvailableDate, minDate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastAvailableDateDependency]);

    const addUnavailabilityOverlay = (month): void => {
        const childrenMonthComponent = month.querySelector('.react-datepicker__month');
        const img = cmsUrls.media(getSetting(SiteSettings.DateUnavailableImage));
        const text = getSetting(SiteSettings.DateUnavailableMessage);
        const wrapper = unavailabilityOverlay(img, text);
        childrenMonthComponent?.append(wrapper);
    };

    // show unavailable months overlay
    useEffect(() => {
        const isAvailabilityNotLoaded = !availableDatesFromMinDate?.length;

        if (isAvailabilityNotLoaded && isMobile) {
            return;
        }

        const displayedMonths = datePickerWrapper.current?.querySelectorAll('.react-datepicker__month-container');

        // clear previous overlays because when scroll back overlay get stuck on prev month
        datePickerWrapper.current?.querySelectorAll(`.${UNAVAILABLE_OVERLAY_CLASS}`).forEach(el => el.remove());

        displayedMonths?.forEach(month => {
            const caption = month.querySelector(`.${MONTH_NAME_CLASS}`);
            const monthText = caption?.childNodes?.[0]?.textContent?.trim();

            if (isAvailabilityNotLoaded) {
                // by default datepicker add additional one month at the end, but it can't have available dates
                const isLastMonth =
                    monthText === dayjs(lastAvailableDate).add(1, 'month').format(DATE_FORMATS.fullMonthAndYear);

                if (isLastMonth) {
                    addUnavailabilityOverlay(month);
                }
            } else {
                const isMonthUnavailable = unavailableMonths.includes(monthText || '');

                if (isMonthUnavailable) {
                    addUnavailabilityOverlay(month);
                }
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastMonthTimestamp, unavailableMonths.length]);

    // scroll to selected month on mobile
    useEffect(() => {
        if (!isMobile || !to) {
            return;
        }

        setTimeout(() => {
            const selectedMonth = dayjs(from).format(DATE_FORMATS.fullMonthAndYear);
            const monthsElements = datePickerWrapper.current?.querySelectorAll(`.${MONTH_NAME_CLASS}`);
            const monthToScroll = Array.from(monthsElements || []).find(month =>
                month.textContent?.includes(selectedMonth),
            );
            const datePickerElement = datePickerWrapper.current?.querySelector(`.${DATE_PICKER_CLASS}`);

            if (monthToScroll && datePickerElement) {
                const datePickerStartY = datePickerElement.getBoundingClientRect().top;
                const elementY = monthToScroll.getBoundingClientRect().top;
                const targetY = elementY - datePickerStartY - MOBILE_TOP_PADDING_BEFORE_MONTH;
                datePickerElement.scrollTo({ top: targetY, behavior: 'smooth' });
            }
        }, ANIMATION_DURATION);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMobile]);

    const renderHeader = (customHeaderProps: ReactDatePickerCustomHeaderProps): ReactElement => (
        <SPMonthHeader {...customHeaderProps} datePickerWrapper={datePickerWrapper} />
    );

    const selectedDates: Date[] = useMemo(() => {
        if (from && to) {
            return [from, to];
        } else if (from) {
            return [from];
        }

        return [];
    }, [from, to]);

    // works faster than excludeDates prop
    const renderDayContents = (day: number | string, date: Date): ReactElement => {
        const isDateDisabled = !isDateAvailable(date, availableDatesFromMinDate, selectedDates);

        return (
            <span className={isDateDisabled ? 'disabled' : ''} data-tid='date-picker-day'>
                {day}
            </span>
        );
    };

    const isLoaderDisplayed =
        (isMobile && isAvailableDatesLoading) ||
        (!isMobile && !isAvailabilityForLastDisplayedMonthsLoaded && isAvailableDatesLoading);

    const onMonthChange = (firstDisplayedDate: Date): void => {
        setLastMonthDisplayedOnDesktop(dayjs(firstDisplayedDate).add(1, 'month'));

        const endDate = dayjs(firstDisplayedDate).add(MONTHS_OFFSET, 'month').date(DATE_OFFSET).startOf('day').toDate();

        let startDate = dayjs(firstDisplayedDate)
            .subtract(MONTHS_TO_SUBTRACT, 'month')
            .date(-DATE_OFFSET)
            .startOf('day')
            .toDate();

        const now = dayjs().startOf('day').toDate();

        if (startDate < now) {
            startDate = now;
        }

        changeDateAvailabilityInterval(startDate, endDate);
    };

    const onChangeFlexibility = (value: number): void => {
        onChangeFlexible(value);
        trackWhenFlexibilityChange();
    };

    return (
        <div className={styles.wrapper} ref={datePickerWrapper} data-tid='search-pod-calendar-wrapper'>
            {isLoaderDisplayed && (
                <div className={styles.animation}>
                    <span>{getPhrase(SitecoreDictionary.GlobalsLabelsLoading)}</span>
                    <FlyingPlaneAnimation />
                </div>
            )}

            <div className={styles.headerWrapper}>
                <div className={styles.header}>
                    <YearDropdown minDate={minDate} />

                    <div className={styles.row}>
                        <span className={styles.label} data-tid='nights-selected-label'>
                            {nightsSelectedLabel}
                        </span>
                        <FlexibilityPills
                            onChange={onChangeFlexibility}
                            flexDays={flexDays}
                            className={styles.flexibilityPills}
                        />
                    </div>

                    {isMobile && (
                        <div className={styles.weekNames}>
                            {dayjs.weekdaysMin(true).map(weekName => (
                                <span key={weekName}>{weekName}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div
                style={isMobile ? { paddingTop: MOBILE_TOP_PADDING_BEFORE_MONTH } : {}}
                className={styles.datePickerWrapper}
            >
                <DatePicker
                    inline
                    monthsShown={isMobile ? countOfAvailableMonths : TWO_MONTHS}
                    filterDate={(date): boolean => isDateAvailable(date, availableDatesFromMinDate, selectedDates)}
                    selectsRange
                    selectsDisabledDaysInRange
                    onChange={onChangeHandler}
                    startDate={from || undefined}
                    endDate={to || undefined}
                    renderDayContents={renderDayContents}
                    minDate={minDate}
                    maxDate={lastAvailableDate || undefined}
                    locale={customLocale as any}
                    calendarClassName={classNames(styles.datePicker, isMobile && styles.mobileView, DATE_PICKER_CLASS)}
                    calendarStartDay={dayjs.localeData().firstDayOfWeek() as any}
                    renderCustomHeader={renderHeader}
                    openToDate={isMobile ? minDate : firstDisplayedMonthOnDesktop}
                    onMonthChange={onMonthChange}
                />
            </div>
        </div>
    );
};

export default observer(SearchPodCalendar);
