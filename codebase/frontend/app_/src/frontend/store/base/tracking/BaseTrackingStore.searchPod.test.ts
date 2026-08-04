import { createMockStores } from 'frontend/__mocks__';
import { formatDestinationName } from 'frontend/utils/tracking/searchPodToField.utils';
import { I_DONT_MIND, NO_FLEXIBILITY } from 'frontend/utils/tracking/tracking.utils';
import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import {
    SearchPodEventActions,
    SearchPodEventLabels,
    SearchPodGenericValues,
} from 'models/data/tracking/SearchPodEvent';
import { SearchBarDropdownFooterButton } from 'models/enum/SearchBarDropdown';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { RecentSearchesActions } from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearches/RecentSearches';

import { BaseTrackingSearchPodStore, PREFILLED_VALUE_PLACEHOLDER } from './BaseTrackingStore.searchPod';

const mockGetPassengerConfig = 'A: 2, C: 1, I: 1';
const mockBuildDepartureTitles = jest.fn();
const mockBuildMultiDepartureAirportsList = jest.fn();
const mockBuildSelectedAirportsList = jest.fn();
const mockDetermineSelectionType = jest.fn();
const mockGetDisplayGroupName = jest.fn();
const mockBuildDestinationRegionLists = jest.fn();
const mockBuildFooterTrackingData = jest.fn();
const mockDetermineDestinationSelectionType = jest.fn();
const mockFormatDestinationName = jest.fn();

const mockGetNumberOfRooms = 3;
jest.mock('frontend/utils/tracking/tracking.utils', () => ({
    ...jest.requireActual('frontend/utils/tracking/tracking.utils'),
    getPassengerConfig: jest.fn(() => mockGetPassengerConfig),
    getNumberOfRooms: jest.fn(() => mockGetNumberOfRooms),
}));

let mockIsWhenFieldPrePopulated = true;
jest.mock('frontend/utils/tracking/searchPod.utils', () => ({
    ...jest.requireActual('frontend/utils/tracking/searchPod.utils'),
    isWhenFieldPrePopulated: jest.fn(() => mockIsWhenFieldPrePopulated),
}));

jest.mock('frontend/utils/destinations.utils', () => ({
    getDestinationsItemNameGroupedByParent: jest.fn(() => 'Majorca | Region - Spain'),
}));

let mockCompareRooms = true;
jest.mock('models/RoomAllocation.utils', () => ({
    ...jest.requireActual('models/RoomAllocation.utils'),
    compareRooms: jest.fn(() => mockCompareRooms),
}));

jest.mock('frontend/utils/search/search.utils', () => ({
    ...jest.requireActual('frontend/utils/search/search.utils'),
    getResentSearchTrackingData: jest.fn(() => ({
        direction: 'Gatwick, Luton - Turkey, Spain',
        date: '2025-05-01, 7 Nights',
        who: '3 Adult, 1 Child, 1 Infant',
    })),
    getAirportsItemNamesByCodes: jest.fn().mockReturnValue(['Gatwick', 'Luton']),
}));

jest.mock('frontend/utils/tracking/searchPodToField.utils', () => ({
    ...jest.requireActual('frontend/utils/tracking/searchPodToField.utils'),
    buildDestinationRegionLists: jest.fn((...args) => mockBuildDestinationRegionLists(...args)),
    buildFooterTrackingData: jest.fn((...args) => mockBuildFooterTrackingData(...args)),
    determineDestinationSelectionType: jest.fn((...args) => mockDetermineDestinationSelectionType(...args)),
    formatDestinationName: jest.fn((...args) => mockFormatDestinationName(...args)),
}));

jest.mock('frontend/utils/tracking/searchPodFromField.utils', () => ({
    buildDepartureTitles: jest.fn((...args) => mockBuildDepartureTitles(...args)),
    buildMultiDepartureAirportsList: jest.fn((...args) => mockBuildMultiDepartureAirportsList(...args)),
    buildSelectedAirportsList: jest.fn((...args) => mockBuildSelectedAirportsList(...args)),
    determineSelectionType: jest.fn((...args) => mockDetermineSelectionType(...args)),
    formatAirportName: jest.fn((airport, isDisabledItem) => {
        const name = airport.itemName || '';

        return isDisabledItem(airport) ? `${name} (unavailable)` : name;
    }),
    getDisplayGroupName: jest.fn((...args) => mockGetDisplayGroupName(...args)),
}));

