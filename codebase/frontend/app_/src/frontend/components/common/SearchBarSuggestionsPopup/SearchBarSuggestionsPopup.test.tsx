import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

import SearchBarSuggestionsPopup, {
    ISearchBarSuggestionsPopupProps,
    SearchBarSuggestionsPopupType,
} from './SearchBarSuggestionsPopup';

let mockUsePrevious: number | undefined = 1;
jest.mock('frontend/hooks/usePrevious', () => jest.fn(() => mockUsePrevious));

const mockUseRef = jest.fn(() => ({ current: {} }));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useRef: () => mockUseRef(),
}));

jest.mock('scroll-into-view-if-needed');

const mockHighlightedTextComponent = jest.fn();
jest.mock('frontend/components/common/HighlightedText/HighlightedText', () => ({
    __esModule: true,
    HighlightedText: props => {
        mockHighlightedTextComponent(props);

        return <div data-tid='highlighted-text' />;
    },
}));

const mockSearchBarSuggestionIconComponent = jest.fn();
jest.mock('./components/SearchBarSuggestionIcon/SearchBarSuggestionIcon', () => ({
    __esModule: true,
    default: props => {
        mockSearchBarSuggestionIconComponent(props);

        return <div data-tid='search-bar-suggestion-icon-item' />;
    },
}));

const mockSearchBarSuggestionsPopupErrorComponent = jest.fn();
jest.mock('./components/SearchBarSuggestionsPopupError/SearchBarSuggestionsPopupError', () => ({
    __esModule: true,
    default: props => {
        mockSearchBarSuggestionsPopupErrorComponent(props);

        return <div data-tid='search-bar-suggestions-popup-error' />;
    },
}));

