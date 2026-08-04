import { FC, useEffect, useRef } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getCountOfNightLabel } from 'frontend/utils/date.utils';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import SearchBarDropdownScrollableBox from 'frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox';
import SearchPodFooterButtons from 'frontend/components/common/SearchPodFooterButtons/SearchPodFooterButtons';
import SearchPodCalendar from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchPodCalendar/SearchPodCalendar';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

import MonthViewDropdown from './components/MonthViewDropdown/MonthViewDropdown';

import styles from './SearchBarDropdownWhen.module.scss';

export interface ISearchBarDropdownWhenProps {
    onDropdownClose: () => void;
}

export enum CalendarType {
    Month = 'Month',
    Date = 'Date',
}

const SearchBarDropdownWhen: FC<ISearchBarDropdownWhenProps> = ({ onDropdownClose }) => {
    const {
        clearDates,
        onChangeFlexible,
        setIsMonthSearch,
        setMonthSearchDuration,
        isMonthSearch,
        trackWhenFieldTabClick,
        getPhrase,
        from,
        to,
        selectedNumberOfNights,
        monthSearchDuration,
        defaultSearchPodMonthSearchDuration,
        isMonthSearchEnabled,
    } = useStore((stores: TStores) => ({
        clearDates: stores.searchStore.searchWhen.clearDates,
        onChangeFlexible: stores.searchStore.searchWhen.onChangeFlexible,
        setIsMonthSearch: stores.searchStore.searchWhen.setIsMonthSearch,
        setMonthSearchDuration: stores.searchStore.searchWhen.setMonthSearchDuration,
        isMonthSearch: stores.searchStore.searchWhen.isMonthSearch,
        trackWhenFieldTabClick: stores.trackingStore.searchPod.trackWhenFieldTabClick,
        getPhrase: stores.layoutStore.getPhrase,
        from: stores.searchStore.searchWhen.from,
        to: stores.searchStore.searchWhen.to,
        selectedNumberOfNights: stores.searchStore.searchWhen.selectedNumberOfNights,
        monthSearchDuration: stores.searchStore.searchWhen.monthSearchDuration,
        defaultSearchPodMonthSearchDuration: stores.searchStore.searchWhen.defaultSearchPodMonthSearchDuration,
        isMonthSearchEnabled: stores.layoutStore.isMonthSearchEnabled,
    }));

    // Store the latest value of `from` in a ref and reset month search state when component unmounts.
    // `latestValueRef` keeps track of the current `from` value across renders.
    // The cleanup function in `useEffect` runs on unmount; if `from` is null, it disables month search.
    const latestValueRef = useRef(from);
    latestValueRef.current = from;
    useEffect(
        () => () => {
            if (!latestValueRef.current) {
                setIsMonthSearch(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const searchedMonthIndex = dayjs(from).month() ?? undefined;
    const isMonthSelected = Number.isInteger(searchedMonthIndex);

    const { fields: { DateTabLabel, MonthTabLabel, WhenDropdownTitle } = {} } = useSearchPodStore();
    const monthPickerLabel = `${monthSearchDuration || ''} ${getPhrase(SitecoreDictionary.GlobalsLabelsNightsPlural)}`;
    const datePickerLabel = selectedNumberOfNights > 0 ? getCountOfNightLabel(selectedNumberOfNights, getPhrase) : '';
    const mobileLabel = isMonthSearch ? monthPickerLabel : datePickerLabel;

    const dateTabHandler = (): void => {
        if (!isMonthSearch) {
            return;
        }

        setIsMonthSearch(false);
        clearDates(true);
        trackWhenFieldTabClick();
    };

    const monthTabHandler = (): void => {
        if (isMonthSearch) {
            return;
        }

        setIsMonthSearch(true);
        setMonthSearchDuration(defaultSearchPodMonthSearchDuration);
        clearDates(true);
        onChangeFlexible(0);
        trackWhenFieldTabClick();
    };

    const onClearClick = (): void => {
        clearDates(true);

        //set default duration for month search from sitecore
        setMonthSearchDuration(defaultSearchPodMonthSearchDuration);
    };

    return (
        <div className={styles.wrapper}>
            <Text
                field={WhenDropdownTitle}
                className={classNames(styles.title, !isMonthSearchEnabled && styles.hideOnMobile)}
                tag='p'
                data-tid='search-bar-dropdown-when-title'
            />
            {isMonthSearchEnabled && (
                <div className={styles.tabsWrapper} data-tid='search-bar-dropdown-when-tabs'>
                    <Button
                        removeDefaultClass
                        onClick={dateTabHandler}
                        className={classNames(styles.tabButton, { [styles.activeTab]: !isMonthSearch })}
                        dataTid={'search-bar-dropdown-when-date-tab-button'}
                    >
                        {DateTabLabel?.value}
                    </Button>
                    <Button
                        removeDefaultClass
                        onClick={monthTabHandler}
                        className={classNames(styles.tabButton, { [styles.activeTab]: isMonthSearch })}
                        dataTid={'search-bar-dropdown-when-month-tab-button'}
                    >
                        {MonthTabLabel?.value}
                    </Button>
                </div>
            )}
            <SearchBarDropdownScrollableBox className={styles.searchBarDropdownScrollableBox}>
                {isMonthSearchEnabled ? (
                    <>
                        {isMonthSearch && <MonthViewDropdown />}
                        {!isMonthSearch && <SearchPodCalendar />}
                    </>
                ) : (
                    <SearchPodCalendar />
                )}
            </SearchBarDropdownScrollableBox>

            <SearchPodFooterButtons
                applyButtonLabel={getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                clearButtonLabel={getPhrase(SitecoreDictionary.GlobalsLabelsClearSelection)}
                isShownClearButton={isMonthSearch ? isMonthSelected : !!from}
                onApplyClick={onDropdownClose}
                onCloseClick={onDropdownClose}
                onClearClick={onClearClick}
                isApplyButtonDisabled={isMonthSearch ? !isMonthSelected : !to}
                mobileLabel={mobileLabel}
                fieldName={SearchBarDropdown.When}
            />
        </div>
    );
};

export default observer(SearchBarDropdownWhen);
