import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SearchParametersPreview, {
    ISearchParametersPreviewProps,
} from 'frontend/components/renderings/SearchPod/components/SearchParametersPreview/SearchParametersPreview';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons/PlainDeparture', () => () => <div data-tid='plain-departure' />);

jest.mock('frontend/components/icons/Calendar', () => () => <div data-tid='calendar' />);

jest.mock('frontend/components/icons/Bed', () => () => <div data-tid='bed' />);

jest.mock('frontend/components/icons/MapMarker', () => () => <div data-tid='map-marker' />);

const mockFormatDatesRange = '12 - 13 Oct';
const mockFormatMonthDate = 'May 2025';
jest.mock('frontend/utils/date.utils', () => ({
    formatDatesRange: jest.fn(() => mockFormatDatesRange),
    formatDateL10n: jest.fn(() => mockFormatMonthDate),
}));

const mockBackToReferrerComponent = jest.fn();
jest.mock('frontend/components/common/BackToReferrer/BackToReferrer', () => props => {
    mockBackToReferrerComponent(props);

    return <div data-tid='back-to-referrer' />;
});

const mockSearchParameterComponent = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchParametersPreview/components/SearchParameter/SearchParameter',
    () => props => {
        mockSearchParameterComponent(props);

        return (
            <button data-tid={props.valueDataTid} onClick={props.onClick}>
                {props.icon}
            </button>
        );
    },
);

const mockButtonComponent = jest.fn();
jest.mock('frontend/components/common/Button', () => props => {
    mockButtonComponent(props);

    return (
        <button data-tid={props.dataTid} onClick={props.onClick}>
            {props.children}
        </button>
    );
});

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

const resetMocks = (): ISearchParametersPreviewProps => ({
    onEdit: jest.fn(),
    onOpenSearchBarDropdown: jest.fn(),
});

let mockProps;
let mockStores;
let mockLocalStore;

