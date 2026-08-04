import { computed } from 'mobx';

import { DATE_FORMATS, DayjsLocale } from 'code/dates';
import { AUTO_ALLOCATION_SITECORE_VALUE } from 'frontend/store/base/search/SearchWhoStore';
import { TRootStore } from 'frontend/store/IStores';
import { haveSameElements } from 'frontend/utils/array.utils';
import { formatDateL10n, formatDatesRange } from 'frontend/utils/date.utils';
import { getDestinationsItemNameGroupedByParent } from 'frontend/utils/destinations.utils';
import { getAirportsItemNamesByCodes, getResentSearchTrackingData } from 'frontend/utils/search/search.utils';
import { buildTrackingValue, isWhenFieldPrePopulated } from 'frontend/utils/tracking/searchPod.utils';
import {
    buildDepartureTitles,
    buildMultiDepartureAirportsList,
    buildSelectedAirportsList,
    determineSelectionType,
    formatAirportName,
    getDisplayGroupName,
} from 'frontend/utils/tracking/searchPodFromField.utils';
import {
    buildFooterTrackingData,
    determineDestinationSelectionType,
    formatDestinationName,
} from 'frontend/utils/tracking/searchPodToField.utils';
import {
    generateGenericValues,
    getDepartureDateFlexibility,
    getNumberOfRooms,
    getPassengerConfig,
    I_DONT_MIND,
} from 'frontend/utils/tracking/tracking.utils';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IPrefilledSearchParams } from 'models/data/IPrefilledSearchParams';
import { ICustomParams } from 'models/data/tracking/IEventWithParams';
import {
    SearchPodEventActions,
    SearchPodEventLabels,
    SearchPodGenericValues,
} from 'models/data/tracking/SearchPodEvent';
import { DESTINATION_TYPE_DICTIONARY, DestinationType } from 'models/enum/DestinationType';
import { SearchBarDropdownFooterButton } from 'models/enum/SearchBarDropdown';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { compareRooms, getAdultsQuantity, getChildrenQuantity, getInfantsQuantity } from 'models/RoomAllocation.utils';
import { IAirport } from 'models/sitecore/IAirportsData';
import { RecentSearchesActions } from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearches/RecentSearches';

export const PREFILLED_VALUE_PLACEHOLDER = '- PP';

export class BaseTrackingSearchPodStore {
    constructor(public rootStore: TRootStore) {}

    @computed private get trackingWhenValue(): string {
        const { from, to, isMonthSearch } = this.rootStore.searchStore.searchWhen;

        return isMonthSearch
            ? formatDateL10n(from, DATE_FORMATS.fullMonthAndYear, DayjsLocale.En)
            : formatDatesRange(from, to, DATE_FORMATS.L, DATE_FORMATS.L, DayjsLocale.En);
    }

    @computed private get trackingNumberOfNights(): string {
        const { selectedNumberOfNights, monthSearchDuration, isMonthSearch } = this.rootStore.searchStore.searchWhen;
        const numberOfNights = isMonthSearch ? monthSearchDuration : selectedNumberOfNights;

        return `${numberOfNights} ${SearchPodGenericValues.NightsDuration}`;
    }

    @computed private get trackingFlexibilityValue(): string {
        const { flexDays } = this.rootStore.searchStore.searchWhen;

        return getDepartureDateFlexibility(flexDays, !!flexDays);
    }

