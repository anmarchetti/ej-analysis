import { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import usePrevious from 'frontend/hooks/usePrevious';
import useStore from 'frontend/hooks/useStore';
import { useSubmitSearchParameters } from 'frontend/hooks/useSubmitSearchParameters/useSubmitSearchParameters';
import { TStores } from 'frontend/store/IStores';
import { disableScroll, enableScroll } from 'frontend/utils/ui.utils';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IAirportCountry } from 'models/sitecore/IAirportsData';
import Button from 'frontend/components/common/Button';
import RecentSearchesPanel from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/RecentSearchesPanel';
import SearchBarFromContent from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarFromContent/SearchBarFromContent';
import SearchBarTitle from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarTitle/SearchBarTitle';
import SearchBarToContent from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarToContent/SearchBarToContent';
import SearchBarWhenContent from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchBarWhenContent';
import SearchBarWhoContent from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhoContent/SearchBarWhoContent';
import { useCleanupOnLayoutChange } from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useCleanupOnLayoutChange';
import { useCleanupOnMount } from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useCleanupOnMount';
import { useLoadLastDateOnClear } from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useLoadLastDateOnClear';
import { useStickyScrollEffect } from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useStickyScrollEffect';
import styles from 'frontend/components/renderings/SearchPod/components/SearchBar/SearchBar.module.scss';

import { SEARCHBAR_STICKY_BOX_ID } from './constants';

export interface ISearchBarProps {
    changeSelectedDropdown: (field: SearchBarDropdown | null) => void;
    countries: IAirportCountry[];
    onSubmit: () => void;
    selectedDropdown: SearchBarDropdown | null;
    block?: boolean;
}

