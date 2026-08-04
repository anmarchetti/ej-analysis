import { FC, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { useMount } from 'frontend/hooks/useMount';
import useStore from 'frontend/hooks/useStore';
import { useSuggestionsPopupNavigation } from 'frontend/hooks/useSuggestionsPopupNavigation';
import { getFilteredDestinations, hasEnoughSymbolsToSearch } from 'frontend/utils/search/searchPod.utils';
import { getFieldValue, isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { removeNullAndUndefinedFromString } from 'frontend/utils/string.utils';
import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SiteSettings from 'models/enum/SiteSettings';
import Drawer from 'frontend/components/common/Drawer';
import SearchBarDropdownTo from 'frontend/components/common/SearchBarDropdownTo/SearchBarDropdownTo';
import SearchBarSuggestionsPopup, {
    SearchBarSuggestionsPopupType,
} from 'frontend/components/common/SearchBarSuggestionsPopup/SearchBarSuggestionsPopup';
import IconChevron from 'frontend/components/icons/Shevron';
import SBInput from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SBInput/SBInput';
import SearchBarAnimatedDropdown from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarAnimatedDropdown/SearchBarAnimatedDropdown';
import SearchBarErrorMessage from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarErrorMessage/SearchBarErrorMessage';
import InspirationCallout from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarToContent/components/InspirationCallout/InspirationCallout';
import SearchToHotelMessage from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarToContent/components/SearchToHotelMessage/SearchToHotelMessage';
import { useBodyScrollLockViaBlur } from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useBodyScrollLockViaBlur';
import useInputAreaFocus from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useInputAreaFocus';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

export interface ISearchBarToContentProps {
    changeSelectedDropdown: (field: SearchBarDropdown | null) => void;
    searchBarRef: RefObject<HTMLDivElement>;
    selectedDropdown: SearchBarDropdown | null;
    setIsBodyScrollLockedViaBlur: (value: boolean) => void;
}

const SearchBarToContent: FC<ISearchBarToContentProps> = ({
    changeSelectedDropdown,
    searchBarRef,
    selectedDropdown,
    setIsBodyScrollLockedViaBlur,
}) => {
    const {
        getSetting,
        hasErrorInField,
        isDestinationsSearchLoading,
        selectedDestinationCodes,
        destinationsDisplayValue,
        clearDestinations,
        typeAheadResult,
        selectSingleDestination,
        addDestination,
        availableOriginsCodes,
        isHotelDetailsBookPage,
        isHotelBookSelectedDestination,
        searchTypeAheadDestinations,
        trackSearchPodToSuggestionClick,
        trackToClearClick,
        trackToInputClick,
        trackToBurgerMenuClick,
        isTradePortal,
    } = useStore(stores => ({
        getSetting: stores.layoutStore.getSetting,
        hasErrorInField: stores.searchStore.hasErrorInField,
        isDestinationsSearchLoading: stores.searchStore.searchTo.isDestinationsSearchLoading,
        selectedDestinationCodes: stores.searchStore.searchTo.selectedDestinationCodes,
        destinationsDisplayValue: stores.searchStore.searchTo.displayValue,
        clearDestinations: stores.searchStore.searchTo.clearDestinations,
        typeAheadResult: stores.searchStore.searchTo.typeAheadDestinations,
        selectSingleDestination: stores.searchStore.searchTo.selectSingleDestination,
        addDestination: stores.searchStore.searchTo.addDestination,
        availableOriginsCodes: stores.searchStore.searchFrom.availableOriginsCodes,
        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
        isHotelBookSelectedDestination: stores.searchStore.isHotelBookSelectedDestination,
        searchTypeAheadDestinations: stores.searchStore.searchTo.searchTypeAheadDestinations,
        trackSearchPodToSuggestionClick: stores.trackingStore.searchPod.trackSearchPodToSuggestionClick,
        trackToClearClick: stores.trackingStore.searchPod.trackToClearClick,
        trackToInputClick: stores.trackingStore.searchPod.trackToInputClick,
        trackToBurgerMenuClick: stores.trackingStore.searchPod.trackToBurgerMenuClick,
        isTradePortal: stores.layoutStore.isTradePortal,
    }));

    const {
        fields: {
            ToFieldLabel,
            ToDropdownLabel,
            ToFieldPlaceholder,
            ToFieldAriaDescription,
            ToFieldDropdownToggle,
            InspirationCalloutHolidaysText,
            InspirationCalloutTradePortalText,
            InspirationCalloutHolidaysTitle,
            InspirationCalloutTradePortalTitle,
        } = {},
    } = useSearchPodStore();

    const calloutTitleField = isTradePortal ? InspirationCalloutTradePortalTitle : InspirationCalloutHolidaysTitle;
    const calloutTitle = getFieldValue(calloutTitleField);
    const calloutTextField = isTradePortal ? InspirationCalloutTradePortalText : InspirationCalloutHolidaysText;
    const calloutText = getFieldValue(calloutTextField);
    const isTextIncludeLink = calloutText?.includes('<a');

    const isMobile = useMobileViewport();

    const [isSuggestionsPopupShown, setIsSuggestionsPopupShown] = useState<boolean>(false);

    const [isUserInteractingWithTo, setIsUserInteractingWithTo] = useState(false);
    const [isMainInputFocused, setIsMainInputFocused] = useState<boolean>(false);
    const [isMobileInputFocused, setIsMobileInputFocused] = useState<boolean>(false);
    const [typedValue, setTypedValue] = useState<string>('');
    const [isInspirationCalloutShown, setIsInspirationCalloutShown] = useState<boolean>(false);
    const [isSearchToHotelMessageShown, setIsSearchToHotelMessageShown] = useState<boolean>(false);

    const mobileInputRef = useRef<HTMLInputElement | null>(null);
    const mainInputRef = useRef<HTMLInputElement | null>(null);
    const interactableFieldRef = useRef<HTMLDivElement | null>(null);
    const mobileDropdownRef = useRef<HTMLDivElement | null>(null);

    const valueFromStore = useMemo(
        () => removeNullAndUndefinedFromString(`${destinationsDisplayValue?.main} ${destinationsDisplayValue?.add}`),
        [destinationsDisplayValue?.main, destinationsDisplayValue?.add],
    );

    const isToDropdownSelected = selectedDropdown === SearchBarDropdown.To;
    const desktopValue = isMainInputFocused ? typedValue : valueFromStore;
    const isCloseBtnHidden = selectedDestinationCodes.length === 0;

    const isHidePlaceholder = isUserInteractingWithTo || !!selectedDestinationCodes?.length || !!valueFromStore?.trim();

    useBodyScrollLockViaBlur({ mobileInputRef, setIsBodyScrollLockedViaBlur });

    const reset = (): void => {
        setIsMainInputFocused(false);
        setIsUserInteractingWithTo(false);
        setIsMobileInputFocused(false);
        closeSuggestionPopup();
        closeInspirePopup();
        closeSearchToHotelMessagePopup();
        isToDropdownSelected && changeSelectedDropdown(null);
    };

    useInputAreaFocus({
        reset,
        interactableFieldRef,
        isUserInteractingWithInput: isUserInteractingWithTo,
        isDropdownSelected: isToDropdownSelected,
    });

    const closeSuggestionPopup = (): void => {
        setIsSuggestionsPopupShown(false);
        setTypedValue('');
    };

    const handleCancelInspirePopup = (): void => {
        setIsMainInputFocused(false);
        setIsUserInteractingWithTo(false);
        closeInspirePopup();
    };

    const closeInspirePopup = (): void => {
        setIsInspirationCalloutShown(false);
    };

    const closeSearchToHotelMessagePopup = (): void => {
        setIsSearchToHotelMessageShown(false);
    };

    const onType = (value: string): void => {
        closeInspirePopup();
        setTypedValue(value);
        const showPopup = hasEnoughSymbolsToSearch(value);
        setIsSuggestionsPopupShown(showPopup);

        if (showPopup) {
            searchTypeAheadDestinations(value);
        }
    };

    const filteredPlaces = useMemo(
        () => getFilteredDestinations(typedValue, typeAheadResult),
        [typedValue, typeAheadResult],
    );

    const onFocusMainInput = (): void => {
        const isTooltipShownOnDesktop = isSitecoreCheckboxSelected(
            getSetting(SiteSettings.IsTooltipOnSearchPodDesktopEnabled),
        );

        if (isSearchToHotelMessageShown) {
            closeSearchToHotelMessagePopup();
        }

        if (isTooltipShownOnDesktop && !isUserInteractingWithTo && !isMobile) {
            setIsInspirationCalloutShown(true);
        }

        setIsUserInteractingWithTo(true);
        setIsMainInputFocused(true);

        if (!isMobile) {
            changeSelectedDropdown(null);
        }

        if (isMobile) {
            changeSelectedDropdown(SearchBarDropdown.To);
            toggleSearchToHotelMessage();
            mobileInputRef?.current?.focus();
        }
    };

    const clickOnMobileInput = (): void => {
        const isTooltipShownOnMobile = isSitecoreCheckboxSelected(
            getSetting(SiteSettings.IsTooltipOnSearchPodMobileEnabled),
        );

        if (isTooltipShownOnMobile) {
            setIsInspirationCalloutShown(true);
        }

        onInputClick();
    };

    const onDropdownClose = (): void => {
        reset();
        changeSelectedDropdown(null);
    };

    const clickOnListButtonDesktop = (): void => {
        if (isSuggestionsPopupShown) {
            closeSuggestionPopup();
        }

        if (isInspirationCalloutShown) {
            closeInspirePopup();
        }

        setIsMainInputFocused(false);

        setIsUserInteractingWithTo(!isToDropdownSelected);
        changeSelectedDropdown(isToDropdownSelected ? null : SearchBarDropdown.To);

        trackToBurgerMenuClick();
    };

    const selectDestinationFromSuggestionPopup = (codes: string[], place: IDestinationCountry | IDestination): void => {
        const resetAfterSelection = (): void => {
            reset();
            mainInputRef?.current?.blur();

            if (isMobile) {
                changeSelectedDropdown(null);
            }
        };
        const destinations = typeAheadResult?.destinations;

        if (destinations) {
            /** If one dest selected and it has Giata code, it means that selected hotel probably has duplicated records.
             *  We need to add them to selected destinations */
            if (codes.length === 1) {
                const selectedDestination = destinations.find(dst => dst.code === codes[0]);

                if (selectedDestination?.giataCode) {
                    destinations
                        .filter(dst => dst.giataCode === selectedDestination.giataCode)
                        .forEach(dst => {
                            addDestination(dst, false, true);
                        });

                    resetAfterSelection();

                    trackSearchPodToSuggestionClick(place, typedValue);

                    return;
                }
            }

            destinations.forEach(destination => {
                if (codes.indexOf(destination.code) != -1) {
                    selectSingleDestination(destination);
                }
            });
        }

        resetAfterSelection();
        trackSearchPodToSuggestionClick(place, typedValue);
    };

    const onClear = (): void => {
        closeSuggestionPopup();
        mainInputRef?.current?.focus();
        clearDestinations();

        trackToClearClick(isMobile, valueFromStore, desktopValue);
    };

    const onInputClick = (): void => {
        trackToInputClick(isTextIncludeLink);
    };

    const { popupItemHighlightedIdx, resetHighlightedIdx, sbInputKeyboardEvent } = useSuggestionsPopupNavigation(
        selectDestinationFromSuggestionPopup,
        filteredPlaces,
        availableOriginsCodes,
    );

    /**
     * Show "Search to Hotel Message" on Hotel Book Page (EJH-14920)
     * if start edit search and current hotel isn't selected destination
     */
    const toggleSearchToHotelMessage = (): void => {
        if (
            !!getSetting(SiteSettings.IsSearchToHotelMessageEnabled) &&
            isHotelDetailsBookPage &&
            !isHotelBookSelectedDestination
        ) {
            setIsSearchToHotelMessageShown(true);
        }
    };

    useMount(() => {
        if (!isMobile && !selectedDropdown) {
            toggleSearchToHotelMessage();
        }
    });

    useEffect(() => {
        const dropdownElement = mobileDropdownRef.current;

        if (!dropdownElement || !isMobile || !isToDropdownSelected) return;

        const handleScroll = (): void => {
            if (isInspirationCalloutShown) {
                closeInspirePopup();
            }
        };

        dropdownElement.addEventListener('scroll', handleScroll);

        return () => {
            dropdownElement.removeEventListener('scroll', handleScroll);
        };
    }, [isMobile, isToDropdownSelected, isInspirationCalloutShown]);

    const dropdownLabel = getFieldValue(ToDropdownLabel);

    const commonSearchBarInputProps = {
        icon: <IconChevron />,
        label: getFieldValue(ToFieldLabel),
        placeholder: getFieldValue(ToFieldPlaceholder),
        ariaDescription: getFieldValue(ToFieldAriaDescription),
        dropdownToggleLabel: getFieldValue(ToFieldDropdownToggle),
        isEditable: true,
        isError: hasErrorInField(SearchBarDropdown.To),
        onType,
    };

    return (
        <div className='field-box field-box--to' data-tid='to-field-box'>
            <div ref={interactableFieldRef}>
                <div className='search-bar__input-wr'>
                    <SBInput
                        {...commonSearchBarInputProps}
                        id='search-to'
                        clickOnListButton={clickOnListButtonDesktop}
                        onFocus={onFocusMainInput}
                        onKeyDown={sbInputKeyboardEvent}
                        inputRef={mainInputRef}
                        hidePlaceholder={isHidePlaceholder}
                        showClearButton={!isMobile}
                        value={isMobile ? valueFromStore : desktopValue}
                        isInputHighlighted={isUserInteractingWithTo}
                        onClearButtonClick={onClear}
                        onClick={onInputClick}
                    />

                    {isInspirationCalloutShown && !isMobile && (
                        <InspirationCallout
                            onCancel={handleCancelInspirePopup}
                            isTextIncludeLink={isTextIncludeLink}
                            calloutText={calloutText}
                            calloutTitle={calloutTitle}
                        />
                    )}

                    {!isMobile && isSearchToHotelMessageShown && (
                        <SearchToHotelMessage
                            onApplySearchToHotel={closeSearchToHotelMessagePopup}
                            onClose={closeSearchToHotelMessagePopup}
                        />
                    )}

                    {!isMobile && isSuggestionsPopupShown && (
                        <div className='sb-popup-placeholder'>
                            <SearchBarSuggestionsPopup
                                places={filteredPlaces}
                                type={SearchBarSuggestionsPopupType.Multiline}
                                onSelect={selectDestinationFromSuggestionPopup}
                                filterValue={typedValue}
                                availableCodes={null}
                                parentHtmlElement={searchBarRef}
                                isLoading={isDestinationsSearchLoading}
                                highlightedIdx={popupItemHighlightedIdx}
                                resetHighlightedIdx={resetHighlightedIdx}
                            />
                        </div>
                    )}
                </div>

                {!isMobile && <SearchBarErrorMessage field={SearchBarDropdown.To} isActive={isUserInteractingWithTo} />}

                {!isMobile && (
                    <SearchBarAnimatedDropdown isOpened={isToDropdownSelected} selectedDropdown={selectedDropdown}>
                        <SearchBarDropdownTo
                            id='search-to-dd'
                            onClose={onDropdownClose}
                            isDialogRole
                            title={dropdownLabel}
                        />
                    </SearchBarAnimatedDropdown>
                )}
            </div>

            {isMobile && (
                <Drawer open={isToDropdownSelected} aria-label={dropdownLabel}>
                    <div className='search-bar__mobile-box'>
                        <div className='search-bar__input-wr'>
                            <SBInput
                                {...commonSearchBarInputProps}
                                id='search-to--drawer'
                                clickOnListButton={onDropdownClose}
                                inputRef={mobileInputRef}
                                isInputHighlighted
                                hidePlaceholder
                                showClearButton={false}
                                value={isMobileInputFocused ? typedValue : valueFromStore}
                                onInputBlur={(): void => {
                                    setIsMobileInputFocused(false);

                                    closeInspirePopup();
                                }}
                                onFocus={(): void => {
                                    setIsMobileInputFocused(true);
                                }}
                                onClick={clickOnMobileInput}
                            />

                            {isInspirationCalloutShown && (
                                <span
                                    onMouseDown={(e: React.MouseEvent<HTMLDivElement>): void => {
                                        if (isTextIncludeLink) {
                                            e.preventDefault();
                                        }
                                    }}
                                    role='none'
                                >
                                    <InspirationCallout
                                        onCancel={handleCancelInspirePopup}
                                        isTextIncludeLink={isTextIncludeLink}
                                        calloutText={calloutText}
                                        calloutTitle={calloutTitle}
                                    />
                                </span>
                            )}

                            {isSearchToHotelMessageShown && (
                                <SearchToHotelMessage
                                    onApplySearchToHotel={closeSearchToHotelMessagePopup}
                                    onClose={closeSearchToHotelMessagePopup}
                                />
                            )}

                            {isSuggestionsPopupShown && (
                                <div
                                    className={classNames('sb-popup-placeholder', {
                                        'sb-popup-placeholder--nothing-selected': isCloseBtnHidden,
                                    })}
                                >
                                    <SearchBarSuggestionsPopup
                                        places={filteredPlaces}
                                        onSelect={selectDestinationFromSuggestionPopup}
                                        type={SearchBarSuggestionsPopupType.Multiline}
                                        filterValue={typedValue}
                                        availableCodes={null}
                                        parentHtmlElement={searchBarRef}
                                        isLoading={isDestinationsSearchLoading}
                                    />
                                </div>
                            )}
                        </div>

                        <div
                            className={classNames('search-bar__dd-wr', {
                                'search-bar__dd-wr--nothing-selected': isCloseBtnHidden,
                            })}
                        >
                            {!isSuggestionsPopupShown && (
                                <SearchBarErrorMessage
                                    field={SearchBarDropdown.To}
                                    isActive={isUserInteractingWithTo}
                                />
                            )}

                            {isToDropdownSelected && (
                                <SearchBarDropdownTo
                                    id='search-to-dd--drawer'
                                    onClose={onDropdownClose}
                                    title={dropdownLabel}
                                    ref={mobileDropdownRef}
                                />
                            )}
                        </div>
                    </div>
                </Drawer>
            )}
        </div>
    );
};

export default observer(SearchBarToContent);
