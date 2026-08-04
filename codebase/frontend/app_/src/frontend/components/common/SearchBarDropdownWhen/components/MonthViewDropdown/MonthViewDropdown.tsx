import { FC, useEffect, useMemo } from 'react';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IMonthItem } from 'models/data/IMonthAvailability';
import SiteSettings from 'models/enum/SiteSettings';
import { IDurationPillOption } from 'models/sitecore/IDurationPillOption';
import DurationPills from 'frontend/components/common/SearchBarDropdownWhen/components/DurationPills/DurationPills';
import MonthCarousel from 'frontend/components/common/SearchBarDropdownWhen/components/MonthCarousel/MonthCarousel';
import MonthOption from 'frontend/components/common/SearchBarDropdownWhen/components/MonthOption/MonthOption';
import MonthViewDisclaimers from 'frontend/components/common/SearchBarDropdownWhen/components/MonthViewDropdown/components/MonthViewDisclaimers/MonthViewDisclaimers';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

import { getMonthFields } from './MonthViewDropdown.utils';

import styles from './MonthViewDropdown.module.scss';

const MonthViewDropdown: FC = () => {
    const {
        getSetting,
        onChangeDates,
        monthsAvailability,
        lastAvailableDate,
        trackWhenDropdownSelection,
        setMonthSearchDuration,
        monthSearchDuration,
        isSearchPodMonthDurationPillsEnabled,
        defaultSearchPodMonthSearchDuration,
        cheapestMonthList,
        isCheapestMonthPriceEnabled,
        updateAvailableDates,
        clearDates,
        from,
    } = useStore((stores: TStores) => ({
        getSetting: stores.layoutStore.getSetting,
        onChangeDates: stores.searchStore.searchWhen.onChangeDates,
        monthsAvailability: stores.searchStore.searchWhen.monthsAvailability,
        lastAvailableDate: stores.searchStore.searchWhen.lastAvailableDate,
        trackWhenDropdownSelection: stores.trackingStore.searchPod.trackWhenDropdownSelection,
        setMonthSearchDuration: stores.searchStore.searchWhen.setMonthSearchDuration,
        monthSearchDuration: stores.searchStore.searchWhen.monthSearchDuration,
        isSearchPodMonthDurationPillsEnabled: stores.layoutStore.isSearchPodMonthDurationPillsEnabled,
        defaultSearchPodMonthSearchDuration: stores.searchStore.searchWhen.defaultSearchPodMonthSearchDuration,
        cheapestMonthList: stores.searchStore.searchWhen.cheapestMonthList,
        isCheapestMonthPriceEnabled: stores.layoutStore.isCheapestMonthPriceEnabled,
        updateAvailableDates: stores.searchStore.searchWhen.updateAvailableDates,
        clearDates: stores.searchStore.searchWhen.clearDates,
        from: stores.searchStore.searchWhen.from,
    }));

    const { fields: { DurationLabel } = {} } = useSearchPodStore();

    const isMobile = useMobileViewport();
    const duration = monthSearchDuration || defaultSearchPodMonthSearchDuration;
    const durationPillOptions: IDurationPillOption[] = getSetting(SiteSettings.SearchPodDurationPillOptions) || [];

    // If a month is already selected but monthAvailability has changed (e.g. because the duration pill was changed),
    // the updated month availability should be re-checked to avoid proceeding with a search for an unavailable month.
    useEffect(() => {
        if (!from) {
            return;
        }

        const currentAvailability = monthsAvailability.find(month => {
            const date = dayjs(month.date);

            return date.isSame(dayjs(from), 'month');
        })?.availability;

        if (!currentAvailability) {
            clearDates();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthsAvailability]);

    const months = useMemo((): IMonthItem[] => {
        const now = dayjs();

        if (!monthsAvailability.length && lastAvailableDate) {
            const currentMonth = now.startOf('month');
            const lastMonth = dayjs(lastAvailableDate).startOf('month');
            const totalMonths = lastMonth.diff(currentMonth, 'month') + 1;

            return Array.from({ length: totalMonths }, (_, i) => {
                const newMonth = currentMonth.add(i, 'month');

                return {
                    availability: true,
                    ...getMonthFields(newMonth, cheapestMonthList),
                };
            });
        }

        return monthsAvailability.reduce<IMonthItem[]>((acc, item) => {
            const date = dayjs(item.date);

            if (date.isAfter(now, 'month') || date.isSame(now, 'month')) {
                acc.push({
                    ...item,
                    ...getMonthFields(date, cheapestMonthList),
                });
            }

            return acc;
        }, []);
    }, [monthsAvailability, lastAvailableDate, cheapestMonthList]);

    const validateDuration = (durationValue: number | undefined): void => {
        if (isSearchPodMonthDurationPillsEnabled) {
            const isValidDuration = durationPillOptions.some(
                option => Number.parseInt(option.Duration) === durationValue,
            );

            if (!isValidDuration && defaultSearchPodMonthSearchDuration) {
                setMonthSearchDuration(defaultSearchPodMonthSearchDuration);
            }

            return;
        }

        if (durationValue !== defaultSearchPodMonthSearchDuration && defaultSearchPodMonthSearchDuration) {
            setMonthSearchDuration(defaultSearchPodMonthSearchDuration);
        }
    };

    const handleMonthChange = (month: IMonthItem): void => {
        const searchedMonthValue = month.date;
        const firstDayOfSelectedMonth = searchedMonthValue.startOf('day').toDate();
        const lastDayOfSelectedMonth = searchedMonthValue.endOf('month').toDate();
        validateDuration(duration);

        onChangeDates([firstDayOfSelectedMonth, lastDayOfSelectedMonth]);
        trackWhenDropdownSelection();
    };

    const applyDuration = (duration: number): void => {
        setMonthSearchDuration(duration);
        updateAvailableDates(true);
    };

    const isCheapestMonthDescriptionShown = isCheapestMonthPriceEnabled && !!cheapestMonthList;

    const title = Tokenizer.replaceToken(DurationLabel?.value, Tokens.Duration, `${duration}`);

    return (
        <div className={classNames(styles.wrapper)} data-tid='month-dropdown'>
            <div className={styles.topWrapper}>
                {!isSearchPodMonthDurationPillsEnabled && (
                    <p data-tid='month-view-duration' className={styles.title}>
                        {title}
                    </p>
                )}
                {isSearchPodMonthDurationPillsEnabled && (
                    <DurationPills selectedValue={duration} onChange={applyDuration} className={styles.durationPills} />
                )}
            </div>

            <div
                className={classNames(styles.monthsWrapper, {
                    [styles.withDurationPills]: isSearchPodMonthDurationPillsEnabled,
                })}
                data-tid='month-wrapper'
            >
                {isCheapestMonthDescriptionShown && isMobile && (
                    <MonthViewDisclaimers cheapestMonthTestId='cheapest-month-description-mobile' />
                )}

                {isMobile ? (
                    months.map(month => (
                        <MonthOption
                            key={`${month.year}-${month.monthName}`}
                            isVisible={true}
                            month={month}
                            onMonthChange={handleMonthChange}
                        />
                    ))
                ) : (
                    <MonthCarousel months={months} onMonthChange={handleMonthChange} />
                )}

                {isCheapestMonthDescriptionShown && !isMobile && (
                    <MonthViewDisclaimers cheapestMonthTestId='cheapest-month-description' />
                )}
            </div>
        </div>
    );
};

export default observer(MonthViewDropdown);