    trackBasicWhenClickEvent = (eventLabel?: string | null, customParams?: ICustomParams): void => {
        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: SearchPodEventActions.WhenFieldClick,
                eventCategory: EventCategories.SearchPod,
                eventType: EventTypes.Interaction,
                eventLabel: eventLabel || null,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1: SearchPodGenericValues.MainWhenField,
                destinationUrl: null,
                ...customParams,
            }),
        );
    };

    trackWhenClearFieldInput = (): void => {
        const customParams = {
            genericValue2: SearchPodGenericValues.Clear,
            genericValue3: this.trackingWhenValue,
        };

        this.trackBasicWhenClickEvent(null, customParams);
    };

    trackWhenFieldTabClick = (): void => {
        const eventLabel = this.rootStore.searchStore.searchWhen.isMonthSearch
            ? SearchPodEventLabels.MonthSelection
            : SearchPodEventLabels.DateSelection;

        this.trackBasicWhenClickEvent(eventLabel);
    };

    trackWhenFlexibilityChange = (): void => {
        const eventLabel = this.rootStore.searchStore.searchWhen.isMonthSearch
            ? SearchPodEventLabels.MonthPickerOverlay
            : SearchPodEventLabels.DatePickerOverlay;

        const customParams = {
            genericValue2: SearchPodGenericValues.FlexibilityPills,
            genericValue4: this.trackingFlexibilityValue,
        };

        this.trackBasicWhenClickEvent(eventLabel, customParams);
    };

    trackWhenDropdownSelection = (): void => {
        const { isMonthSearch, isCheapestMonthSelected } = this.rootStore.searchStore.searchWhen;

        const eventLabel = isMonthSearch
            ? SearchPodEventLabels.MonthPickerOverlay
            : SearchPodEventLabels.DatePickerOverlay;

        const cheapestMonthValue = isCheapestMonthSelected ? SearchPodGenericValues.CheapestMonth : null;

        const customParams = {
            genericValue2: this.trackingWhenValue,
            genericValue3: this.trackingNumberOfNights,
            genericValue4: isMonthSearch ? cheapestMonthValue : this.trackingFlexibilityValue,
        };

        this.trackBasicWhenClickEvent(eventLabel, customParams);
    };

    trackWhenFooterButtonsClick = (cta: SearchBarDropdownFooterButton): void => {
        const { isMonthSearch } = this.rootStore.searchStore.searchWhen;

        let eventLabel: SearchPodEventLabels;
        switch (cta) {
            case SearchBarDropdownFooterButton.Clear:
                eventLabel = isMonthSearch
                    ? SearchPodEventLabels.MonthPickerOverlayClear
                    : SearchPodEventLabels.DatePickerOverlayClear;
                break;

            case SearchBarDropdownFooterButton.Close:
                eventLabel = isMonthSearch
                    ? SearchPodEventLabels.MonthPickerOverlayClose
                    : SearchPodEventLabels.DatePickerOverlayClose;
                break;

            case SearchBarDropdownFooterButton.Apply:
                eventLabel = isMonthSearch
                    ? SearchPodEventLabels.MonthPickerOverlayApply
                    : SearchPodEventLabels.DatePickerOverlayApply;
                break;
        }

        const customParams = {
            genericValue1: this.trackingFlexibilityValue,
            genericValue2: this.trackingWhenValue || null,
            genericValue3: this.trackingNumberOfNights,
        };

        this.trackBasicWhenClickEvent(eventLabel, customParams);
    };

    trackSearchPodMounting = (): void => {
        const { searchWho, searchWhen, searchFrom, searchTo } = this.rootStore.searchStore;
        const { roomsAllocation } = searchWho;

        const adults = getAdultsQuantity(roomsAllocation);
        const children = getChildrenQuantity(roomsAllocation);
        const infants = getInfantsQuantity(roomsAllocation);

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: EventActions.Impression,
                eventLabel: null,
                eventType: EventTypes.NonInteraction,
                eventValue: null,
            },
            generateGenericValues({
                destinationUrl: null,
                genericValue1: searchFrom.fullDisplayValue
                    ? `${searchFrom.fullDisplayValue} ${PREFILLED_VALUE_PLACEHOLDER}`
                    : null,
                genericValue2: searchTo.fullDisplayValue
                    ? `${searchTo.fullDisplayValue} ${PREFILLED_VALUE_PLACEHOLDER}`
                    : null,
                genericValue3: searchWhen.from ? `${this.trackingWhenValue} ${PREFILLED_VALUE_PLACEHOLDER}` : null,
                genericValue4: `${getPassengerConfig(adults, children, infants)} ${PREFILLED_VALUE_PLACEHOLDER}`,
            }),
        );
    };

    trackSearchPodFromSuggestionClick = (airportsData: IDestinationCountry, typedValue: string): void => {
        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: SearchPodEventActions.FromFieldClick,
                eventLabel: SearchPodEventLabels.SearchSuggestionDropdown,
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1: SearchPodGenericValues.MainFromField,
                genericValue2: airportsData.name,
                genericValue3: typedValue,
                destinationUrl: null,
            }),
        );
    };

    trackFromRegionSelectAll = (
        group: IAirport,
        selectedAirportNames: string[],
        origins: string[],
        isSelected: boolean,
    ): void => {
        const { isDisabledItem } = this.rootStore.searchStore.searchFrom;
        const airports = group.airports || [];

        const currentlySelectedAirports = isSelected
            ? selectedAirportNames
            : airports
                  .filter(airport => origins.includes(airport.code) && !isDisabledItem(airport))
                  .map(airport => airport.itemName ?? '');

        // Build all airports list including disabled ones marked as "(unavailable)"
        const disabledAirports = airports
            .filter(airport => isDisabledItem(airport))
            .map(airport => formatAirportName(airport, isDisabledItem));

        const allAirports = [...currentlySelectedAirports, ...disabledAirports];

        const displayGroupName = getDisplayGroupName(group.name, airports);

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: SearchPodEventActions.FromFieldClick,
                eventLabel: SearchPodEventLabels.DepartureOverlay,
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1: isSelected
                    ? SearchPodGenericValues.DepartureRegionSelectAll
                    : SearchPodGenericValues.DepartureRegionDeselectAll,
                genericValue2: displayGroupName,
                genericValue3: allAirports.join('|'),
                genericValue4: currentlySelectedAirports.join('|'),
                destinationUrl: null,
            }),
        );
    };

    trackFromRegionSelectSingle = (group: IAirport, selectedAirportCode: string, isSelected: boolean): void => {
        const { searchFrom } = this.rootStore.searchStore;
        const isDisabledItem = searchFrom.isDisabledItem;
        const airports = group.airports || [group];

        const selectedAirport = airports.find(airport => airport.code === selectedAirportCode);

        if (!selectedAirport) {
            return;
        }

        // Build all airports list including disabled ones marked as "(unavailable)"
        const allAirports = airports.map(airport => formatAirportName(airport, isDisabledItem));

        const displayGroupName = getDisplayGroupName(group.name, airports);

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: SearchPodEventActions.FromFieldClick,
                eventLabel: SearchPodEventLabels.DepartureOverlay,
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1: isSelected
                    ? SearchPodGenericValues.DepartureRegionSelectSingle
                    : SearchPodGenericValues.DepartureRegionDeselectSingle,
                genericValue2: displayGroupName,
                genericValue3: allAirports.join('|'),
                genericValue4: selectedAirport.name,
                destinationUrl: null,
            }),
        );
    };

    trackFromFooterButtonsClick = (cta: SearchBarDropdownFooterButton): void => {
        const { searchFrom } = this.rootStore.searchStore;

        const selectedOrigins = searchFrom.origins || [];
        const countries = searchFrom.countries || [];
        const isDisabledItem = searchFrom.isDisabledItem;
        // Build departure titles
        const { titles: departureTitles } = buildDepartureTitles(countries, selectedOrigins, isDisabledItem);

        // Determine genericValue1 based on actual selection type
        const { hasGroupSelections, hasIndividualSelections } = determineSelectionType(
            countries,
            selectedOrigins,
            isDisabledItem,
        );

        let genericValue1: string;

        if (hasGroupSelections && hasIndividualSelections) {
            genericValue1 = SearchPodGenericValues.DepartureRegionAllSingle;
        } else if (hasGroupSelections) {
            genericValue1 = SearchPodGenericValues.DepartureRegionAll;
        } else {
            genericValue1 = SearchPodGenericValues.DepartureRegionSingle;
        }

        const genericValue2 = departureTitles.join('|');

        // Always use the comprehensive airport list logic to include unavailable airports from selected groups
        const multiDepartureList = buildMultiDepartureAirportsList(countries, selectedOrigins, isDisabledItem);

        // Always use comprehensive list for genericValue3 to include unavailable airports from selected groups
        // Use actual selected airports for genericValue4
        const genericValue3 = multiDepartureList;
        const genericValue4 = buildSelectedAirportsList(countries, selectedOrigins);

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: SearchPodEventActions.FromFieldClick,
                eventLabel: `${SearchPodEventLabels.DepartureOverlay} - ${cta}` as SearchPodEventLabels,
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1,
                genericValue2,
                genericValue3,
                genericValue4,
                destinationUrl: null,
            }),
        );
    };

    trackSearchPodToSuggestionClick = (destinationData: IDestinationCountry, typedValue: string): void => {
        let genericValue4: string | null = null;

        if (destinationData.type !== DestinationType.Anywhere) {
            const destinationType = this.rootStore.layoutStore.getPhrase(
                DESTINATION_TYPE_DICTIONARY[destinationData.type || ''],
            );
            const parentsNames = destinationData.parents?.map(item => item.name).join(', ') || null;
            genericValue4 = parentsNames ? `${destinationType} - ${parentsNames}` : destinationType;
        }

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: SearchPodEventActions.ToFieldClick,
                eventLabel: SearchPodEventLabels.SearchSuggestionDropdown,
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1: SearchPodGenericValues.MainToField,
                genericValue2: destinationData.name,
                genericValue3: typedValue,
                genericValue4,
                destinationUrl: null,
            }),
        );
    };

    trackToRegionSelectAll = (parent: IDestinationCountry, isSelected: boolean): void => {
        const { isDisabledItem } = this.rootStore.searchStore.searchTo;
        const children = parent.children || [];

        const currentlySelectedDestinations = children
            .filter(child => !isDisabledItem(child))
            .map(child => child.itemName || child.name);

        const allDestinations = children.map(child => {
            const childName = child.itemName || child.name;

            return isDisabledItem(child) ? `${childName}(unavailable)` : childName;
        });

        const displayGroupName = parent.itemName || parent.name;

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: SearchPodEventActions.ToFieldClick,
                eventLabel: SearchPodEventLabels.DestinationOverlay,
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1: isSelected
                    ? SearchPodGenericValues.DestinationRegionSelectAll
                    : SearchPodGenericValues.DestinationRegionDeselectAll,
                genericValue2: displayGroupName,
                genericValue3: allDestinations.join('|'),
                genericValue4: currentlySelectedDestinations.join('|'),
                destinationUrl: null,
            }),
        );
    };

    trackToRegionSelectSingle = (
        parent: IDestinationCountry,
        selectedAirportCode: string,
        isSelected: boolean,
    ): void => {
        const selectedDestination = parent.children?.find(child => child.code === selectedAirportCode);
        const genericValue3 = parent.children?.map(child => {
            const { isDisabledItem } = this.rootStore.searchStore.searchTo;

            return formatDestinationName(child, isDisabledItem);
        });

        if (!selectedDestination) {
            return;
        }

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: SearchPodEventActions.ToFieldClick,
                eventLabel: SearchPodEventLabels.DestinationOverlay,
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1: isSelected
                    ? SearchPodGenericValues.DestinationRegionSelectSingle
                    : SearchPodGenericValues.DestinationRegionDeselectSingle,
                genericValue2: parent.itemName,
                genericValue3: genericValue3?.join('|') || '',
                genericValue4: selectedDestination.itemName,
                destinationUrl: null,
            }),
        );
    };

    trackToAnywhereSelect = (): void => {
        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: SearchPodEventActions.ToFieldClick,
                eventLabel: SearchPodEventLabels.DestinationOverlay,
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1: SearchPodGenericValues.DestinationRegion,
                genericValue2: SearchPodGenericValues.DestinationRegionAnywhere,
                genericValue3: null,
                genericValue4: null,
                destinationUrl: null,
            }),
        );
    };

    trackToRegionToggle = (parent: IDestinationCountry): void => {
        const parentName = parent.itemName || parent.name;
        const childrenNames = parent.children?.map(child => child.itemName || child.name).join('|') || '';

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: SearchPodEventActions.ToFieldClick,
                eventLabel: SearchPodEventLabels.DestinationOverlay,
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1: SearchPodGenericValues.DestinationClick,
                genericValue2: parentName,
                genericValue3: childrenNames,
                destinationUrl: null,
            }),
        );
    };

    trackToFooterButtonsClick = (cta: SearchBarDropdownFooterButton): void => {
        const { searchTo } = this.rootStore.searchStore;
        const selectedDestinations = searchTo.selectedDestinations || [];
        const countriesWithRegions = searchTo.countriesWithRegions || [];
        const isDisabledItem = searchTo.isDisabledItem;

        const { destinationTitles, allRegionsList, selectedRegionsList } = buildFooterTrackingData(
            selectedDestinations,
            countriesWithRegions,
            isDisabledItem,
        );

        const genericValue1 = determineDestinationSelectionType(selectedDestinations);
        const genericValue2 = destinationTitles.join('|');
        const genericValue3 = allRegionsList.join('|');
        const genericValue4 = selectedRegionsList.join('|');

        const eventLabelMap: Record<SearchBarDropdownFooterButton, SearchPodEventLabels> = {
            [SearchBarDropdownFooterButton.Clear]: SearchPodEventLabels.DestinationOverlayClear,
            [SearchBarDropdownFooterButton.Close]: SearchPodEventLabels.DestinationOverlayClose,
            [SearchBarDropdownFooterButton.Apply]: SearchPodEventLabels.DestinationOverlayApply,
        };

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: SearchPodEventActions.ToFieldClick,
                eventLabel: eventLabelMap[cta],
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1,
                genericValue2,
                genericValue3,
                genericValue4,
                destinationUrl: null,
            }),
        );
    };

    trackToClearClick = (isMobile: boolean, valueFromStore: string, desktopValue: string): void => {
        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: SearchPodEventActions.ToFieldClick,
                eventCategory: EventCategories.SearchPod,
                eventType: EventTypes.Interaction,
                eventValue: null,
                eventLabel: null,
            },
            generateGenericValues({
                genericValue1: SearchPodGenericValues.MainToField,
                genericValue2: SearchPodGenericValues.Clear,
                genericValue3: isMobile ? valueFromStore : desktopValue,
                destinationUrl: null,
            }),
        );
    };

    trackToInputClick = (isTextIncludeLink: boolean): void => {
        const genericValue2 = isTextIncludeLink
            ? SearchPodGenericValues.DestinationRegionAnywhereQuiz
            : SearchPodGenericValues.DestinationRegionAnywhere;

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: SearchPodEventActions.ToFieldClick,
                eventCategory: EventCategories.SearchPod,
                eventType: EventTypes.Interaction,
                eventValue: null,
                eventLabel: null,
            },
            generateGenericValues({
                genericValue1: SearchPodGenericValues.MainToField,
                genericValue2,
                destinationUrl: null,
            }),
        );
    };

    trackToBurgerMenuClick = (): void => {
        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: SearchPodEventActions.ToFieldClick,
                eventCategory: EventCategories.SearchPod,
                eventType: EventTypes.Interaction,
                eventLabel: SearchPodEventLabels.BurgerMenu,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1: SearchPodGenericValues.MainToField,
                destinationUrl: null,
            }),
        );
    };

    @computed private get trackingPassengerConfig(): string {
        const { adultsQuantity, childrenQuantity, infantsQuantity } = this.rootStore.searchStore.searchWho;

        return getPassengerConfig(adultsQuantity, childrenQuantity, infantsQuantity);
    }

    @computed private get trackingNumberOfRooms(): string {
        const { roomsAllocationLength, isAutoAllocation } = this.rootStore.searchStore.searchWho;

        return getNumberOfRooms(isAutoAllocation, roomsAllocationLength);
    }

    private readonly trackBasicWhoClickEvent = (eventLabel?: string | null, customParams?: ICustomParams): void => {
        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: SearchPodEventActions.WhoFieldClick,
                eventCategory: EventCategories.SearchPod,
                eventType: EventTypes.Interaction,
                eventLabel: eventLabel || null,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1: SearchPodGenericValues.MainWhoField,
                destinationUrl: null,
                ...customParams,
            }),
        );
    };

    trackWhoInputClick = (): void => {
        const customParams = {
            genericValue2: `${this.trackingNumberOfRooms} ${PREFILLED_VALUE_PLACEHOLDER}`,
            genericValue4: `${this.trackingPassengerConfig} ${PREFILLED_VALUE_PLACEHOLDER}`,
        };

        this.trackBasicWhoClickEvent(null, customParams);
    };

    trackWhoDropdownRoomSelectorInteraction = (open: boolean): void => {
        const customParams = {
            genericValue2: this.trackingNumberOfRooms,
            genericValue3: open ? SearchPodGenericValues.RoomsDropdownOpen : SearchPodGenericValues.RoomsDropdownClosed,
            genericValue4: this.trackingPassengerConfig,
        };

        this.trackBasicWhoClickEvent(SearchPodEventLabels.PassengerOverlay, customParams);
    };

    trackWhoDropdownRoomSelection = (value: number): void => {
        const customParams = {
            genericValue2: value === AUTO_ALLOCATION_SITECORE_VALUE ? I_DONT_MIND : `${value}`,
            genericValue3: SearchPodGenericValues.NumberOfRoomsSelect,
        };

        this.trackBasicWhoClickEvent(SearchPodEventLabels.PassengerOverlay, customParams);
    };

    trackWhoFooterButtonsClick = (cta: SearchBarDropdownFooterButton): void => {
        let eventLabel: SearchPodEventLabels;
        switch (cta) {
            case SearchBarDropdownFooterButton.Apply:
                eventLabel = SearchPodEventLabels.PassengerOverlayApply;
                break;

            case SearchBarDropdownFooterButton.Close:
                eventLabel = SearchPodEventLabels.PassengerOverlayClose;
                break;

            case SearchBarDropdownFooterButton.Clear:
                eventLabel = SearchPodEventLabels.PassengerOverlayReset;
                break;
        }

        const customParams = {
            genericValue2: this.trackingNumberOfRooms,
            genericValue4: this.trackingPassengerConfig,
        };

        this.trackBasicWhoClickEvent(eventLabel, customParams);
    };

    trackSearchButtonClick = (): void => {
        const { searchFrom, searchTo, searchWhen, searchWho } = this.rootStore.searchStore;

        const { origins, airports } = searchFrom;
        const { selectedDestinationCodes, selectedDestinations } = searchTo;

        const prefilledSearch = this.rootStore.hotelsStore.getSearchParamsFromLocalStorage();
        const { departure, dest } = prefilledSearch || {};

        const isFromPrePopulated = !!departure && !!origins && haveSameElements(departure.split(','), [...origins]);
        const isToPrePopulated = !!dest && haveSameElements(dest.split(','), [...selectedDestinationCodes]);
        const isWhenPrePopulated = isWhenFieldPrePopulated(
            prefilledSearch,
            searchWhen.from,
            searchWhen.selectedNumberOfNights,
            searchWhen.flexDays,
            searchWhen.isMonthSearch,
        );
        const isWhoPrePopulated = compareRooms(searchWho.roomsAllocation, prefilledSearch?.rooms);

        const fromValue = getAirportsItemNamesByCodes(origins || [], airports).join(', ');
        const trackedFromValue = buildTrackingValue(isFromPrePopulated, fromValue, PREFILLED_VALUE_PLACEHOLDER);

        const toValue = getDestinationsItemNameGroupedByParent(selectedDestinations);
        const trackedToValue = buildTrackingValue(isToPrePopulated, toValue, PREFILLED_VALUE_PLACEHOLDER);

        const whenValue = `${this.trackingWhenValue} | ${this.trackingFlexibilityValue}${
            searchWhen.isCheapestMonthSelected ? ` | ${SearchPodGenericValues.CheapestMonth}` : ''
        }`;
        const trackedWhenValue = buildTrackingValue(isWhenPrePopulated, whenValue, PREFILLED_VALUE_PLACEHOLDER);

        const whoValue = `${this.trackingPassengerConfig} | Rooms: ${this.trackingNumberOfRooms}`;
        const trackedWhoValue = buildTrackingValue(isWhoPrePopulated, whoValue, PREFILLED_VALUE_PLACEHOLDER);

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: SearchPodEventActions.SearchButtonClick,
                eventLabel: null,
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            generateGenericValues({
                genericValue1: trackedFromValue,
                genericValue2: trackedToValue,
                genericValue3: trackedWhenValue,
                genericValue4: trackedWhoValue,
                destinationUrl: null,
            }),
        );
    };

    trackRecentSearches = (type: RecentSearchesActions, recentSearches: IPrefilledSearchParams[]): void => {
        const { trackEventWithParams } = this.rootStore.trackingStore;
        const destinations = this.rootStore.searchStore.searchTo.destinationsWithNames;
        const airports = this.rootStore.searchStore.searchFrom.airports;

        const { directions, dates, people } = recentSearches.reduce(
            (acc, search) => {
                const { direction, date, who } = getResentSearchTrackingData(search, destinations, airports);

                return {
                    directions: acc.directions ? `${acc.directions} | ${direction}` : direction,
                    dates: acc.dates ? `${acc.dates} | ${date}` : date,
                    people: acc.people ? `${acc.people} | ${who}` : who,
                };
            },
            { directions: '', dates: '', people: '' },
        );

        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: EventActions.RecentSearch,
                eventLabel: type,
                eventType: EventTypes.Interaction,
            },
            {
                destinationUrl: null,
                genericValue1: `${recentSearches.length} Recent Search`,
                genericValue2: directions,
                genericValue3: dates,
                genericValue4: people,
            },
        );
    };

    trackStartNewSearch = (): void => {
        const { trackEventWithParams } = this.rootStore.trackingStore;
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SearchPod,
                eventAction: EventActions.StartNewSearch,
                eventLabel: null,
                eventType: EventTypes.NonInteraction,
            },
            {
                destinationUrl: null,
                genericValue1: null,
                genericValue2: null,
                genericValue3: null,
                genericValue4: `${this.trackingPassengerConfig} ${PREFILLED_VALUE_PLACEHOLDER}`,
            },
        );
    };
}
