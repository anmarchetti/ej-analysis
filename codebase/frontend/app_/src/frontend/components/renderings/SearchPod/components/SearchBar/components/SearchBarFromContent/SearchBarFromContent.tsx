import { FC, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { useSuggestionsPopupNavigation } from 'frontend/hooks/useSuggestionsPopupNavigation';
import { getFilteredAirports, hasEnoughSymbolsToSearch } from 'frontend/utils/search/searchPod.utils';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import { removeNullAndUndefinedFromString } from 'frontend/utils/string.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import {
    SearchPodEventActions,
    SearchPodEventLabels,
    SearchPodGenericValues,
} from 'models/data/tracking/SearchPodEvent';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventCategories } from 'models/enum/tracking/GenericEventParams';
import { IAirportCountry } from 'models/sitecore/IAirportsData';
import Drawer from 'frontend/components/common/Drawer';
import SearchBarDropdownAirports from 'frontend/components/common/SearchBarDropdownAirports/SearchBarDropdownAirports';
import SearchBarSuggestionsPopup, {
    SearchBarSuggestionsPopupType,
} from 'frontend/components/common/SearchBarSuggestionsPopup/SearchBarSuggestionsPopup';
import IconPlainDeparture from 'frontend/components/icons/PlainDeparture';
import SBInput from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SBInput/SBInput';
import SearchBarAnimatedDropdown from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarAnimatedDropdown/SearchBarAnimatedDropdown';
import SearchBarErrorMessage from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarErrorMessage/SearchBarErrorMessage';
import { useBodyScrollLockViaBlur } from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useBodyScrollLockViaBlur';
import useInputAreaFocus from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useInputAreaFocus';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

export interface ISearchBarFromContentProps {
    changeSelectedDropdown: (field: SearchBarDropdown | null) => void;
    countries: IAirportCountry[];
    searchBarRef: React.RefObject<HTMLDivElement>;
    selectedDropdown: SearchBarDropdown | null;
    setIsBodyScrollLockedViaBlur: (value: boolean) => void;
}