const mockSearchBarSuggestionsPopupShimmerComponent = jest.fn();
jest.mock('./components/SearchBarSuggestionsPopupShimmer/SearchBarSuggestionsPopupShimmer', () => ({
    __esModule: true,
    default: props => {
        mockSearchBarSuggestionsPopupShimmerComponent(props);

        return <div data-tid='search-bar-suggestions-popup-shimmer' />;
    },
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

const createProps = (): ISearchBarSuggestionsPopupProps => ({
    places: null,
    onSelect: jest.fn(),
    filterValue: '',
    availableCodes: null,
    parentHtmlElement: {} as any,
    isLoading: false,
    hasBlockedPlaces: false,
    type: SearchBarSuggestionsPopupType.Row,
    resetHighlightedIdx: jest.fn(),
});

let mockProps;
let mockStores;
let mockLocalStore;

describe('<SearchBarSuggestionsPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
        mockLocalStore = createMockLocalStore();
        mockUsePrevious = 1;
    });

    it('should not render Markup when places is null', () => {
        const { container } = render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(container.getElementsByClassName('sb-popup').length).toBe(0);
        expect(mockSearchBarSuggestionsPopupErrorComponent).not.toHaveBeenCalled();
    });

    it('should call resetHighlightedIdx when places.length is changed and places count is changed', () => {
        mockUsePrevious = 0;
        mockProps.places = [{ code: 'code', name: 'name' }];
        render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(mockProps.resetHighlightedIdx).toHaveBeenCalledTimes(2); // another call is from mount hook
    });

    it('should call resetHighlightedIdx when it is defined on mount & unmount', () => {
        mockUsePrevious = 1;
        mockProps.places = [{ code: 'code', name: 'name' }];
        const { unmount } = render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(mockProps.resetHighlightedIdx).toHaveBeenCalledTimes(1);

        unmount();

        expect(mockProps.resetHighlightedIdx).toHaveBeenCalledTimes(2);
    });

    it('should call scrollIntoViewIfNeeded on component update when highlightedIdx changes', () => {
        mockProps.highlightedIdx = 0;
        const { rerender } = render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(scrollIntoViewIfNeeded).toHaveBeenCalledTimes(1);
        mockProps.highlightedIdx = 1;

        rerender(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(scrollIntoViewIfNeeded).toHaveBeenCalledTimes(2);
    });

    it('should render a multiline type element with destination, place type and resort name when it is selected', () => {
        mockProps.places = [
            {
                code: 'ES',
                name: 'Resort Name',
                available: true,
                type: 'Resort',
                parents: [
                    {
                        code: 'ESCDBE',
                        name: 'Benalmadena',
                        available: true,
                        type: 'Resort',
                        showOnSearchPod: false,
                    },
                    {
                        code: 'ESCD',
                        name: 'Costa Del Sol',
                        available: true,
                        type: 'Region',
                        showOnSearchPod: false,
                    },
                ],
                showOnSearchPod: true,
            },
        ];
        mockProps.type = SearchBarSuggestionsPopupType.Multiline;

        const { container } = render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(container.querySelector('div.popup-item-bottom span')).toBeInTheDocument();
        expect(
            screen.getByText(`${SitecoreDictionary.GlobalsDestinationTypesResort} - Benalmadena, Costa Del Sol`),
        ).toBeInTheDocument();
        expect(mockHighlightedTextComponent).toHaveBeenCalledWith({
            text: mockProps.places[0].name,
            filterValue: mockProps.filterValue,
        });
    });

    it('should render a multiline type element with country name when it is selected', () => {
        mockProps.places = [
            {
                code: 'ES',
                name: 'Spain',
                available: true,
                type: 'Country',
                parents: [],
                showOnSearchPod: true,
            },
        ];
        mockProps.type = SearchBarSuggestionsPopupType.Multiline;

        const { container } = render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(container.querySelector('div.popup-item-bottom span')).toBeInTheDocument();
        expect(screen.getByText(`${SitecoreDictionary.GlobalsDestinationTypesCountry}`)).toBeInTheDocument();
        expect(mockHighlightedTextComponent).toHaveBeenCalledWith({
            text: mockProps.places[0].name,
            filterValue: mockProps.filterValue,
        });
    });

    it('should render a row type element when it is selected', () => {
        mockProps.places = [
            {
                code: 'ES',
                name: 'Spain',
                available: true,
                type: 'Country',
                parents: [],
                showOnSearchPod: true,
            },
        ];

        const { container } = render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(container.querySelector('div.popup-item-bottom span')).not.toBeInTheDocument();
        expect(container.querySelector('div.popup-item-left')).toBeInTheDocument();
        expect(mockHighlightedTextComponent).toHaveBeenCalledWith({
            text: mockProps.places[0].name,
            filterValue: mockProps.filterValue,
        });
        expect(screen.getByText(`${SitecoreDictionary.GlobalsDestinationTypesCountry}`)).toBeInTheDocument();
    });

    it('should render SearchBarSuggestionsPopupShimmer when isLoading is true and places is null', () => {
        mockProps.isLoading = true;

        render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(mockSearchBarSuggestionsPopupShimmerComponent).toHaveBeenCalledWith({
            isMultiline: false,
            className: 'sb-popup sb-popup--loading',
        });
    });

    it('should render SearchBarSuggestionsPopupShimmer when isLoading is true and places is an empty array', () => {
        mockProps.isLoading = true;
        mockProps.places = [];

        render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(mockSearchBarSuggestionsPopupShimmerComponent).toHaveBeenCalledWith({
            isMultiline: false,
            className: 'sb-popup sb-popup--loading',
        });
    });

    it('should render popup when isLoading is true but places are loaded', () => {
        mockProps.isLoading = true;
        mockProps.availableCodes = [''];
        mockProps.places = [
            {
                code: 'code',
                name: 'Spain',
            },
        ];
        const { container } = render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(container.getElementsByClassName('sb-popup').length).toBe(1);
        expect(mockSearchBarSuggestionsPopupErrorComponent).not.toHaveBeenCalled();
        expect(screen.getByText(mockLocalStore.fields.LoadingLabel.value)).toBeInTheDocument();
        expect(container.getElementsByClassName('popup-item').length).toBe(1);
        expect(mockHighlightedTextComponent).toHaveBeenCalledWith({
            text: mockProps.places[0].name,
            filterValue: mockProps.filterValue,
        });
    });

    it('should render single results count label when there is one place', () => {
        mockProps.availableCodes = '';
        mockProps.places = [
            {
                code: 'code',
                name: 'Spain',
            },
        ];

        const { container } = render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(container.getElementsByClassName('sb-popup').length).toBe(1);
        expect(mockSearchBarSuggestionsPopupErrorComponent).not.toHaveBeenCalled();
        expect(screen.getByText(`1 ${mockLocalStore.fields.ResultLabel.value}`)).toBeInTheDocument();
        expect(container.getElementsByClassName('popup-item').length).toBe(1);
        expect(mockHighlightedTextComponent).toHaveBeenCalledWith({
            text: mockProps.places[0].name,
            filterValue: mockProps.filterValue,
        });
    });

    it('should render multiple results count label and few items when there is more then one place', () => {
        mockProps.availableCodes = '';
        mockProps.places = [
            {
                code: 'code',
                name: 'Spain',
            },
            {
                code: 'code 1',
                name: 'Italy',
            },
        ];
        const { container } = render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(container.getElementsByClassName('sb-popup').length).toBe(1);
        expect(mockSearchBarSuggestionsPopupErrorComponent).not.toHaveBeenCalled();
        expect(screen.getByText(`2 ${mockLocalStore.fields.ResultsLabel.value}`)).toBeInTheDocument();
        expect(container.getElementsByClassName('popup-item').length).toBe(mockProps.places.length);
        expect(mockHighlightedTextComponent).toHaveBeenCalledWith({
            text: mockProps.places[0].name,
            filterValue: mockProps.filterValue,
        });
        expect(mockHighlightedTextComponent).toHaveBeenCalledWith({
            text: mockProps.places[1].name,
            filterValue: mockProps.filterValue,
        });
    });

    it('should render no results error when no places', () => {
        mockProps.places = [];

        render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(mockSearchBarSuggestionsPopupErrorComponent).toHaveBeenCalledWith({
            hasBlockedPlaces: mockProps.hasBlockedPlaces,
            errorMessage: mockProps.errorMessage,
            errorDescription: mockProps.errorDescription,
        });
    });

    it('should call onSelect prop when click on item', () => {
        mockProps.availableCodes = '';
        mockProps.places = [
            {
                code: 'code',
                name: 'Spain',
                showOnSearchPod: true,
            },
        ];
        mockProps.filterValue = 'filterValue name';

        render(<SearchBarSuggestionsPopup {...mockProps} />);

        fireEvent.click(screen.getByTestId('highlighted-text'));

        expect(mockProps.onSelect).toHaveBeenCalled();
    });

    it('should fallback to code if the place name is undefined', () => {
        mockProps.places = [
            {
                code: 'ES',
                showOnSearchPod: true,
            },
        ];

        render(<SearchBarSuggestionsPopup {...mockProps} />);

        expect(mockHighlightedTextComponent).toHaveBeenCalledWith({
            text: mockProps.places[0].code,
            filterValue: mockProps.filterValue,
        });
    });

    describe('Icon', () => {
        beforeEach(() => {
            mockProps.places = [
                {
                    code: 'ES',
                    name: 'Resort Name',
                    available: true,
                    type: 'Hotel',
                },
            ];
        });

        it('should render icon without icon when icon is NOT in places', () => {
            render(<SearchBarSuggestionsPopup {...mockProps} />);

            expect(screen.getByTestId('search-bar-suggestion-icon')).toHaveClass('icon');
            expect(screen.getByTestId('search-bar-suggestion-icon-item')).toBeInTheDocument();
            expect(mockSearchBarSuggestionIconComponent).toHaveBeenCalledWith({
                type: 'Hotel',
            });
        });

        it('should render big icon with icon prop when icon is in places', () => {
            mockProps.places[0].hotelTypeIcon = 'lux';

            render(<SearchBarSuggestionsPopup {...mockProps} />);

            expect(screen.getByTestId('search-bar-suggestion-icon')).toHaveClass('icon big-icon');
            expect(screen.getByTestId('search-bar-suggestion-icon-item')).toBeInTheDocument();
            expect(mockSearchBarSuggestionIconComponent).toHaveBeenCalledWith({
                type: 'Hotel',
                icon: 'lux',
            });
        });
    });
});