describe('<SearchParametersPreview />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createMockStores({
            searchStore: {
                searchTo: {
                    displayValue: {
                        main: 'Austria',
                        add: '+1',
                    },
                },
                searchFrom: {
                    displayValue: {
                        main: 'London',
                        add: '+1',
                    },
                },
                searchWhen: {
                    from: new Date('2019-06-13T01:41:20.000Z'),
                    to: new Date('2019-06-23T01:41:20.000Z'),
                    isMonthSearch: false,
                },
                searchWho: { isAutoAllocation: false, totalGuestsQuantity: 2, roomsAllocationLength: 2 },
                setOldSearchParam: jest.fn(),
                isOldParamSet: null,
            },
            queryParamStore: {
                returnPathFromUrl: '',
            },
            layoutStore: {
                isMobileAppHideFeatures: false,
            },
        });
        mockLocalStore = createMockLocalStore();
        mockUseMobileViewport = true;
    });

    describe('when parameter', () => {
        it('should render when parameter', () => {
            mockStores.searchStore.searchWho.roomsAllocationLength = 1;
            render(<SearchParametersPreview {...mockProps} />);
            const searchParameterComponent = screen.getByTestId('search-pod-preview-travel-dates');

            expect(mockSearchParameterComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockLocalStore.fields.WhenFieldLabel.value,
                    value: mockFormatDatesRange,
                    valueDataTid: 'search-pod-preview-travel-dates',
                }),
            );
            within(searchParameterComponent).getByTestId('calendar');
        });

        it('should render month search when parameter when isMonthSearch is true', () => {
            mockStores.searchStore.searchWhen.isMonthSearch = true;
            render(<SearchParametersPreview {...mockProps} />);

            render(<SearchParametersPreview {...mockProps} />);

            expect(mockSearchParameterComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: mockFormatMonthDate,
                }),
            );
        });

        it('should call onOpenSearchBarDropdown on desktop', () => {
            mockUseMobileViewport = false;
            render(<SearchParametersPreview {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-pod-preview-travel-dates'));

            expect(mockProps.onOpenSearchBarDropdown).toHaveBeenCalledWith(SearchBarDropdown.When);
        });
    });

    describe('guests parameter', () => {
        it('should render amount of guests and rooms when auto allocation false', () => {
            mockStores.searchStore.searchWho.roomsAllocationLength = 1;
            render(<SearchParametersPreview {...mockProps} />);
            const searchParameterComponent = screen.getByTestId('search-pod-preview-guests');

            expect(mockSearchParameterComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockLocalStore.fields.WhoFieldLabel.value,
                    value: `2 ${SitecoreDictionary.GlobalsLabelsGuests}, 1 ${SitecoreDictionary.GlobalsLabelsRoom}`,
                    valueDataTid: 'search-pod-preview-guests',
                }),
            );
            within(searchParameterComponent).getByTestId('bed');
        });

        it('should render only guests amount when auto allocation true', () => {
            mockStores.searchStore.searchWho.totalGuestsQuantity = 1;
            mockStores.searchStore.searchWho.isAutoAllocation = true;
            render(<SearchParametersPreview {...mockProps} />);

            expect(mockSearchParameterComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockLocalStore.fields.WhoFieldLabel.value,
                    value: `1 ${SitecoreDictionary.GlobalsLabelsGuest}`,
                    valueDataTid: 'search-pod-preview-guests',
                }),
            );
        });

        it('should call onOpenSearchBarDropdown on desktop', () => {
            mockUseMobileViewport = false;
            render(<SearchParametersPreview {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-pod-preview-guests'));

            expect(mockProps.onOpenSearchBarDropdown).toHaveBeenCalledWith(SearchBarDropdown.Who);
        });
    });

    describe('from parameter', () => {
        it('should render from filed with + when user search for few routs', () => {
            render(<SearchParametersPreview {...mockProps} />);
            const searchParameterComponent = screen.getByTestId('search-pod-preview-origin');

            expect(mockSearchParameterComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: SitecoreDictionary.GlobalsLabelsFrom,
                    value: 'London +1',
                    valueDataTid: 'search-pod-preview-origin',
                    boldOnMobile: true,
                }),
            );
            within(searchParameterComponent).getByTestId('plain-departure');
        });

        it('should render from when user search for one rout', () => {
            mockStores.searchStore.searchFrom.displayValue = {
                main: 'London',
                add: '',
            };
            render(<SearchParametersPreview {...mockProps} />);

            expect(mockSearchParameterComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: 'London',
                }),
            );
        });

        it('should call onOpenSearchBarDropdown on desktop', () => {
            mockUseMobileViewport = false;
            render(<SearchParametersPreview {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-pod-preview-origin'));

            expect(mockProps.onOpenSearchBarDropdown).toHaveBeenCalledWith(SearchBarDropdown.From);
        });
    });

    describe('to parameter', () => {
        it('should render to filed with + when user search for few routs', () => {
            render(<SearchParametersPreview {...mockProps} />);
            const searchParameterComponent = screen.getByTestId('search-pod-preview-destination');

            expect(mockSearchParameterComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockLocalStore.fields.ToFieldLabel.value,
                    value: 'Austria +1',
                    valueDataTid: 'search-pod-preview-destination',
                    boldOnMobile: true,
                }),
            );
            within(searchParameterComponent).getByTestId('map-marker');
        });

        it('should render to value when user search for one rout', () => {
            mockStores.searchStore.searchTo.displayValue = {
                main: 'Austria',
                add: '',
            };
            render(<SearchParametersPreview {...mockProps} />);

            expect(mockSearchParameterComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: 'Austria',
                }),
            );
        });

        it('should call onOpenSearchBarDropdown on desktop', () => {
            mockUseMobileViewport = false;
            render(<SearchParametersPreview {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-pod-preview-destination'));

            expect(mockProps.onOpenSearchBarDropdown).toHaveBeenCalledWith(SearchBarDropdown.To);
        });
    });

    it('should call onEdit when click on container', () => {
        render(<SearchParametersPreview {...mockProps} />);

        fireEvent.click(screen.getByTestId('search-bar-preview'));

        expect(mockProps.onEdit).toHaveBeenCalledWith(true);
    });

    it('should call onEdit when click on SearchParameters on mobile', () => {
        render(<SearchParametersPreview {...mockProps} />);

        fireEvent.click(screen.getByTestId('search-pod-preview-origin'));

        expect(mockProps.onEdit).toHaveBeenCalledWith(true);
    });

    describe('edit button', () => {
        it('should call onEdit when click button', () => {
            render(<SearchParametersPreview {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-parameters-edit-button'));

            expect(mockStores.searchStore.setOldSearchParam).toHaveBeenCalled();
            expect(mockProps.onEdit).toHaveBeenCalledWith(undefined);
        });

        it('should have mobile label', () => {
            render(<SearchParametersPreview {...mockProps} />);

            expect(screen.getByTestId('search-parameters-edit-button')).toHaveTextContent(
                mockLocalStore.fields.EditSearchMobile.value,
            );
            expect(mockButtonComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isText: true,
                    id: 'search-parameters-edit',
                    dataTid: 'search-parameters-edit-button',
                    className: 'editSearchParameters',
                }),
            );
        });

        it('should have desktop label', () => {
            mockUseMobileViewport = false;
            render(<SearchParametersPreview {...mockProps} />);

            expect(screen.getByTestId('search-parameters-edit-button')).toHaveTextContent(
                mockLocalStore.fields.EditSearch.value,
            );
        });
    });

    describe('Back to flights button', () => {
        it('Should render BackToReferrer when referrer and returnPath are provided', () => {
            mockStores.queryParamStore.returnPathFromUrl = '/en/buy/flights';
            mockStores.layoutStore.referrer = 'https://easyjet.com/en/buy/flights';

            render(<SearchParametersPreview {...mockProps} />);

            const button = screen.getByTestId('back-to-referrer-wrapper');

            expect(button).toBeInTheDocument();

            expect(mockBackToReferrerComponent).toHaveBeenCalledWith({
                returnPath: mockStores.queryParamStore.returnPathFromUrl,
            });
        });

        it('Should NOT render BackToReferrer when referrer and returnPath are not provided', () => {
            mockStores.queryParamStore.returnPathFromUrl = '';
            mockStores.layoutStore.referrer = '';

            render(<SearchParametersPreview {...mockProps} />);

            const button = screen.queryByTestId('back-to-referrer-wrapper');

            expect(button).not.toBeInTheDocument();
        });

        it('Should NOT render BackToReferrer when returnPath is not provided', () => {
            mockStores.queryParamStore.returnPathFromUrl = '';
            mockStores.layoutStore.referrer = 'http://easyjet.com/en/buy/flights';

            render(<SearchParametersPreview {...mockProps} />);

            const button = screen.queryByTestId('back-to-referrer-wrapper');

            expect(button).not.toBeInTheDocument();
        });

        it('Should NOT render BackToReferrer when referrer is not provided', () => {
            mockStores.queryParamStore.returnPathFromUrl = '/en/buy/flights';
            mockStores.layoutStore.referrer = undefined;

            render(<SearchParametersPreview {...mockProps} />);

            const button = screen.queryByTestId('back-to-referrer-wrapper');

            expect(button).not.toBeInTheDocument();
        });
    });
});
