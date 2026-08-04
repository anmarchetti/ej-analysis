import { FC, ReactElement } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Weekdays from 'frontend/components/common/Weekdays/Weekdays';
import IconCalendarLined from 'frontend/components/icons-new/CalendarLined';
import IconChild from 'frontend/components/icons-new/Child';
import IconInfoFilled from 'frontend/components/icons-new/InfoFilled';
import IconPromo from 'frontend/components/icons-new/Promo';
import ComparePriceCalendar from 'frontend/components/renderings/ComparePriceModule/components/ComparePriceCalendar/ComparePriceCalendar';
import styles from 'frontend/components/renderings/ComparePriceModule/components/ComparePriceContent/ComparePriceContent.module.scss';
import ComparePriceModuleToggle, {
    IComparePriceModuleToggleProps,
} from 'frontend/components/renderings/ComparePriceModule/components/ComparePriceModuleToggle/ComparePriceModuleToggle';
import ComparePriceTouristTax from 'frontend/components/renderings/ComparePriceModule/components/ComparePriceTouristTax/ComparePriceTouristTax';

export const CalendarTabTitle = (): ReactElement => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <div className={styles.titleWrapper}>
            <IconCalendarLined />
            <span>{getPhrase(SitecoreDictionary.ComparePriceModuleCalendarView)}</span>
        </div>
    );
};

const WEEK_START = 1;

export interface ICalendarTabContentProps extends IComponentWithDictionary {
    activeDate: Date;
    changesLabel: string;
    freeForKidsLabel: string;
    holidayDuration: number;
    holidayDurationLabel: string;
    isDisplayed: boolean;
    isFreeForKidsDisplayed: boolean;
    isMobileView: boolean;
    isPromoDisplayed: boolean;
    isResetingSelectedOffer: boolean;
    selectedDate: Date;
    setActiveDate: (d: Date) => void;
    toggleProps: IComparePriceModuleToggleProps;
    isCheapest?: boolean;
    touristTaxLabel?: string;
}

const CalendarTabContent: FC<ICalendarTabContentProps> = ({
    getPhrase,
    holidayDurationLabel,
    isMobileView,
    activeDate,
    holidayDuration,
    selectedDate,
    setActiveDate,
    isResetingSelectedOffer,
    isDisplayed,
    isPromoDisplayed,
    changesLabel,
    isFreeForKidsDisplayed,
    freeForKidsLabel,
    touristTaxLabel,
    toggleProps,
    isCheapest,
}): ReactElement => (
    <div className={styles.contentWrapper}>
        <div className={styles.header}>
            <p className={styles.duration} data-tid='compare-prices-duration'>
                {holidayDurationLabel}
            </p>
        </div>

        {!isMobileView && <ComparePriceTouristTax label={touristTaxLabel} />}
        <div className={styles.legendWrapper}>
            <div className={styles.legend}>
                {isPromoDisplayed && (
                    <div>
                        <span
                            className={classNames(styles.icon, styles.promo)}
                            data-tid='compare-prices-best-value-icon'
                        >
                            <IconPromo />
                        </span>

                        <span className={styles.text} data-tid='compare-prices-best-value-label'>
                            {getPhrase(SitecoreDictionary.ComparePriceModuleBestValue)}
                        </span>
                    </div>
                )}
                {!isCheapest && (
                    <div>
                        <span className={classNames(styles.icon, styles.info)} data-tid='compare-prices-changes-icon'>
                            <IconInfoFilled />
                        </span>

                        <span className={styles.text} data-tid='compare-prices-changes-label'>
                            {changesLabel}
                        </span>
                    </div>
                )}
                {isFreeForKidsDisplayed && (
                    <div>
                        <span
                            className={classNames(styles.icon, styles.freeForKids)}
                            data-tid='compare-prices-free-for-kids-icon'
                        >
                            <IconChild />
                        </span>

                        <span className={styles.text} data-tid='compare-prices-free-for-kids-label'>
                            {freeForKidsLabel}
                        </span>
                    </div>
                )}
            </div>
            {!isMobileView && <ComparePriceModuleToggle {...toggleProps} />}
        </div>

        {isMobileView && (
            <>
                <Weekdays className={styles.weekdays} weekStart={WEEK_START} />
                <ComparePriceTouristTax label={touristTaxLabel} />
                <ComparePriceModuleToggle {...toggleProps} />
            </>
        )}

        {isDisplayed && (
            <div className={styles.calendarWrapper}>
                <ComparePriceCalendar
                    activeDate={activeDate}
                    holidayDuration={holidayDuration}
                    selectedDate={selectedDate}
                    changeActiveDate={setActiveDate}
                    isBestValueEnabled={isPromoDisplayed}
                    isFreeForKidsEnabled={isFreeForKidsDisplayed}
                    isResetingSelectedOffer={isResetingSelectedOffer}
                    weekdaysContainerClass={styles.weekdays}
                    isCheapest={isCheapest}
                />
            </div>
        )}
    </div>
);

export default CalendarTabContent;
