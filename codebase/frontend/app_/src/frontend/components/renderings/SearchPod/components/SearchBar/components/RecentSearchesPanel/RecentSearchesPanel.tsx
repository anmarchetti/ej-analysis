import { FC, useEffect } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import Button from 'frontend/components/common/Button';
import RecentSearches from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearches/RecentSearches';
import styles from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/RecentSearchesPanel.module.scss';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

export interface IRecentSearchesPanelProps {
    changeSelectedDropdown: (dropdown?: SearchBarDropdown | null) => void;
    searchStickyWrRef: React.RefObject<HTMLDivElement>;
    selectedDropdown: SearchBarDropdown | null;
}

const RecentSearchesPanel: FC<IRecentSearchesPanelProps> = ({
    searchStickyWrRef,
    selectedDropdown,
    changeSelectedDropdown,
}) => {
    const { isHotelDetailsBrowsePage, isAnySearchParametersSelected, clearSearchValues, trackStartNewSearch } =
        useStore(stores => ({
            isHotelDetailsBrowsePage: stores.layoutStore.isHotelDetailsBrowsePage,
            isAnySearchParametersSelected: stores.searchStore.isAnySearchParametersSelected,
            clearSearchValues: stores.searchStore.clearSearchValues,
            trackStartNewSearch: stores.trackingStore.searchPod.trackStartNewSearch,
        }));

    const { fields: { NewSearchLabel, NewSearchLabelMobile } = {} } = useSearchPodStore();

    useEffect(() => {
        const closeRecentOnOutsideClick = (e: Event): void => {
            if (
                !searchStickyWrRef.current?.contains(e.target as any) &&
                selectedDropdown === SearchBarDropdown.Recent
            ) {
                changeSelectedDropdown(null);
                document.removeEventListener('click', closeRecentOnOutsideClick);
            }
        };

        if (selectedDropdown === SearchBarDropdown.Recent) {
            document.addEventListener('click', closeRecentOnOutsideClick);
        }

        return () => {
            document.removeEventListener('click', closeRecentOnOutsideClick);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDropdown]);

    const isMobile = useMobileViewport();

    const isRecentDropdownSelected = selectedDropdown === SearchBarDropdown.Recent;
    const isRecentSearchesShown = !selectedDropdown || isRecentDropdownSelected;

    const onStartNewSearch = (): void => {
        clearSearchValues(false);
        trackStartNewSearch();
    };

    return (
        <div
            data-tid='recent-searches-wrapper'
            className={classNames(styles.wrapper, {
                [styles.placeholder]: isHotelDetailsBrowsePage && !isRecentDropdownSelected,
                [styles.hidden]: !isRecentSearchesShown,
            })}
        >
            {isAnySearchParametersSelected && isRecentSearchesShown && (
                <Button
                    isText
                    isTransparent
                    className={styles.newSearchBtn}
                    dataTid='start-new-search-btn'
                    onClick={onStartNewSearch}
                >
                    {isMobile ? getFieldValue(NewSearchLabelMobile) : getFieldValue(NewSearchLabel)}
                </Button>
            )}

            <RecentSearches
                isOpen={isRecentDropdownSelected}
                isHidden={!!selectedDropdown && !isRecentDropdownSelected}
                changeSelectedDropdown={changeSelectedDropdown}
            />
        </div>
    );
};

export default observer(RecentSearchesPanel);
