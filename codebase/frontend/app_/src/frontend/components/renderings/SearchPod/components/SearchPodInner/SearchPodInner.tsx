import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react';

import useClickOutside from 'frontend/hooks/useClickOutside';
import useConstructor from 'frontend/hooks/useConstructor';
import { useMount } from 'frontend/hooks/useMount';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { debounce } from 'frontend/utils/debounce';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SearchPodAlternativeView from 'models/enum/SearchPodAlternativeView';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import HeightAnimatedContainer from 'frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer';
import BackToSearch from 'frontend/components/renderings/SearchPod/components/BackToSearch/BackToSearch';
import SearchBar from 'frontend/components/renderings/SearchPod/components/SearchBar/SearchBar';
import SearchParametersPreview from 'frontend/components/renderings/SearchPod/components/SearchParametersPreview/SearchParametersPreview';
import { ISearchPodFields, ISearchPodSitecoreParameters } from 'frontend/components/renderings/SearchPod/models';

interface ISearchPodInnerProps extends ISitecoreComponent<ISearchPodFields, ISearchPodSitecoreParameters> {
    freezeHeight?: () => void;
    resetHeight?: () => void;
}

const CHEAPEST_MONTH_DEBOUNCE = 500;

/**
 * SearchPodInner manages different modes of the search pod component: regular 'edit' view, 'back to search' button, and summary view.
 * For more details, refer to the Confluence page:
 * https://easyjet.atlassian.net/wiki/spaces/EH/pages/468714207/Search+Pod+Variant#Behavioral-Search-Pod-Modes%3A

 */