export const SearchBar: FC<ISearchBarProps> = ({
    countries,
    changeSelectedDropdown,
    onSubmit,
    selectedDropdown,
    block,
}) => {
    const {
        originsDisplayValue,
        selectedDestinationCodes,
        isAllHolidayTypesPage,
        isHolidayTypePage,
        clearErrorMessage,
        getPhrase,
        isSearchResultsPage,
        validateSearchParameters,
        changeIsPresetDestinationFilter,
        layoutId,
        grabSearchValuesFromSearchStore,
        clearOldSearchParam,
        isSearchSubmitDisabled,
        setSeachPerformWithNewParams,
        loadLastAvailableDate,
        onChangeSearchFilterStore,
        trackSearchButtonClick,
    } = useStore((stores: TStores) => ({
        originsDisplayValue: stores.searchStore.searchFrom.displayValue,
        selectedDestinationCodes: stores.searchStore.searchTo.selectedDestinationCodes,
        isAllHolidayTypesPage: stores.layoutStore.isAllHolidayTypesPage,
        isHolidayTypePage: stores.layoutStore.isHolidayTypePage,
        clearErrorMessage: stores.searchStore.clearErrorMessage,
        getPhrase: stores.layoutStore.getPhrase,
        isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
        validateSearchParameters: stores.searchStore.validateSearchParameters,
        changeIsPresetDestinationFilter: stores.searchFiltersStore.changeIsPresetDestinationFilter,
        layoutId: stores.layoutStore.layoutId,
        grabSearchValuesFromSearchStore: stores.bookingStore.grabSearchValuesFromSearchStore,
        clearOldSearchParam: stores.searchStore.clearOldSearchParam,
        isSearchSubmitDisabled: stores.searchStore.isSearchSubmitDisabled,
        setSeachPerformWithNewParams: stores.searchStore.setSeachPerformWithNewParams,
        loadLastAvailableDate: stores.searchStore.searchWhen.loadLastAvailableDate,
        onChangeSearchFilterStore: stores.searchFiltersStore.onChangeSearchFilterStore,
        trackSearchButtonClick: stores.trackingStore.searchPod.trackSearchButtonClick,
    }));

    const { onSubmitSearchParameters } = useSubmitSearchParameters();

    const [searchBarExpHeightValue, setSearchBarExpHeightValue] = useState<number>();
    const [searchBarGapHeight, setSearchBarGapHeight] = useState<number>();

    const [isExpanded, setIsExpanded] = useState<boolean>(true);
    const [isCollapsedMobileVariant, setIsCollapsedMobileVariant] = useState<boolean>(false);
    const [isBodyScrollLocked, setIsBodyScrollLocked] = useState<boolean>(false);
    const [isBodyScrollLockedViaBlur, setIsBodyScrollLockedViaBlur] = useState<boolean>(false);

    const searchStickyWrRef = useRef<HTMLDivElement>(null);
    const searchStickyBoxRef = useRef<HTMLDivElement>(null);
    const searchExpandableBoxRef = useRef<HTMLDivElement>(null);
    const searchBarRef = useRef<HTMLDivElement>(null);

    const isMobile = useMobileViewport();

    // set new collapsed searchPod variant
    const collapseSearchPodOnMobile = (): void => {
        setIsCollapsedMobileVariant(true);
        setIsExpanded(false);
    };

    useLayoutEffect(() => {
        if (isAllHolidayTypesPage || isHolidayTypePage) {
            collapseSearchPodOnMobile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isStickyOnMobile = useMemo(
        () => isMobile && !block && !isSearchResultsPage,
        [isMobile, block, isSearchResultsPage],
    );

    const { isSticky } = useStickyScrollEffect({
        isStickyOnMobile,
        isBodyScrollLocked,
        isBodyScrollLockedViaBlur,
        searchStickyWrRef,
        searchStickyBoxRef,
        setIsExpanded,
        isCollapsedMobileVariant,
    });

    useLoadLastDateOnClear({
        selectedDestinationCodes,
        originsDisplayValue,
        loadLastAvailableDate,
    });

    const prevLayoutId = usePrevious(layoutId);

    const updateSearchBarMetrics = (): void => {
        if (searchStickyWrRef.current) {
            const newHeight = searchStickyWrRef.current.getBoundingClientRect().height;
            setSearchBarGapHeight(newHeight);
        }
    };

    useEffect(() => {
        if (prevLayoutId && layoutId !== prevLayoutId) {
            updateSearchBarMetrics();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layoutId]);

    useEffect(() => {
        updateSearchBarMetrics();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useCleanupOnLayoutChange({
        layoutId,
        selectedDropdown,
        changeSelectedDropdown,
        clearErrorMessage,
    });

    useCleanupOnMount({
        clearErrorMessage,
    });

    useEffect(() => {
        if (selectedDropdown) {
            setIsBodyScrollLocked(true);
            disableScroll();
        } else {
            setIsBodyScrollLocked(false);
            enableScroll();
        }

        return () => {
            setIsBodyScrollLocked(false);
            enableScroll();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDropdown]);

    const onSubmitSearchClick = (): void => {
        if (isSearchSubmitDisabled) {
            return;
        }

        const isValid = !validateSearchParameters();

        if (isValid) {
            trackSearchButtonClick();
            onChangeSearchFilterStore({ key: 'isFiltersLoaded', value: false });
            changeIsPresetDestinationFilter(false);
            // update applied search params
            grabSearchValuesFromSearchStore();
            onSubmitSearchParameters();
            onSubmit();
            clearOldSearchParam();
            setSeachPerformWithNewParams(true);
        }
    };

    const commonSearchBarContentProps = {
        selectedDropdown,
        changeSelectedDropdown,
    };

    return (
        <div
            className={classNames('search-bar-wr', {
                [styles.dropdownOpened]: !!selectedDropdown,
                'search-bar-wr--fixed': !isMobile && isSticky,
                [`search-bar-wr--sticky ${styles.sticky}`]: isMobile && isStickyOnMobile && isSticky,
                [`search-bar-wr--collapsed ${styles.collapsed}`]: isMobile && isCollapsedMobileVariant,
            })}
            ref={searchStickyWrRef}
        >
            <div className='search-bar-wr__sticky-box' ref={searchStickyBoxRef}>
                <div
                    className={classNames('search-bar', {
                        expanded: isExpanded,
                        'd-block': block,
                    })}
                    id={SEARCHBAR_STICKY_BOX_ID}
                    ref={searchBarRef}
                >
                    {!block && (
                        <SearchBarTitle
                            isCollapsedMobileVariant={isCollapsedMobileVariant}
                            isStickyOnMobile={isStickyOnMobile}
                            isSearchBarExpanded={isExpanded}
                            isSearchBarSticky={isSticky}
                            searchExpandableBoxRef={searchExpandableBoxRef}
                            setSearchBarExpHeightValue={setSearchBarExpHeightValue}
                            setIsSearchBarExpanded={setIsExpanded}
                        />
                    )}
                    <div
                        className='expandable-box'
                        ref={searchExpandableBoxRef}
                        style={{ height: searchBarExpHeightValue }}
                    >
                        <div className={'search-fields'}>
                            <div className='fields-row'>
                                <SearchBarFromContent
                                    {...commonSearchBarContentProps}
                                    countries={countries}
                                    searchBarRef={searchBarRef}
                                    setIsBodyScrollLockedViaBlur={setIsBodyScrollLockedViaBlur}
                                />

                                <SearchBarToContent
                                    {...commonSearchBarContentProps}
                                    searchBarRef={searchBarRef}
                                    setIsBodyScrollLockedViaBlur={setIsBodyScrollLockedViaBlur}
                                />
                                <SearchBarWhenContent {...commonSearchBarContentProps} />
                                <SearchBarWhoContent {...commonSearchBarContentProps} />

                                <div className='field-box btn-box'>
                                    <div className='search-bar__button-wr'>
                                        <div className='search-bar__button-box'>
                                            <Button
                                                id='search-button'
                                                isFullWidth
                                                hasDisabledStyles={isSearchSubmitDisabled}
                                                onClick={onSubmitSearchClick}
                                            >
                                                {getPhrase(SitecoreDictionary.GlobalsButtonsSearch)}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <RecentSearchesPanel
                                changeSelectedDropdown={changeSelectedDropdown}
                                selectedDropdown={selectedDropdown}
                                searchStickyWrRef={searchStickyWrRef}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.stickyGap} style={{ height: searchBarGapHeight }} />
        </div>
    );
};

export default observer(SearchBar);