const SearchBarFromContent: FC<ISearchBarFromContentProps> = ({
    changeSelectedDropdown,
    countries,
    searchBarRef,
    selectedDropdown,
    setIsBodyScrollLockedViaBlur,
}) => {
    const {
        getPhrase,
        originsDisplayValue,
        hasErrorInField,
        availableOriginsCodes,
        origins,
        onClearOrigins,
        clearOriginFromGeo,
        onAddOrigin,
        setOrigins,
        onRemoveOrigin,
        marketCode,
        trackEventWithParams,
        trackSearchPodFromSuggestionClick,
    } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        originsDisplayValue: stores.searchStore.searchFrom.displayValue,
        hasErrorInField: stores.searchStore.hasErrorInField,
        availableOriginsCodes: stores.searchStore.searchFrom.availableOriginsCodes,
        origins: stores.searchStore.searchFrom.origins,
        onClearOrigins: stores.searchStore.searchFrom.onClearOrigins,
        clearOriginFromGeo: stores.searchStore.searchFrom.clearOriginFromGeo,
        onAddOrigin: stores.searchStore.searchFrom.onAddOrigin,
        setOrigins: stores.searchStore.searchFrom.setOrigins,
        onRemoveOrigin: stores.searchStore.searchFrom.onRemoveOrigin,
        marketCode: stores.marketStore.marketCode,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        trackSearchPodFromSuggestionClick: stores.trackingStore.searchPod.trackSearchPodFromSuggestionClick,
    }));

    const {
        fields: { FromFieldPlaceholder, FromFieldAriaDescription, FromFieldDropdownToggle, FromDropdownLabel } = {},
    } = useSearchPodStore();

    const isMobile = useMobileViewport();

    const [isSuggestionsPopupShown, setIsSuggestionsPopupShown] = useState<boolean>(false);
    const [isUserInteractingWithFrom, setIsUserInteractingWithFrom] = useState(false);
    const [isMainInputFocused, setIsMainInputFocused] = useState<boolean>(false);
    const [isMobileInputFocused, setIsMobileInputFocused] = useState<boolean>(false);
    const [typedValue, setTypedValue] = useState<string>('');
    const [filteredPlaces, setFilteredPlaces] = useState<{
        hasUnavailableOrigins: boolean;
        places: IDestinationCountry[];
    }>({
        hasUnavailableOrigins: false,
        places: [],
    });
    const [isHidePlaceholder, setIsHidePlaceholder] = useState<boolean>(!!origins?.length);

    const mobileInputRef = useRef<HTMLInputElement | null>(null);
    const mainInputRef = useRef<HTMLInputElement | null>(null);
    const interactableFieldRef = useRef<HTMLDivElement | null>(null);

    const valueFromStore = useMemo(
        () => removeNullAndUndefinedFromString(`${originsDisplayValue?.main} ${originsDisplayValue?.add}`),
        [originsDisplayValue?.main, originsDisplayValue?.add],
    );

    const isFromDropdownSelected = selectedDropdown === SearchBarDropdown.From;
    const desktopValue = isMainInputFocused ? typedValue : valueFromStore;
    const isMobileClearButtonShown = !origins?.length;

    useEffect(() => {
        // origins are changed with gap
        setIsHidePlaceholder(isUserInteractingWithFrom ? true : !!origins?.length);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [origins?.join(','), isUserInteractingWithFrom]);

    useBodyScrollLockViaBlur({ mobileInputRef, setIsBodyScrollLockedViaBlur });

    const reset = (): void => {
        setIsMainInputFocused(false);
        setIsUserInteractingWithFrom(false);
        setIsMobileInputFocused(false);
        closeSuggestionPopup();
        isFromDropdownSelected && changeSelectedDropdown(null);
    };

    useInputAreaFocus({
        reset,
        interactableFieldRef,
        isUserInteractingWithInput: isUserInteractingWithFrom,
        isDropdownSelected: isFromDropdownSelected,
    });

    const closeSuggestionPopup = (): void => {
        setIsSuggestionsPopupShown(false);
        setTypedValue('');
        setFilteredPlaces({
            hasUnavailableOrigins: false,
            places: [],
        });
    };

    const onType = (value: string): void => {
        setTypedValue(value);
        const showPopup = hasEnoughSymbolsToSearch(value);
        setIsSuggestionsPopupShown(showPopup);

        if (showPopup) {
            const [places, hasUnavailableOrigins] = getFilteredAirports(
                value,
                countries,
                marketCode,
                availableOriginsCodes,
                getPhrase(SitecoreDictionary.SearchPodLabelsAll),
            );
            setFilteredPlaces({ places, hasUnavailableOrigins });
        }
    };

    const onInputClick = (): void => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: SearchPodEventActions.FromFieldClick,
                eventCategory: EventCategories.SearchPod,
                eventType: EventTypes.Interaction,
                eventValue: null,
                eventLabel: null,
            },
            generateGenericValues({
                genericValue1: SearchPodGenericValues.MainFromField,
                destinationUrl: null,
            }),
        );
    };

    const onFocusMainInput = (): void => {
        setIsUserInteractingWithFrom(true);
        setIsMainInputFocused(true);
        setIsHidePlaceholder(true);

        if (!isMobile) {
            changeSelectedDropdown(null);
        }

        if (isMobile) {
            changeSelectedDropdown(SearchBarDropdown.From);
            mobileInputRef?.current?.focus();
        }
    };

    const onDropdownClose = (): void => {
        reset();
        changeSelectedDropdown(null);
    };

    const clickOnListButtonDesktop = (): void => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: SearchPodEventActions.FromFieldClick,
                eventCategory: EventCategories.SearchPod,
                eventType: EventTypes.Interaction,
                eventLabel: SearchPodEventLabels.BurgerMenu,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1: SearchPodGenericValues.MainFromField,
                destinationUrl: null,
            }),
        );

        if (isSuggestionsPopupShown) {
            closeSuggestionPopup();
        }

        setIsMainInputFocused(false);

        if (origins?.length === 0) {
            setIsHidePlaceholder(!isFromDropdownSelected);
        }

        setIsUserInteractingWithFrom(!isFromDropdownSelected);
        changeSelectedDropdown(isFromDropdownSelected ? null : SearchBarDropdown.From);
    };

    const onAddAirport = (code: string): void => {
        onAddOrigin(code);
    };

    const selectOriginFromSuggestionPopup = (codes: string[], place: IDestinationCountry | IDestination): void => {
        setOrigins(codes);
        reset();
        mainInputRef?.current?.blur();

        trackSearchPodFromSuggestionClick(place, typedValue);

        if (isMobile) {
            changeSelectedDropdown(null);
        }
    };

    const onSetOrigins = (codes: string[]): void => {
        setOrigins(codes);
    };

    const onRemoveAirport = (code: string): void => {
        onRemoveOrigin(code);
    };

    const onClear = (): void => {
        closeSuggestionPopup();
        mainInputRef?.current?.focus();
        clearSelectedOrigins();

        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: SearchPodEventActions.FromFieldClick,
                eventCategory: EventCategories.SearchPod,
                eventType: EventTypes.Interaction,
                eventValue: null,
                eventLabel: null,
            },
            generateGenericValues({
                genericValue1: SearchPodGenericValues.MainFromField,
                genericValue2: SearchPodGenericValues.Clear,
                genericValue3: isMobile ? valueFromStore : desktopValue,
                destinationUrl: null,
            }),
        );
    };

    const clearSelectedOrigins = (): void => {
        onClearOrigins();
        clearOriginFromGeo();
    };

    const { popupItemHighlightedIdx, resetHighlightedIdx, sbInputKeyboardEvent } = useSuggestionsPopupNavigation(
        selectOriginFromSuggestionPopup,
        filteredPlaces.places,
        availableOriginsCodes,
    );

    const commonSearchBarDropdownAirportsProps = {
        countries,
        airports: origins || [],
        setOrigins: onSetOrigins,
        onAddAirport,
        onRemoveAirport,
        onClear: clearSelectedOrigins,
    };

    const commonSearchBarInputProps = {
        icon: <IconPlainDeparture />,
        label: getPhrase(SitecoreDictionary.GlobalsLabelsFrom),
        placeholder: getFieldValue(FromFieldPlaceholder),
        ariaDescription: getFieldValue(FromFieldAriaDescription),
        dropdownToggleLabel: getFieldValue(FromFieldDropdownToggle),
        isEditable: true,
        isError: hasErrorInField(SearchBarDropdown.From),
        onType,
    };

    return (
        <div className='field-box field-box--from' data-tid='from-field-box'>
            <div ref={interactableFieldRef}>
                <div className='search-bar__input-wr'>
                    <SBInput
                        {...commonSearchBarInputProps}
                        id='search-from'
                        clickOnListButton={clickOnListButtonDesktop}
                        onFocus={onFocusMainInput}
                        onKeyDown={sbInputKeyboardEvent}
                        inputRef={mainInputRef}
                        hidePlaceholder={isHidePlaceholder}
                        showClearButton={!isMobile}
                        value={isMobile ? valueFromStore : desktopValue}
                        isInputHighlighted={isUserInteractingWithFrom}
                        onClearButtonClick={onClear}
                        onClick={onInputClick}
                    />

                    {!isMobile && isSuggestionsPopupShown && (
                        <div className='sb-popup-placeholder'>
                            <SearchBarSuggestionsPopup
                                places={filteredPlaces.places}
                                onSelect={selectOriginFromSuggestionPopup}
                                type={SearchBarSuggestionsPopupType.Row}
                                filterValue={typedValue}
                                availableCodes={availableOriginsCodes}
                                parentHtmlElement={searchBarRef}
                                highlightedIdx={popupItemHighlightedIdx}
                                resetHighlightedIdx={resetHighlightedIdx}
                                hasBlockedPlaces={filteredPlaces.hasUnavailableOrigins}
                            />
                        </div>
                    )}
                </div>

                {!isMobile && (
                    <SearchBarErrorMessage
                        field={SearchBarDropdown.From}
                        withDescription
                        isActive={isUserInteractingWithFrom}
                    />
                )}

                {!isMobile && (
                    <SearchBarAnimatedDropdown isOpened={isFromDropdownSelected} selectedDropdown={selectedDropdown}>
                        <SearchBarDropdownAirports
                            {...commonSearchBarDropdownAirportsProps}
                            id='search-from-dd'
                            onClose={onDropdownClose}
                            isDialogRole
                        />
                    </SearchBarAnimatedDropdown>
                )}
            </div>

            {isMobile && (
                <Drawer open={isFromDropdownSelected} aria-label={getFieldValue(FromDropdownLabel)}>
                    <div className='search-bar__mobile-box'>
                        <div className='search-bar__input-wr'>
                            <SBInput
                                {...commonSearchBarInputProps}
                                id='search-from--drawer'
                                clickOnListButton={onDropdownClose}
                                inputRef={mobileInputRef}
                                isInputHighlighted
                                hidePlaceholder
                                showClearButton={false}
                                value={isMobileInputFocused ? typedValue : valueFromStore}
                                onInputBlur={(): void => {
                                    setIsMobileInputFocused(false);
                                }}
                                onFocus={(): void => {
                                    setIsMobileInputFocused(true);
                                }}
                                onClick={onInputClick}
                            />
                        </div>

                        {isSuggestionsPopupShown && (
                            <div
                                className={classNames('sb-popup-placeholder', {
                                    'sb-popup-placeholder--nothing-selected': isMobileClearButtonShown,
                                })}
                            >
                                <SearchBarSuggestionsPopup
                                    places={filteredPlaces.places}
                                    onSelect={selectOriginFromSuggestionPopup}
                                    type={SearchBarSuggestionsPopupType.Row}
                                    filterValue={typedValue}
                                    availableCodes={availableOriginsCodes}
                                    parentHtmlElement={searchBarRef}
                                    hasBlockedPlaces={filteredPlaces.hasUnavailableOrigins}
                                />
                            </div>
                        )}

                        <div
                            className={classNames('search-bar__dd-wr', {
                                'search-bar__dd-wr--nothing-selected': isMobileClearButtonShown,
                            })}
                        >
                            {!isSuggestionsPopupShown && (
                                <SearchBarErrorMessage
                                    field={SearchBarDropdown.From}
                                    withDescription
                                    isActive={isUserInteractingWithFrom}
                                />
                            )}

                            <SearchBarDropdownAirports
                                {...commonSearchBarDropdownAirportsProps}
                                id='search-from-dd--drawer'
                                onClose={onDropdownClose}
                            />
                        </div>
                    </div>
                </Drawer>
            )}
        </div>
    );
};

export default observer(SearchBarFromContent);