export const SearchPodInner: FC<ISearchPodInnerProps> = ({ rendering, params, resetHeight, freezeHeight }) => {
    const {
        setIsSearchPodExpanded,
        collectOriginsTitles,
        isNeedOpenWhenField,
        setNeedOpenWhenField,
        isReferer,
        isHotelDetailsBookPage,
        isHotelDetailsBrowsePagePreview,
        needOpenSearchPodWhoField,
        isGuestsParametersForBookingValid,
        hasOffers,
        isOldParamSet,
        setOldSearchParamToSearchParam,
        selectedDestinations,
        updateCheapestMonthPrices,
        origins,
        roomsAllocation,
        totalGuestsQuantity,
        monthSearchDuration,
        isAutoAllocation,
        isMobileAppHideFeatures,
    } = useStore((stores: TStores) => ({
        setIsSearchPodExpanded: stores.searchStore.setIsSearchPodExpanded,
        collectOriginsTitles: stores.searchStore.collectOriginsTitles,
        isNeedOpenWhenField: stores.searchStore.isNeedOpenWhenField,
        setNeedOpenWhenField: stores.searchStore.setNeedOpenWhenField,
        isReferer: stores.queryParamStore.isReferer,
        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
        isHotelDetailsBrowsePagePreview: stores.layoutStore.isHotelDetailsBrowsePagePreview,
        needOpenSearchPodWhoField: stores.queryParamStore.needOpenSearchPodWhoField,
        isGuestsParametersForBookingValid: stores.bookingStore.isGuestsParametersValid,
        hasOffers: stores.hotelsStore.hasOffers,
        isOldParamSet: stores.searchStore.isOldParamSet,
        setOldSearchParamToSearchParam: stores.searchStore.setOldSearchParamToSearchParam,
        selectedDestinations: stores.searchStore.searchTo.selectedDestinations,
        roomsAllocation: stores.searchStore.searchWho.roomsAllocation,
        totalGuestsQuantity: stores.searchStore.searchWho.totalGuestsQuantity,
        origins: stores.searchStore.searchFrom.origins,
        updateCheapestMonthPrices: stores.searchStore.searchWhen.updateCheapestMonthPrices,
        isAutoAllocation: stores.searchStore.searchWho.isAutoAllocation,
        monthSearchDuration: stores.searchStore.searchWhen.monthSearchDuration,
        isMobileAppHideFeatures: stores.layoutStore.isMobileAppHideFeatures,
    }));

    const [isSearchEditMode, setIsSearchEditMode] = useState(false);
    const [selectedDropdown, setSelectedDropdown] = useState<SearchBarDropdown | null>(null);
    const wrapperRef = useRef(null);

    const alternativeView = params?.AlternativeView;
    const isTitleShown = isSitecoreCheckboxSelected(params?.ShowTitle);

    const isAlternativeViewSummarized = alternativeView === SearchPodAlternativeView.SummarisedView;
    const isAlternativeViewBackToSearch = alternativeView === SearchPodAlternativeView.BackToSearchView;

    /** In mobile app, Back to Search view should show Search Parameters Preview instead of Back to Search button,
     * since back button is already available in the app header
     **/
    const isMobileAppBackToSearchView = isMobileAppHideFeatures && isAlternativeViewBackToSearch;

    const isBackToSearchVisible =
        (isSearchEditMode && isAlternativeViewSummarized) ||
        (!isMobileAppHideFeatures && isAlternativeViewBackToSearch) ||
        (isSearchEditMode && isMobileAppBackToSearchView);

    const isSearchParametersPreviewVisible =
        (!isSearchEditMode && isAlternativeViewSummarized) || (!isSearchEditMode && isMobileAppBackToSearchView);

    /** Open Who Field if there is a corresponding query param
     * OR
     * if pax config is invalid on booking steps (pages where search pod in alternative view mode)
     **/
    const shouldOpenAndValidateWhoField =
        (needOpenSearchPodWhoField() && !isReferer) || (!!alternativeView && !isGuestsParametersForBookingValid);
    useMount(() => {
        if (shouldOpenAndValidateWhoField) {
            setSelectedDropdown(SearchBarDropdown.Who);
        }
    });

    /**
     * Should auto open when field if Search Pod has isReferer query param and has no offers
     */
    const shouldAutoOpenWhenField = isReferer && !hasOffers && !shouldOpenAndValidateWhoField && !!alternativeView;

    const updateCheapestMonthPricesDebounce = useMemo(
        () => debounce(updateCheapestMonthPrices, CHEAPEST_MONTH_DEBOUNCE),
        [updateCheapestMonthPrices],
    );

    const updateEditMode = (state?: boolean): void => {
        const newState = state === undefined ? !isSearchEditMode : state;
        setIsSearchEditMode(newState);
    };

    useConstructor(() => {
        const initialEditMode = shouldOpenAndValidateWhoField || !alternativeView;
        updateEditMode(initialEditMode);
        collectOriginsTitles(rendering.fields?.airportsGroups ?? []);
    });

    useEffect(() => {
        updateCheapestMonthPricesDebounce();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDestinations, origins, roomsAllocation, totalGuestsQuantity, monthSearchDuration, isAutoAllocation]);

    useEffect(() => {
        if (isNeedOpenWhenField && !isSearchEditMode) {
            updateEditMode(true);
        }
    }, [isNeedOpenWhenField]);

    useEffect(() => {
        const shouldAutoOpen = shouldAutoOpenWhenField && isSearchEditMode;

        if (shouldAutoOpenWhenField) {
            setNeedOpenWhenField(shouldAutoOpen);
        }
    }, [isSearchEditMode]);

    const onOpenSearchBarDropdown = (dropdown: SearchBarDropdown): void => {
        updateEditMode(true);

        // do not set default opened dropdown if from referer and has no offers, as it's already opened in updateEditMode
        if (dropdown === SearchBarDropdown.When && shouldAutoOpenWhenField) {
            return;
        }

        setSelectedDropdown(dropdown);
    };

    const onSubmitSearchParameters = (): void => {
        if (alternativeView) {
            updateEditMode();
        }
    };

    const collapseSearchPod = (): void => {
        if (alternativeView) {
            updateEditMode(false);

            isHotelDetailsBookPage && setIsSearchPodExpanded(false);
        }

        if (isOldParamSet) {
            setOldSearchParamToSearchParam();
        }
    };

    useClickOutside(wrapperRef, collapseSearchPod);

    if (isHotelDetailsBrowsePagePreview) return null;

    return (
        <div ref={wrapperRef} data-tid='search-pod-inner'>
            <HeightAnimatedContainer isOpened={isSearchParametersPreviewVisible}>
                <div className='search-bar-box sbv3'>
                    <SearchParametersPreview
                        onEdit={updateEditMode}
                        onOpenSearchBarDropdown={onOpenSearchBarDropdown}
                    />
                </div>
            </HeightAnimatedContainer>

            <HeightAnimatedContainer isOpened={isBackToSearchVisible}>
                <BackToSearch
                    isBackButtonAvailable={
                        alternativeView === SearchPodAlternativeView.BackToSearchView && !isMobileAppHideFeatures
                    }
                    isEditMode={isSearchEditMode}
                    onClickEdit={updateEditMode}
                />
            </HeightAnimatedContainer>
            <HeightAnimatedContainer
                onEnter={(): void => {
                    freezeHeight?.();
                }}
                isOpened={isSearchEditMode}
                onExited={(): void => {
                    setSelectedDropdown(null);
                    resetHeight?.();
                }}
            >
                <div className='search-bar-box sbv3'>
                    <SearchBar
                        block={!isTitleShown}
                        changeSelectedDropdown={setSelectedDropdown}
                        countries={rendering.fields?.airportsGroups ?? []}
                        onSubmit={onSubmitSearchParameters}
                        selectedDropdown={selectedDropdown}
                    />
                </div>
            </HeightAnimatedContainer>
        </div>
    );
};

export default observer(SearchPodInner);