describe('BaseTrackingSearchPodStore', () => {
    let mockRootStore;
    let baseTrackingSearchPodStore: BaseTrackingSearchPodStore;

    const mockedMonthWhenValue = 'May 2025';
    const mockedDateRangeWhenValue = '01/05/2025 - 08/05/2025';
    const mockedNightsValue = '7 Nights';

    beforeEach(() => {
        mockRootStore = createMockStores({
            trackingStore: {
                buildCoreParamsObject: jest.fn(() => ({
                    coreParams: 'coreParams',
                })),
                addToDataLayer: jest.fn(),
                trackEventWithParams: jest.fn(),
            },
            hotelsStore: {
                getSearchParamsFromLocalStorage: jest.fn(() => null),
            },
            searchStore: {
                searchWhen: {
                    monthSearchDuration: 7,
                    isMonthSearch: true,
                    from: new Date('2025-05-01'),
                    to: new Date('2025-05-08'),
                    selectedNumberOfNights: 7,
                    flexDays: 0,
                    isChosenDateInCheapestMonth: false,
                },
                searchFrom: {
                    displayValue: {
                        main: 'London',
                        add: '+1',
                    },
                    fullDisplayValue: 'London +1',
                    origins: ['LGW', 'LTN'],
                    countries: [],
                    airports: new Map(),
                    isDisabledItem: jest.fn(() => false),
                },
                searchTo: {
                    displayValue: {
                        main: 'Amsterdam',
                        add: 'Region - Netherlands',
                    },
                    fullDisplayValue: 'Amsterdam | Region - Netherlands',
                    selectedDestinations: [],
                    isDisabledItem: jest.fn(() => false),
                    selectedDestinationCodes: ['ITLG'],
                },
                searchWho: {
                    roomsAllocation: [
                        {
                            adults: [{}, {}],
                            children: [{}],
                            infants: [{}],
                            roomCode: 'QWER',
                        },
                    ],
                    adultsQuantity: 2,
                    childrenQuantity: 1,
                    infantsQuantity: 1,
                    roomsAllocationLength: 1,
                    isAutoAllocation: false,
                },
            },
        });

        baseTrackingSearchPodStore = new BaseTrackingSearchPodStore(mockRootStore);
    });

    describe('trackBasicWhenClickEvent', () => {
        it('should call trackEventWithParams with passed eventLabel and custom params', () => {
            const mockedCustomParams = {
                genericValue2: 'genericValue2',
            };
            baseTrackingSearchPodStore.trackBasicWhenClickEvent('eventLabel', mockedCustomParams);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.WhenFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventLabel: 'eventLabel',
                    eventValue: null,
                },
                {
                    genericValue1: SearchPodGenericValues.MainWhenField,
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: null,
                    ...mockedCustomParams,
                },
            );
        });

        it('should call trackEventWithParams with null eventLabel when eventLabel not passed', () => {
            baseTrackingSearchPodStore.trackBasicWhenClickEvent();

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.WhenFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventLabel: null,
                    eventValue: null,
                },
                {
                    genericValue1: SearchPodGenericValues.MainWhenField,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: null,
                },
            );
        });
    });

    describe('trackWhenClearFieldInput', () => {
        let trackBasicWhenClickEventSpy;

        beforeEach(() => {
            trackBasicWhenClickEventSpy = jest.spyOn(baseTrackingSearchPodStore, 'trackBasicWhenClickEvent');
        });

        it('should call trackBasicWhenClickEvent when clicking on the clear input icon', () => {
            baseTrackingSearchPodStore.trackWhenClearFieldInput();

            expect(trackBasicWhenClickEventSpy).toHaveBeenCalledWith(null, {
                genericValue2: SearchPodGenericValues.Clear,
                genericValue3: mockedMonthWhenValue,
            });
        });
    });

    describe('trackWhenFieldTabClick', () => {
        let trackBasicWhenClickEventSpy;

        beforeEach(() => {
            trackBasicWhenClickEventSpy = jest.spyOn(baseTrackingSearchPodStore, 'trackBasicWhenClickEvent');
        });

        it('should call trackBasicWhenClickEvent when clicking on the Month Selection tab', () => {
            mockRootStore.searchStore.searchWhen.isMonthSearch = true;
            baseTrackingSearchPodStore.trackWhenFieldTabClick();

            expect(trackBasicWhenClickEventSpy).toHaveBeenCalledWith(SearchPodEventLabels.MonthSelection);
        });

        it('should call trackBasicWhenClickEvent when clicking on the Date Selection tab', () => {
            mockRootStore.searchStore.searchWhen.isMonthSearch = false;
            baseTrackingSearchPodStore.trackWhenFieldTabClick();

            expect(trackBasicWhenClickEventSpy).toHaveBeenCalledWith(SearchPodEventLabels.DateSelection);
        });
    });

    describe('trackWhenFlexibilityChange', () => {
        let trackBasicWhenClickEventSpy;

        beforeEach(() => {
            trackBasicWhenClickEventSpy = jest.spyOn(baseTrackingSearchPodStore, 'trackBasicWhenClickEvent');
        });

        it('should call trackBasicWhenClickEvent with correctly formatted values for Month picker', () => {
            baseTrackingSearchPodStore.trackWhenFlexibilityChange();

            expect(trackBasicWhenClickEventSpy).toHaveBeenCalledWith(SearchPodEventLabels.MonthPickerOverlay, {
                genericValue2: SearchPodGenericValues.FlexibilityPills,
                genericValue4: NO_FLEXIBILITY,
            });
        });

        it('should call trackBasicWhenClickEvent with correctly formatted values for Date picker', () => {
            mockRootStore.searchStore.searchWhen.isMonthSearch = false;
            baseTrackingSearchPodStore.trackWhenFlexibilityChange();

            expect(trackBasicWhenClickEventSpy).toHaveBeenCalledWith(SearchPodEventLabels.DatePickerOverlay, {
                genericValue2: SearchPodGenericValues.FlexibilityPills,
                genericValue4: NO_FLEXIBILITY,
            });
        });
    });

    describe('trackWhenDropdownSelection', () => {
        let trackBasicWhenClickEventSpy;

        beforeEach(() => {
            trackBasicWhenClickEventSpy = jest.spyOn(baseTrackingSearchPodStore, 'trackBasicWhenClickEvent');
        });

        it('should call trackBasicWhenClickEvent with correctly formatted values for Month picker', () => {
            baseTrackingSearchPodStore.trackWhenDropdownSelection();

            expect(trackBasicWhenClickEventSpy).toHaveBeenCalledWith(SearchPodEventLabels.MonthPickerOverlay, {
                genericValue2: mockedMonthWhenValue,
                genericValue3: mockedNightsValue,
                genericValue4: null,
            });
        });

        it('should call trackBasicWhenClickEvent with correctly formatted values for Date picker', () => {
            mockRootStore.searchStore.searchWhen.isMonthSearch = false;
            baseTrackingSearchPodStore.trackWhenDropdownSelection();

            expect(trackBasicWhenClickEventSpy).toHaveBeenCalledWith(SearchPodEventLabels.DatePickerOverlay, {
                genericValue2: mockedDateRangeWhenValue,
                genericValue3: mockedNightsValue,
                genericValue4: NO_FLEXIBILITY,
            });
        });

        it('should call trackBasicWhenClickEvent with cheapest month', () => {
            mockRootStore.searchStore.searchWhen.isCheapestMonthSelected = true;

            baseTrackingSearchPodStore.trackWhenDropdownSelection();

            expect(trackBasicWhenClickEventSpy).toHaveBeenCalledWith(SearchPodEventLabels.MonthPickerOverlay, {
                genericValue2: mockedMonthWhenValue,
                genericValue3: mockedNightsValue,
                genericValue4: SearchPodGenericValues.CheapestMonth,
            });
        });
    });

    describe('trackWhenFooterButtonsClick', () => {
        it('should call trackEventWithParams with correctly formatted values for Month picker', () => {
            baseTrackingSearchPodStore.trackWhenFooterButtonsClick(SearchBarDropdownFooterButton.Apply);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.WhenFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                    eventLabel: SearchPodEventLabels.MonthPickerOverlayApply,
                },
                {
                    destinationUrl: null,
                    genericValue1: NO_FLEXIBILITY,
                    genericValue2: mockedMonthWhenValue,
                    genericValue3: mockedNightsValue,
                    genericValue4: null,
                },
            );
        });

        it('should call trackEventWithParams with correctly formatted values for Date picker', () => {
            mockRootStore.searchStore.searchWhen.isMonthSearch = false;
            baseTrackingSearchPodStore.trackWhenFooterButtonsClick(SearchBarDropdownFooterButton.Clear);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.WhenFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                    eventLabel: SearchPodEventLabels.DatePickerOverlayClear,
                },
                {
                    destinationUrl: null,
                    genericValue1: NO_FLEXIBILITY,
                    genericValue2: mockedDateRangeWhenValue,
                    genericValue3: mockedNightsValue,
                    genericValue4: null,
                },
            );
        });
    });

    describe('trackSearchPodMounting', () => {
        const eventParams = {
            eventCategory: EventCategories.SearchPod,
            eventAction: EventActions.Impression,
            eventLabel: null,
            eventType: EventTypes.NonInteraction,
            eventValue: null,
        };

        it('should call trackEventWithParams with prefilled search params (month search)', () => {
            baseTrackingSearchPodStore.trackSearchPodMounting();

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                eventParams,
                {
                    destinationUrl: null,
                    genericValue1: `${mockRootStore.searchStore.searchFrom.fullDisplayValue} ${PREFILLED_VALUE_PLACEHOLDER}`,
                    genericValue2: `${mockRootStore.searchStore.searchTo.fullDisplayValue} ${PREFILLED_VALUE_PLACEHOLDER}`,
                    genericValue3: `${mockedMonthWhenValue} ${PREFILLED_VALUE_PLACEHOLDER}`,
                    genericValue4: `${mockGetPassengerConfig} ${PREFILLED_VALUE_PLACEHOLDER}`,
                },
            );
        });

        it('should call trackEventWithParams with prefilled search params (dates search)', () => {
            mockRootStore.searchStore.searchWhen.isMonthSearch = false;
            baseTrackingSearchPodStore.trackSearchPodMounting();

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                eventParams,
                {
                    destinationUrl: null,
                    genericValue1: `${mockRootStore.searchStore.searchFrom.fullDisplayValue} ${PREFILLED_VALUE_PLACEHOLDER}`,
                    genericValue2: `${mockRootStore.searchStore.searchTo.fullDisplayValue} ${PREFILLED_VALUE_PLACEHOLDER}`,
                    genericValue3: `${mockedDateRangeWhenValue} ${PREFILLED_VALUE_PLACEHOLDER}`,
                    genericValue4: `${mockGetPassengerConfig} ${PREFILLED_VALUE_PLACEHOLDER}`,
                },
            );
        });

        it('should call trackEventWithParams with nulls when search pod is not prefilled', () => {
            mockRootStore.searchStore.searchFrom.fullDisplayValue = '';
            mockRootStore.searchStore.searchTo.fullDisplayValue = '';
            mockRootStore.searchStore.searchWhen.from = null;
            mockRootStore.searchStore.searchWhen.to = null;

            baseTrackingSearchPodStore.trackSearchPodMounting();

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                eventParams,
                {
                    destinationUrl: null,
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: `${mockGetPassengerConfig} ${PREFILLED_VALUE_PLACEHOLDER}`,
                },
            );
        });
    });

    describe('trackSearchPodFromSuggestionClick', () => {
        it('should call trackEventWithParams with correct values for country suggestion', () => {
            const airportsData = {
                code: 'ES',
                name: 'Spain',
                type: 'Country' as const,
            };
            const typedValue = 'Spa';

            baseTrackingSearchPodStore.trackSearchPodFromSuggestionClick(airportsData as any, typedValue);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: SearchPodEventActions.FromFieldClick,
                    eventLabel: SearchPodEventLabels.SearchSuggestionDropdown,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                {
                    genericValue1: SearchPodGenericValues.MainFromField,
                    genericValue2: 'Spain',
                    genericValue3: 'Spa',
                    genericValue4: null,
                    destinationUrl: null,
                },
            );
        });

        it('should call trackEventWithParams with empty typed value', () => {
            const airportsData = {
                code: 'FR',
                name: 'France',
                type: 'Country' as const,
            };
            const typedValue = '';

            baseTrackingSearchPodStore.trackSearchPodFromSuggestionClick(airportsData as any, typedValue);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue2: 'France',
                    genericValue3: '',
                }),
            );
        });
    });

    describe('trackFromRegionSelectAll', () => {
        it('should call trackEventWithParams when selecting all airports in a group', () => {
            const group = {
                name: 'London',
                code: 'LON',
                airports: [
                    { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                    { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                ],
            };
            const selectedAirportNames = ['Gatwick', 'Luton'];
            const origins = [];
            const isSelected = true;

            mockGetDisplayGroupName.mockReturnValue('London (All)');

            baseTrackingSearchPodStore.trackFromRegionSelectAll(group, selectedAirportNames, origins, isSelected);

            expect(mockGetDisplayGroupName).toHaveBeenCalledWith('London', group.airports);
            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: SearchPodEventActions.FromFieldClick,
                    eventLabel: SearchPodEventLabels.DepartureOverlay,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DepartureRegionSelectAll,
                    genericValue2: 'London (All)',
                    genericValue3: 'Gatwick|Luton',
                    genericValue4: 'Gatwick|Luton',
                }),
            );
        });

        it('should call trackEventWithParams when deselecting all airports in a group', () => {
            const group = {
                name: 'London',
                code: 'LON',
                airports: [
                    { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                    { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                ],
            };
            const selectedAirportNames = [];
            const origins = ['LGW', 'LTN'];
            const isSelected = false;

            mockGetDisplayGroupName.mockReturnValue('London (All)');

            baseTrackingSearchPodStore.trackFromRegionSelectAll(group, selectedAirportNames, origins, isSelected);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DepartureRegionDeselectAll,
                    genericValue2: 'London (All)',
                    genericValue3: 'Gatwick|Luton',
                    genericValue4: 'Gatwick|Luton',
                }),
            );
        });

        it('should include disabled airports marked as unavailable', () => {
            const group = {
                name: 'London',
                code: 'LON',
                airports: [
                    { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                    { name: 'Stansted', code: 'STN', itemName: 'Stansted' },
                ],
            };
            const selectedAirportNames = ['Gatwick'];
            const origins = [];
            const isSelected = true;

            mockRootStore.searchStore.searchFrom.isDisabledItem = jest.fn(airport => airport.code === 'STN');
            mockGetDisplayGroupName.mockReturnValue('London (All)');

            baseTrackingSearchPodStore.trackFromRegionSelectAll(group, selectedAirportNames, origins, isSelected);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue3: 'Gatwick|Stansted (unavailable)',
                    genericValue4: 'Gatwick',
                }),
            );
        });
    });

    describe('trackFromRegionSelectSingle', () => {
        it('should call trackEventWithParams when selecting a single airport in a group', () => {
            const group = {
                name: 'London',
                code: 'LON',
                airports: [
                    { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                    { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                ],
            };
            const selectedAirportCode = 'LGW';
            const isSelecting = true;

            mockGetDisplayGroupName.mockReturnValue('London (All)');

            baseTrackingSearchPodStore.trackFromRegionSelectSingle(group, selectedAirportCode, isSelecting);

            expect(mockGetDisplayGroupName).toHaveBeenCalledWith('London', group.airports);
            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: SearchPodEventActions.FromFieldClick,
                    eventLabel: SearchPodEventLabels.DepartureOverlay,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DepartureRegionSelectSingle,
                    genericValue2: 'London (All)',
                    genericValue3: 'Gatwick|Luton',
                    genericValue4: 'Gatwick',
                }),
            );
        });

        it('should call trackEventWithParams when deselecting a single airport', () => {
            const group = {
                name: 'London',
                code: 'LON',
                airports: [
                    { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                    { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                ],
            };
            const selectedAirportCode = 'LGW';
            const isSelecting = false;

            mockGetDisplayGroupName.mockReturnValue('London (All)');

            baseTrackingSearchPodStore.trackFromRegionSelectSingle(group, selectedAirportCode, isSelecting);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DepartureRegionDeselectSingle,
                    genericValue4: 'Gatwick',
                }),
            );
        });

        it('should handle standalone airport (no group.airports)', () => {
            const group = {
                name: 'Manchester',
                code: 'MAN',
                itemName: 'Manchester',
            };
            const selectedAirportCode = 'MAN';
            const isSelecting = true;

            mockGetDisplayGroupName.mockReturnValue('Manchester');

            baseTrackingSearchPodStore.trackFromRegionSelectSingle(group, selectedAirportCode, isSelecting);

            expect(mockGetDisplayGroupName).toHaveBeenCalledWith('Manchester', [group]);
            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue2: 'Manchester',
                    genericValue4: 'Manchester',
                }),
            );
        });

        it('should include disabled airports marked as unavailable', () => {
            const group = {
                name: 'London',
                code: 'LON',
                airports: [
                    { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                    { name: 'Stansted', code: 'STN', itemName: 'Stansted' },
                ],
            };
            const selectedAirportCode = 'LGW';
            const isSelecting = true;

            mockRootStore.searchStore.searchFrom.isDisabledItem = jest.fn(airport => airport.code === 'STN');
            mockGetDisplayGroupName.mockReturnValue('London (All)');

            baseTrackingSearchPodStore.trackFromRegionSelectSingle(group, selectedAirportCode, isSelecting);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue3: 'Gatwick|Stansted (unavailable)',
                }),
            );
        });

        it('should not track if selected airport is not found', () => {
            const group = {
                name: 'London',
                code: 'LON',
                airports: [{ name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' }],
            };
            const selectedAirportCode = 'INVALID';
            const isSelecting = true;

            baseTrackingSearchPodStore.trackFromRegionSelectSingle(group, selectedAirportCode, isSelecting);

            expect(mockRootStore.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
        });
    });

    describe('trackFromFooterButtonsClick', () => {
        beforeEach(() => {
            mockRootStore.searchStore.searchFrom.countries = [
                {
                    name: 'London',
                    code: 'LON',
                    airports: [
                        { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                        { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                    ],
                },
            ];
            mockBuildDepartureTitles.mockReturnValue({ titles: ['London (All)'] });
            mockBuildMultiDepartureAirportsList.mockReturnValue('Gatwick|Luton');
            mockBuildSelectedAirportsList.mockReturnValue('Gatwick|Luton');
        });

        it('should call trackEventWithParams for Apply button with group selection', () => {
            mockDetermineSelectionType.mockReturnValue({
                hasGroupSelections: true,
                hasIndividualSelections: false,
            });

            baseTrackingSearchPodStore.trackFromFooterButtonsClick(SearchBarDropdownFooterButton.Apply);

            expect(mockBuildDepartureTitles).toHaveBeenCalledWith(
                mockRootStore.searchStore.searchFrom.countries,
                mockRootStore.searchStore.searchFrom.origins,
                mockRootStore.searchStore.searchFrom.isDisabledItem,
            );
            expect(mockDetermineSelectionType).toHaveBeenCalledWith(
                mockRootStore.searchStore.searchFrom.countries,
                mockRootStore.searchStore.searchFrom.origins,
                mockRootStore.searchStore.searchFrom.isDisabledItem,
            );
            expect(mockBuildMultiDepartureAirportsList).toHaveBeenCalledWith(
                mockRootStore.searchStore.searchFrom.countries,
                mockRootStore.searchStore.searchFrom.origins,
                mockRootStore.searchStore.searchFrom.isDisabledItem,
            );
            expect(mockBuildSelectedAirportsList).toHaveBeenCalledWith(
                mockRootStore.searchStore.searchFrom.countries,
                mockRootStore.searchStore.searchFrom.origins,
            );
            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: SearchPodEventActions.FromFieldClick,
                    eventLabel: 'Departure Overlay - Apply',
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DepartureRegionAll,
                    genericValue2: 'London (All)',
                    genericValue3: 'Gatwick|Luton',
                    genericValue4: 'Gatwick|Luton',
                }),
            );
        });

        it('should call trackEventWithParams for Clear button with individual selection', () => {
            mockDetermineSelectionType.mockReturnValue({
                hasGroupSelections: false,
                hasIndividualSelections: true,
            });

            baseTrackingSearchPodStore.trackFromFooterButtonsClick(SearchBarDropdownFooterButton.Clear);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.objectContaining({
                    eventLabel: 'Departure Overlay - Clear',
                }),
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DepartureRegionSingle,
                }),
            );
        });

        it('should call trackEventWithParams for Close button with mixed selection', () => {
            mockDetermineSelectionType.mockReturnValue({
                hasGroupSelections: true,
                hasIndividualSelections: true,
            });

            baseTrackingSearchPodStore.trackFromFooterButtonsClick(SearchBarDropdownFooterButton.Close);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.objectContaining({
                    eventLabel: 'Departure Overlay - Close',
                }),
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DepartureRegionAllSingle,
                }),
            );
        });

        it('should handle empty origins', () => {
            mockRootStore.searchStore.searchFrom.origins = null;
            mockRootStore.searchStore.searchFrom.countries = null;
            mockBuildDepartureTitles.mockReturnValue({ titles: [] });
            mockBuildMultiDepartureAirportsList.mockReturnValue('');
            mockBuildSelectedAirportsList.mockReturnValue('');
            mockDetermineSelectionType.mockReturnValue({
                hasGroupSelections: false,
                hasIndividualSelections: false,
            });

            baseTrackingSearchPodStore.trackFromFooterButtonsClick(SearchBarDropdownFooterButton.Apply);

            expect(mockBuildDepartureTitles).toHaveBeenCalledWith([], [], expect.any(Function));
            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue2: '',
                    genericValue3: '',
                    genericValue4: '',
                }),
            );
        });
    });

    describe('trackSearchPodToSuggestionClick', () => {
        it('should track suggestion click with destination type and parents for non-Anywhere destinations', () => {
            const airportsData = {
                code: 'AYT',
                name: 'Antalya',
                type: 'Resort',
                parents: [{ name: 'Turkey' }, { name: 'Mediterranean' }],
            } as any;
            const typedValue = 'Ant';

            mockRootStore.layoutStore = {
                getPhrase: jest.fn(key => {
                    if (key === 'Globals.DestinationTypes.Resort') {
                        return 'Resort';
                    }

                    return key;
                }),
            };

            baseTrackingSearchPodStore.trackSearchPodToSuggestionClick(airportsData, typedValue);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: SearchPodEventActions.ToFieldClick,
                    eventLabel: SearchPodEventLabels.SearchSuggestionDropdown,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.MainToField,
                    genericValue2: 'Antalya',
                    genericValue3: 'Ant',
                    genericValue4: 'Resort - Turkey, Mediterranean',
                }),
            );
        });

        it('should track suggestion click with null genericValue4 for Anywhere destination', () => {
            const airportsData = {
                code: 'ANY',
                name: 'Anywhere',
                type: 'Anywhere',
            } as any;
            const typedValue = '';

            baseTrackingSearchPodStore.trackSearchPodToSuggestionClick(airportsData, typedValue);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.MainToField,
                    genericValue2: 'Anywhere',
                    genericValue3: '',
                    genericValue4: null,
                }),
            );
        });

        it('should handle destination without parents', () => {
            const airportsData = {
                code: 'TUR',
                name: 'Turkey',
                type: 'Country',
                parents: null,
            } as any;
            const typedValue = 'Tur';

            mockRootStore.layoutStore = {
                getPhrase: jest.fn(() => 'Country'),
            };

            baseTrackingSearchPodStore.trackSearchPodToSuggestionClick(airportsData, typedValue);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue4: 'Country',
                }),
            );
        });
    });

    describe('trackToInputClick', () => {
        beforeEach(() => {
            mockRootStore.trackingStore.trackEventWithParams.mockClear();
        });

        it('should track DestinationRegionAnywhere when callout contains an anchor', () => {
            baseTrackingSearchPodStore.trackToInputClick(true);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.ToFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                    eventLabel: null,
                },
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.MainToField,
                    genericValue2: SearchPodGenericValues.DestinationRegionAnywhereQuiz,
                    destinationUrl: null,
                }),
            );
        });

        it('should track DestinationRegionAnywhereQuiz when callout does not contain an anchor', () => {
            baseTrackingSearchPodStore.trackToInputClick(false);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.ToFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                    eventLabel: null,
                },
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.MainToField,
                    genericValue2: SearchPodGenericValues.DestinationRegionAnywhere,
                    destinationUrl: null,
                }),
            );
        });
    });

    describe('trackToRegionSelectAll', () => {
        beforeEach(() => {
            mockRootStore.searchStore.searchTo = {
                isDisabledItem: jest.fn(() => false),
            };
        });

        it('should track selecting all destinations in a region', () => {
            const parent = {
                name: 'Turkey',
                itemName: 'Turkey',
                children: [
                    { code: 'AYT', name: 'Antalya', itemName: 'Antalya' },
                    { code: 'BOD', name: 'Bodrum', itemName: 'Bodrum' },
                    { code: 'DLM', name: 'Dalaman', itemName: 'Dalaman' },
                ],
            } as any;

            baseTrackingSearchPodStore.trackToRegionSelectAll(parent, false);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: SearchPodEventActions.ToFieldClick,
                    eventLabel: SearchPodEventLabels.DestinationOverlay,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DestinationRegionDeselectAll,
                    genericValue2: 'Turkey',
                    genericValue3: 'Antalya|Bodrum|Dalaman',
                    genericValue4: 'Antalya|Bodrum|Dalaman',
                }),
            );
        });

        it('should track deselecting all destinations in a region', () => {
            const parent = {
                name: 'Turkey',
                itemName: 'Turkey',
                children: [
                    { code: 'AYT', name: 'Antalya', itemName: 'Antalya' },
                    { code: 'BOD', name: 'Bodrum', itemName: 'Bodrum' },
                ],
            } as any;

            baseTrackingSearchPodStore.trackToRegionSelectAll(parent, true);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DestinationRegionSelectAll,
                }),
            );
        });

        it('should mark disabled destinations as unavailable', () => {
            const parent = {
                name: 'Turkey',
                itemName: 'Turkey',
                children: [
                    { code: 'AYT', name: 'Antalya', itemName: 'Antalya' },
                    { code: 'BOD', name: 'Bodrum', itemName: 'Bodrum' },
                    { code: 'DLM', name: 'Dalaman', itemName: 'Dalaman' },
                ],
            } as any;

            mockRootStore.searchStore.searchTo.isDisabledItem = jest.fn(
                child => child.code === 'BOD' || child.code === 'DLM',
            );

            baseTrackingSearchPodStore.trackToRegionSelectAll(parent, false);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue3: 'Antalya|Bodrum(unavailable)|Dalaman(unavailable)',
                    genericValue4: 'Antalya',
                }),
            );
        });

        it('should handle empty children array', () => {
            const parent = {
                name: 'Empty Country',
                itemName: 'Empty Country',
                children: [],
            } as any;

            baseTrackingSearchPodStore.trackToRegionSelectAll(parent, false);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue3: '',
                    genericValue4: '',
                }),
            );
        });
    });

    describe('trackToRegionSelectSingle', () => {
        beforeEach(() => {
            mockFormatDestinationName.mockImplementation(
                (
                    destination: IDestinationCountry,
                    isDisabledItem: (d: IDestinationCountry | IDestination) => boolean,
                ) => {
                    const name = destination.itemName;

                    return isDisabledItem(destination) ? `${name}(unavailable)` : name;
                },
            );
        });

        it('should track selecting a single destination', () => {
            const parent = {
                name: 'Turkey',
                itemName: 'Turkey',
                children: [
                    { code: 'AYT', name: 'Antalya', itemName: 'Antalya' },
                    { code: 'BOD', name: 'Bodrum', itemName: 'Bodrum' },
                ],
            } as any;

            baseTrackingSearchPodStore.trackToRegionSelectSingle(parent, 'AYT', true);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: SearchPodEventActions.ToFieldClick,
                    eventLabel: SearchPodEventLabels.DestinationOverlay,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DestinationRegionSelectSingle,
                    genericValue2: 'Turkey',
                    genericValue3: 'Antalya|Bodrum',
                    genericValue4: 'Antalya',
                }),
            );
        });

        it('should include disabled destinations marked as unavailable', () => {
            const parent = {
                name: 'Turkey',
                itemName: 'Turkey',
                children: [
                    { code: 'AYT', name: 'Antalya', itemName: 'Antalya' },
                    { code: 'BOD', name: 'Bodrum', itemName: 'Bodrum' },
                ],
            } as any;
            const selectedAirportCode = 'AYT';
            const isSelecting = true;

            mockRootStore.searchStore.searchTo.isDisabledItem = jest.fn(child => child.code === 'BOD');

            baseTrackingSearchPodStore.trackToRegionSelectSingle(parent, selectedAirportCode, isSelecting);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue3: 'Antalya|Bodrum(unavailable)',
                }),
            );
        });

        it('should track deselecting a single destination', () => {
            const parent = {
                name: 'Turkey',
                itemName: 'Turkey',
                children: [{ code: 'AYT', name: 'Antalya', itemName: 'Antalya' }],
            } as any;

            baseTrackingSearchPodStore.trackToRegionSelectSingle(parent, 'AYT', false);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DestinationRegionDeselectSingle,
                }),
            );
        });

        it('should not track if destination not found in children', () => {
            const parent = {
                name: 'Turkey',
                itemName: 'Turkey',
                children: [{ code: 'AYT', name: 'Antalya', itemName: 'Antalya' }],
            } as any;

            baseTrackingSearchPodStore.trackToRegionSelectSingle(parent, 'BOD', true);

            expect(mockRootStore.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
        });

        it('should handle undefined children array', () => {
            const parent = {
                name: 'Turkey',
                itemName: 'Turkey',
                children: undefined,
            } as any;

            baseTrackingSearchPodStore.trackToRegionSelectSingle(parent, 'AYT', true);

            expect(mockRootStore.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
        });

        it('should calls formatDestinationName when tracking a single region selection', () => {
            const parent = {
                name: 'Turkey',
                itemName: 'Turkey',
                children: [{ code: 'AYT', name: 'Antalya', itemName: 'Antalya' }],
            } as any;
            baseTrackingSearchPodStore.trackToRegionSelectSingle(parent, 'BOD', true);

            expect(formatDestinationName).toHaveBeenCalled();
            expect(mockFormatDestinationName).toHaveBeenCalledWith(
                expect.objectContaining({ itemName: 'Antalya' }),
                expect.any(Function),
            );
        });
    });

    describe('trackToAnywhereSelect', () => {
        it('should track selecting Anywhere destination', () => {
            baseTrackingSearchPodStore.trackToAnywhereSelect();

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: SearchPodEventActions.ToFieldClick,
                    eventLabel: SearchPodEventLabels.DestinationOverlay,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DestinationRegion,
                    genericValue2: SearchPodGenericValues.DestinationRegionAnywhere,
                    genericValue3: null,
                    genericValue4: null,
                }),
            );
        });
    });

    describe('trackToRegionToggle', () => {
        it('should track toggling a region to show/hide children', () => {
            const parent = {
                name: 'Turkey',
                itemName: 'Turkey',
                children: [
                    { code: 'AYT', name: 'Antalya', itemName: 'Antalya' },
                    { code: 'BOD', name: 'Bodrum', itemName: 'Bodrum' },
                ],
            } as any;

            baseTrackingSearchPodStore.trackToRegionToggle(parent);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: SearchPodEventActions.ToFieldClick,
                    eventLabel: SearchPodEventLabels.DestinationOverlay,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DestinationClick,
                    genericValue2: 'Turkey',
                    genericValue3: 'Antalya|Bodrum',
                }),
            );
        });

        it('should use name if itemName not available', () => {
            const parent = {
                name: 'Turkey',
                children: [{ code: 'AYT', name: 'Antalya' }],
            } as any;

            baseTrackingSearchPodStore.trackToRegionToggle(parent);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue2: 'Turkey',
                    genericValue3: 'Antalya',
                }),
            );
        });

        it('should handle empty children', () => {
            const parent = {
                name: 'Empty',
                itemName: 'Empty',
                children: undefined,
            } as any;

            baseTrackingSearchPodStore.trackToRegionToggle(parent);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue3: '',
                }),
            );
        });
    });

    describe('trackToFooterButtonsClick', () => {
        beforeEach(() => {
            mockRootStore.searchStore.searchTo = {
                selectedDestinations: [
                    {
                        code: 'TUR',
                        name: 'Turkey',
                        itemName: 'Turkey',
                        type: 'Country',
                    },
                ],
                countriesWithRegions: [
                    {
                        code: 'TUR',
                        name: 'Turkey',
                        children: [
                            { code: 'AYT', name: 'Antalya', itemName: 'Antalya', type: 'Resort' },
                            { code: 'BOD', name: 'Bodrum', itemName: 'Bodrum', type: 'Resort' },
                        ],
                    },
                ],
                isDisabledItem: jest.fn(() => false),
            };

            mockBuildDestinationRegionLists.mockReturnValue({
                allRegions: ['Antalya', 'Bodrum'],
                selectedRegions: ['Antalya', 'Bodrum'],
            });

            mockBuildFooterTrackingData.mockReturnValue({
                destinationTitles: ['Turkey'],
                allRegionsList: ['Antalya', 'Bodrum'],
                selectedRegionsList: ['Antalya', 'Bodrum'],
            });

            mockDetermineDestinationSelectionType.mockReturnValue(SearchPodGenericValues.DestinationRegionAll);
        });

        it('should track Apply button click with Country selection', () => {
            baseTrackingSearchPodStore.trackToFooterButtonsClick(SearchBarDropdownFooterButton.Apply);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: SearchPodEventActions.ToFieldClick,
                    eventLabel: SearchPodEventLabels.DestinationOverlayApply,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DestinationRegionAll,
                    genericValue2: 'Turkey',
                    genericValue3: 'Antalya|Bodrum',
                    genericValue4: 'Antalya|Bodrum',
                }),
            );
        });

        it('should track Close button with Resort selection showing parent region name', () => {
            mockRootStore.searchStore.searchTo.selectedDestinations = [
                {
                    code: 'ABZ',
                    name: 'Aberdeen City',
                    itemName: 'Aberdeen City',
                    type: 'Resort',
                    parents: [
                        { code: 'SCT', name: 'Scotland', type: 'Region' },
                        { code: 'UK', name: 'United Kingdom', type: 'Country' },
                    ],
                },
            ];

            mockBuildDestinationRegionLists.mockReturnValue({
                allRegions: ['Aberdeen City', 'Edinburgh City', 'Glasgow City'],
                selectedRegions: ['Aberdeen City'],
            });

            mockBuildFooterTrackingData.mockReturnValue({
                destinationTitles: ['Scotland'],
                allRegionsList: ['Aberdeen City', 'Edinburgh City', 'Glasgow City'],
                selectedRegionsList: ['Aberdeen City'],
            });

            mockDetermineDestinationSelectionType.mockReturnValue(SearchPodGenericValues.DestinationRegionSingle);

            baseTrackingSearchPodStore.trackToFooterButtonsClick(SearchBarDropdownFooterButton.Close);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.objectContaining({
                    eventLabel: SearchPodEventLabels.DestinationOverlayClose,
                }),
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DestinationRegionSingle,
                    genericValue2: 'Scotland',
                }),
            );
        });

        it('should track Clear button with VirtualCountry parent fallback', () => {
            mockRootStore.searchStore.searchTo.selectedDestinations = [
                {
                    code: 'ABZ',
                    name: 'Aberdeen',
                    itemName: 'Aberdeen',
                    type: 'Resort',
                    parents: [{ code: 'SCT', name: 'Scotland', type: 'VirtualCountry' }],
                },
            ];

            mockBuildDestinationRegionLists.mockReturnValue({
                allRegions: ['Aberdeen', 'Edinburgh'],
                selectedRegions: ['Aberdeen'],
            });

            mockBuildFooterTrackingData.mockReturnValue({
                destinationTitles: ['Scotland'],
                allRegionsList: ['Aberdeen', 'Edinburgh'],
                selectedRegionsList: ['Aberdeen'],
            });

            mockDetermineDestinationSelectionType.mockReturnValue(SearchPodGenericValues.DestinationRegionSingle);

            baseTrackingSearchPodStore.trackToFooterButtonsClick(SearchBarDropdownFooterButton.Clear);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue2: 'Scotland',
                }),
            );
        });

        it('should track mixed selection (group + individual)', () => {
            mockRootStore.searchStore.searchTo.selectedDestinations = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    itemName: 'Turkey',
                    type: 'Country',
                },
                {
                    code: 'ABZ',
                    name: 'Aberdeen',
                    itemName: 'Aberdeen',
                    type: 'Resort',
                    parents: [{ code: 'UK', name: 'United Kingdom', type: 'Country' }],
                },
            ];

            mockBuildDestinationRegionLists
                .mockReturnValueOnce({
                    allRegions: ['Antalya', 'Bodrum'],
                    selectedRegions: ['Antalya', 'Bodrum'],
                })
                .mockReturnValueOnce({
                    allRegions: ['Aberdeen', 'Edinburgh'],
                    selectedRegions: ['Aberdeen'],
                });

            mockBuildFooterTrackingData.mockReturnValue({
                destinationTitles: ['Turkey', 'United Kingdom'],
                allRegionsList: ['Antalya', 'Bodrum', 'Aberdeen', 'Edinburgh'],
                selectedRegionsList: ['Antalya', 'Bodrum', 'Aberdeen'],
            });

            mockDetermineDestinationSelectionType.mockReturnValue(SearchPodGenericValues.DestinationRegionAllSingle);

            baseTrackingSearchPodStore.trackToFooterButtonsClick(SearchBarDropdownFooterButton.Apply);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DestinationRegionAllSingle,
                    genericValue2: 'Turkey|United Kingdom',
                    genericValue3: 'Antalya|Bodrum|Aberdeen|Edinburgh',
                    genericValue4: 'Antalya|Bodrum|Aberdeen',
                }),
            );
        });

        it('should use destination name if no parents available', () => {
            mockRootStore.searchStore.searchTo.selectedDestinations = [
                {
                    code: 'AYT',
                    name: 'Antalya',
                    itemName: 'Antalya',
                    type: 'Resort',
                    parents: undefined,
                },
            ];

            mockBuildDestinationRegionLists.mockReturnValue({
                allRegions: ['Antalya'],
                selectedRegions: ['Antalya'],
            });

            mockBuildFooterTrackingData.mockReturnValue({
                destinationTitles: ['Antalya'],
                allRegionsList: ['Antalya'],
                selectedRegionsList: ['Antalya'],
            });

            mockDetermineDestinationSelectionType.mockReturnValue(SearchPodGenericValues.DestinationRegionSingle);

            baseTrackingSearchPodStore.trackToFooterButtonsClick(SearchBarDropdownFooterButton.Apply);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue2: 'Antalya',
                }),
            );
        });

        it('should handle empty selectedDestinations', () => {
            mockRootStore.searchStore.searchTo.selectedDestinations = [];

            mockBuildFooterTrackingData.mockReturnValue({
                destinationTitles: [],
                allRegionsList: [],
                selectedRegionsList: [],
            });

            mockDetermineDestinationSelectionType.mockReturnValue(SearchPodGenericValues.DestinationRegionSingle);

            baseTrackingSearchPodStore.trackToFooterButtonsClick(SearchBarDropdownFooterButton.Apply);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue1: SearchPodGenericValues.DestinationRegionSingle,
                    genericValue2: '',
                    genericValue3: '',
                    genericValue4: '',
                }),
            );
        });

        it('should handle null selectedDestinations', () => {
            mockRootStore.searchStore.searchTo.selectedDestinations = null;
            mockRootStore.searchStore.searchTo.countriesWithRegions = null;

            mockBuildFooterTrackingData.mockReturnValue({
                destinationTitles: [],
                allRegionsList: [],
                selectedRegionsList: [],
            });

            mockDetermineDestinationSelectionType.mockReturnValue(SearchPodGenericValues.DestinationRegionSingle);

            baseTrackingSearchPodStore.trackToFooterButtonsClick(SearchBarDropdownFooterButton.Apply);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    genericValue2: '',
                    genericValue3: '',
                    genericValue4: '',
                }),
            );
        });
    });

    describe('trackWhoInputClick', () => {
        it('should call trackEventWithParams with correctly formatted values when call trackWhoInputClick', () => {
            baseTrackingSearchPodStore.trackWhoInputClick();

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.WhoFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                    eventLabel: null,
                },
                {
                    destinationUrl: null,
                    genericValue1: SearchPodGenericValues.MainWhoField,
                    genericValue2: `${mockGetNumberOfRooms} ${PREFILLED_VALUE_PLACEHOLDER}`,
                    genericValue3: null,
                    genericValue4: `${mockGetPassengerConfig} ${PREFILLED_VALUE_PLACEHOLDER}`,
                },
            );
        });
    });

    describe('trackWhoDropdownRoomSelectorInteraction', () => {
        it('should call trackEventWithParams with correctly formatted values when call trackWhoDropdownRoomSelectorInteraction with true parameter', () => {
            baseTrackingSearchPodStore.trackWhoDropdownRoomSelectorInteraction(true);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.WhoFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                    eventLabel: SearchPodEventLabels.PassengerOverlay,
                },
                {
                    destinationUrl: null,
                    genericValue1: SearchPodGenericValues.MainWhoField,
                    genericValue2: mockGetNumberOfRooms,
                    genericValue3: SearchPodGenericValues.RoomsDropdownOpen,
                    genericValue4: mockGetPassengerConfig,
                },
            );
        });

        it('should call trackEventWithParams with correctly formatted values when call trackWhoDropdownRoomSelectorInteraction with false parameter', () => {
            baseTrackingSearchPodStore.trackWhoDropdownRoomSelectorInteraction(false);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.WhoFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                    eventLabel: SearchPodEventLabels.PassengerOverlay,
                },
                {
                    destinationUrl: null,
                    genericValue1: SearchPodGenericValues.MainWhoField,
                    genericValue2: mockGetNumberOfRooms,
                    genericValue3: SearchPodGenericValues.RoomsDropdownClosed,
                    genericValue4: mockGetPassengerConfig,
                },
            );
        });
    });

    describe('trackWhoDropdownRoomSelection', () => {
        it('should call trackEventWithParams with correctly formatted values when call trackWhoDropdownRoomSelection with 3 rooms', () => {
            const mockedRoomsValue = 3;
            baseTrackingSearchPodStore.trackWhoDropdownRoomSelection(mockedRoomsValue);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.WhoFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                    eventLabel: SearchPodEventLabels.PassengerOverlay,
                },
                {
                    destinationUrl: null,
                    genericValue1: SearchPodGenericValues.MainWhoField,
                    genericValue2: `${mockedRoomsValue}`,
                    genericValue3: SearchPodGenericValues.NumberOfRoomsSelect,
                    genericValue4: null,
                },
            );
        });

        it("should call trackEventWithParams with correctly formatted values when call trackWhoDropdownRoomSelection with -1 (I don't mind option)", () => {
            baseTrackingSearchPodStore.trackWhoDropdownRoomSelection(-1);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.WhoFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                    eventLabel: SearchPodEventLabels.PassengerOverlay,
                },
                {
                    destinationUrl: null,
                    genericValue1: SearchPodGenericValues.MainWhoField,
                    genericValue2: I_DONT_MIND,
                    genericValue3: SearchPodGenericValues.NumberOfRoomsSelect,
                    genericValue4: null,
                },
            );
        });
    });

    describe('trackWhoFooterButtonsClick', () => {
        it('should call trackEventWithParams with correctly formatted values for Apply button click', () => {
            baseTrackingSearchPodStore.trackWhoFooterButtonsClick(SearchBarDropdownFooterButton.Apply);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.WhoFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                    eventLabel: SearchPodEventLabels.PassengerOverlayApply,
                },
                {
                    destinationUrl: null,
                    genericValue1: SearchPodGenericValues.MainWhoField,
                    genericValue2: mockGetNumberOfRooms,
                    genericValue3: null,
                    genericValue4: mockGetPassengerConfig,
                },
            );
        });

        it('should call trackEventWithParams with correctly formatted values for Close button click', () => {
            baseTrackingSearchPodStore.trackWhoFooterButtonsClick(SearchBarDropdownFooterButton.Close);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.WhoFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                    eventLabel: SearchPodEventLabels.PassengerOverlayClose,
                },
                {
                    destinationUrl: null,
                    genericValue1: SearchPodGenericValues.MainWhoField,
                    genericValue2: mockGetNumberOfRooms,
                    genericValue3: null,
                    genericValue4: mockGetPassengerConfig,
                },
            );
        });

        it('should call trackEventWithParams with correctly formatted values for Clear button click', () => {
            baseTrackingSearchPodStore.trackWhoFooterButtonsClick(SearchBarDropdownFooterButton.Clear);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: SearchPodEventActions.WhoFieldClick,
                    eventCategory: EventCategories.SearchPod,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                    eventLabel: SearchPodEventLabels.PassengerOverlayReset,
                },
                {
                    destinationUrl: null,
                    genericValue1: SearchPodGenericValues.MainWhoField,
                    genericValue2: mockGetNumberOfRooms,
                    genericValue3: null,
                    genericValue4: mockGetPassengerConfig,
                },
            );
        });
    });

    describe('trackRecentSearches', () => {
        const resentSearch = {
            createdAt: '2020-11-10',
            startDate: '2020-11-10',
            durations: ['13', '21'],
            departure: '2020-12-10',
            geog: 'geog',
            dest: 'LGW',
            rooms: [],
            autoAllocation: false,
            flexDays: 1,
            isMonthSearch: false,
            isVirtualResort: false,
        };

        it('should call trackEventWithParams with right params for one resent search', () => {
            baseTrackingSearchPodStore.trackRecentSearches(RecentSearchesActions.Clear, [resentSearch]);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: EventActions.RecentSearch,
                    eventLabel: RecentSearchesActions.Clear,
                    eventType: EventTypes.Interaction,
                },
                {
                    destinationUrl: null,
                    genericValue1: `1 Recent Search`,
                    genericValue2: 'Gatwick, Luton - Turkey, Spain',
                    genericValue3: '2025-05-01, 7 Nights',
                    genericValue4: '3 Adult, 1 Child, 1 Infant',
                },
            );
        });

        it('should join few resent searches params', () => {
            baseTrackingSearchPodStore.trackRecentSearches(RecentSearchesActions.Clear, [resentSearch, resentSearch]);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: EventActions.RecentSearch,
                    eventLabel: RecentSearchesActions.Clear,
                    eventType: EventTypes.Interaction,
                },
                {
                    destinationUrl: null,
                    genericValue1: `2 Recent Search`,
                    genericValue2: 'Gatwick, Luton - Turkey, Spain | Gatwick, Luton - Turkey, Spain',
                    genericValue3: '2025-05-01, 7 Nights | 2025-05-01, 7 Nights',
                    genericValue4: '3 Adult, 1 Child, 1 Infant | 3 Adult, 1 Child, 1 Infant',
                },
            );
        });
    });

    describe('trackSearchButtonClick', () => {
        it('should call trackEventWithParams with prepopulated params', () => {
            mockRootStore.hotelsStore.getSearchParamsFromLocalStorage = jest.fn().mockReturnValue({
                startDate: '05-12-2025',
                durations: ['7'],
                departure: 'LGW,LTN',
                dest: 'ITLG',
                geog: 'IT,ITLG',
                rooms: [],
                autoAllocation: false,
                flexDays: 0,
                isMonthSearch: false,
            });

            baseTrackingSearchPodStore.trackSearchButtonClick();

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: SearchPodEventActions.SearchButtonClick,
                    eventLabel: null,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                {
                    destinationUrl: null,
                    genericValue1: `Gatwick, Luton ${PREFILLED_VALUE_PLACEHOLDER}`,
                    genericValue2: `Majorca | Region - Spain ${PREFILLED_VALUE_PLACEHOLDER}`,
                    genericValue3: `May 2025 | No Flexibility ${PREFILLED_VALUE_PLACEHOLDER}`,
                    genericValue4: `A: 2, C: 1, I: 1 | Rooms: 3 ${PREFILLED_VALUE_PLACEHOLDER}`,
                },
            );
        });

        it('should call trackEventWithParams without prepopulated params', () => {
            mockIsWhenFieldPrePopulated = false;
            mockCompareRooms = false;
            mockRootStore.hotelsStore.getSearchParamsFromLocalStorage = jest.fn().mockReturnValue({
                startDate: '05-12-2025',
                durations: ['7'],
                departure: 'LGW',
                dest: 'TTT',
                geog: 'IT,ITLG',
                rooms: [],
                autoAllocation: false,
                flexDays: 0,
                isMonthSearch: false,
            });

            baseTrackingSearchPodStore.trackSearchButtonClick();

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: SearchPodEventActions.SearchButtonClick,
                    eventLabel: null,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                {
                    destinationUrl: null,
                    genericValue1: `Gatwick, Luton`,
                    genericValue2: `Majorca | Region - Spain`,
                    genericValue3: `May 2025 | No Flexibility`,
                    genericValue4: `A: 2, C: 1, I: 1 | Rooms: 3`,
                },
            );
        });

        it('should call trackEventWithParams with cheapest month', () => {
            mockRootStore.searchStore.searchWhen.isCheapestMonthSelected = true;
            mockRootStore.hotelsStore.getSearchParamsFromLocalStorage = jest.fn().mockReturnValue({
                startDate: '05-12-2025',
                durations: ['7'],
                departure: 'LGW,LTN',
                dest: 'ITLG',
                geog: 'IT,ITLG',
                rooms: [],
                autoAllocation: false,
                flexDays: 0,
                isMonthSearch: false,
            });

            baseTrackingSearchPodStore.trackSearchButtonClick();

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SearchPod,
                    eventAction: SearchPodEventActions.SearchButtonClick,
                    eventLabel: null,
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                {
                    destinationUrl: null,
                    genericValue1: `Gatwick, Luton ${PREFILLED_VALUE_PLACEHOLDER}`,
                    genericValue2: `Majorca | Region - Spain ${PREFILLED_VALUE_PLACEHOLDER}`,
                    genericValue3: `May 2025 | No Flexibility | Cheapest Month`,
                    genericValue4: `A: 2, C: 1, I: 1 | Rooms: 3`,
                },
            );
        });
    });

    describe('trackStartNewSearch', () => {
        it('should call trackEventWithParams with right params', () => {
            baseTrackingSearchPodStore.trackStartNewSearch();

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
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
                    genericValue4: `A: 2, C: 1, I: 1 ${PREFILLED_VALUE_PLACEHOLDER}`,
                },
            );
        });
    });
});
