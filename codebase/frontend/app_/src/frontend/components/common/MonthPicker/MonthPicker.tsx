import { FC } from 'react';
import { ResponsiveType } from 'react-multi-carousel';
import { Dayjs } from 'dayjs';

import { DATE_FORMATS } from 'code/dates';
import { isDateIncludedInArray } from 'frontend/utils/date.utils';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import CarouselButtonsGroup from 'frontend/components/common/CarouselButtonsGroup/CarouselButtonsGroup';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';

import Month from './components/Month';

import styles from './MonthPicker.module.scss';

export interface IMonthPickerProps {
    endDate: Dayjs;
    onMonthClick: (day: Dayjs) => void;
    selectedMonths: Dayjs[];
    startDate: Dayjs;
    availableMonths?: number[];
}

const MonthPicker: FC<IMonthPickerProps> = ({ startDate, endDate, onMonthClick, selectedMonths, availableMonths }) => {
    const firstDayOfStartDay = startDate.startOf('month');
    const difference = endDate.diff(firstDayOfStartDay, 'month');
    const list = Array.from({ length: difference }, (_, index) => firstDayOfStartDay.add(index, 'month'));

    const responsive: ResponsiveType = {
        desktop: {
            breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 992 },
            items: 7,
        },
        tablet: {
            breakpoint: { max: 991, min: 768 },
            items: 5,
        },
        mobile: {
            breakpoint: { max: 767, min: 0 },
            items: 3,
        },
    };

    return (
        <div className={styles.wrapper}>
            <CarouselWrapper
                responsive={responsive}
                arrows={false}
                showDots={false}
                renderButtonGroupOutside={true}
                customButtonGroup={
                    <CarouselButtonsGroup
                        minNumberOfItems={1}
                        prevClassName={styles.prevButton}
                        nextClassName={styles.nextButton}
                    />
                }
                swipeable
                sliderClass={styles.carousel}
            >
                {list.map((day: Dayjs, index) => {
                    const isMonthSelected = isDateIncludedInArray(day, selectedMonths);
                    const isMonthDisabled = !!availableMonths?.length && !availableMonths.includes(day.month() + 1); // Months are zero indexed, so January is month 0!

                    return (
                        <Month
                            key={day.format(DATE_FORMATS.default)}
                            day={day}
                            onMonthClick={onMonthClick}
                            isMonthDisabled={isMonthDisabled}
                            isMonthSelected={isMonthSelected}
                            index={index}
                        />
                    );
                })}
            </CarouselWrapper>
        </div>
    );
};

export default MonthPicker;
