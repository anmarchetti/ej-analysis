import React, { FC, useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { DATE_FORMATS } from 'code/dates';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getDurationLabel } from 'frontend/utils/accommodation.utils';
import { formatDateL10n, parseDateL10n } from 'frontend/utils/date.utils';
import {
    createOriDisplayValueByCodes,
    getRoomAllocationFromQueryRoom,
    getWhoField,
} from 'frontend/utils/search/search.utils';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IPrefilledSearchParams } from 'models/data/IPrefilledSearchParams';
import { IPrettyRecentSearch } from 'models/data/IPrettyRecentSearch';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { getAdultsQuantity, getChildrenQuantity, getInfantsQuantity } from 'models/RoomAllocation.utils';
import Button from 'frontend/components/common/Button';
import styles from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearchesContent/RecentSearchesContent.module.scss';
import RecentSearchItem from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearchItem/RecentSearchItem';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

export interface IRecentSearchesContentProps {
    items: IPrefilledSearchParams[];
    onApply: (index: number) => void;

    onCancel: () => void;
    onClearAll: () => void;
    onClearOne: (index: number) => void;
    selectedIndex: number | null;
}

const RecentSearchesContent: FC<IRecentSearchesContentProps> = ({
    items,
    onApply,
    onCancel,
    onClearAll,
    onClearOne,
    selectedIndex,
}) => {
    const {
        originsWithNames,
        getPhrase,
        isTradePortal,
        createDstDisplayValueByCodes,
        loadDestinationsForRecentSearches,
        marketCode,
        getSettingAsNumber,
    } = useStore((stores: TStores) => ({
        originsWithNames: stores.searchStore.originsWithNames,
        getPhrase: stores.layoutStore.getPhrase,
        isTradePortal: stores.layoutStore.isTradePortal,
        createDstDisplayValueByCodes: stores.searchStore.searchTo.createDstDisplayValueByCodes,
        loadDestinationsForRecentSearches: stores.searchStore.loadDestinationsForRecentSearches,
        marketCode: stores.marketStore.marketCode,
        getSettingAsNumber: stores.layoutStore.getSettingAsNumber,
    }));

    const { fields: { ClearRecentSearches, RecentSearchesLabel } = {} } = useSearchPodStore();

    const isMobile = useMobileViewport();

    const [destinations, setDestinations] = useState<IDestinationCountry[]>([]);
    const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);

    /**
     * Prepares search queries for input fields
     */
    const prettifySearch = (item: IPrefilledSearchParams): IPrettyRecentSearch => {
        const fromComplexValue = createOriDisplayValueByCodes(
            item.departure.split(','),
            originsWithNames,
            null,
            getPhrase,
            false,
            marketCode,
        );
        const fromComplexValuePostfix = fromComplexValue.add ? ` ${fromComplexValue.add}` : '';
        const toComplexValue = destinations.length
            ? createDstDisplayValueByCodes(
                  item.dest.split(',') || [],
                  destinations,
                  null,
                  false,
                  getSettingAsNumber(SiteSettings.RecentSearchesMaxDestinationsDisplayed),
              )
            : null;
        const toComplexValuePostfix = toComplexValue?.add ? ` ${toComplexValue.add}` : '';
        const roomAllocation = item.rooms.map(el => getRoomAllocationFromQueryRoom(el, isTradePortal));
        const duration = item.durations[0];
        const whenValueFormat = item.isMonthSearch
            ? DATE_FORMATS.fullMonthAndYear
            : DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr;

        return {
            from: `${fromComplexValue.main}${fromComplexValuePostfix}`,
            to: toComplexValue ? `${toComplexValue.main}${toComplexValuePostfix}` : '',
            when: formatDateL10n(parseDateL10n(item.startDate), whenValueFormat),
            duration: getDurationLabel(getPhrase, parseInt(duration)),
            who: getWhoField(
                {
                    adults: getAdultsQuantity(roomAllocation),
                    children: getChildrenQuantity(roomAllocation),
                    infants: getInfantsQuantity(roomAllocation),
                },
                roomAllocation.length,
                item.autoAllocation,
                getPhrase,
            ),
        };
    };

    useEffect(() => {
        let isMounted = true;
        const loadDestinations = async () => {
            setIsLoadingDestinations(true);

            const destinations = await loadDestinationsForRecentSearches(items);

            if (isMounted) {
                setIsLoadingDestinations(false);
                setDestinations(destinations);
            }
        };

        loadDestinations();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <>
            <Text tag='h3' className={styles.title} field={RecentSearchesLabel} />

            <ul className={styles.list}>
                {items.map((item, index) => (
                    <RecentSearchItem
                        key={item.geog + index}
                        item={prettifySearch(item)}
                        isSelected={selectedIndex === index}
                        onClear={() => onClearOne(index)}
                        onClick={() => onApply(index)}
                        isLoadingDestination={isLoadingDestinations}
                    />
                ))}
            </ul>
            <div className={styles.footer}>
                <Button
                    isText
                    isTransparent
                    className={styles.clearBtn}
                    onClick={onClearAll}
                    dataTid='clear-recents-btn'
                >
                    {getFieldValue(ClearRecentSearches)}
                </Button>
                {!isMobile && (
                    <Button isText isTransparent className={styles.cancelBtn} onClick={onCancel}>
                        {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                    </Button>
                )}
            </div>
        </>
    );
};

export default RecentSearchesContent;
