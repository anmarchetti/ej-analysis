import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import RecentSearchesPanel, {
    IRecentSearchesPanelProps,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/RecentSearchesPanel';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockRecentSearchesComponent = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearches/RecentSearches',
    () => ({
        __esModule: true,
        default: ({ onClick, enableBodyScroll, ...props }) => {
            mockRecentSearchesComponent(props);

            return <div data-tid='recent-searches' />;
        },
    }),
);

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

let mockProps;
let mockStores;
let mockLocalStore;

const createProps = (): IRecentSearchesPanelProps => ({
    changeSelectedDropdown: jest.fn(),
    searchStickyWrRef: React.createRef(),
    selectedDropdown: null,
});

describe('<RecentSearchesPanel />', () => {
    beforeEach(() => {
        mockUseMobileViewport = false;
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                isHotelDetailsBrowsePage: false,
            },
            searchStore: {
                clearSearchValues: jest.fn(),
                isAnySearchParametersSelected: false,
            },
            trackingStore: {
                searchPod: {
                    trackStartNewSearch: jest.fn(),
                },
            },
        });
        mockLocalStore = createMockLocalStore();
    });

    describe('RecentSearches', () => {
        it('should render RecentSearches with hidden classname when selectedDropdown is NOT Recent', () => {
            mockProps.selectedDropdown = SearchBarDropdown.From;

            render(<RecentSearchesPanel {...mockProps} />);

            expect(screen.getByTestId('recent-searches-wrapper')).toHaveClass('hidden');
            expect(screen.getByTestId('recent-searches')).toBeInTheDocument();
        });

        it('should render RecentSearches without hidden classname when selectedDropdown is null', () => {
            render(<RecentSearchesPanel {...mockProps} />);

            expect(screen.getByTestId('recent-searches-wrapper')).not.toHaveClass('hidden');
            expect(screen.getByTestId('recent-searches')).toBeInTheDocument();
        });

        it('should render RecentSearches without placeholder classname when isHotelDetailsBrowsePage is false', () => {
            render(<RecentSearchesPanel {...mockProps} />);

            expect(screen.getByTestId('recent-searches-wrapper')).not.toHaveClass('placeholder');
        });

        it('should render RecentSearches with placeholder classname when isHotelDetailsBrowsePage is true and selectedDropdown is NOT recent', () => {
            mockStores.layoutStore.isHotelDetailsBrowsePage = true;

            render(<RecentSearchesPanel {...mockProps} />);

            expect(screen.getByTestId('recent-searches-wrapper')).toHaveClass('placeholder');
        });
    });

    describe('start new search button', () => {
        beforeEach(() => {
            mockStores.searchStore.isAnySearchParametersSelected = true;
        });

        it('should call clearSearchValues and tracking event when click on start new search button', () => {
            render(<RecentSearchesPanel {...mockProps} />);

            fireEvent.click(screen.getByTestId('start-new-search-btn'));

            expect(mockStores.searchStore.clearSearchValues).toHaveBeenCalledWith(false);
            expect(mockStores.trackingStore.searchPod.trackStartNewSearch).toHaveBeenCalled();
        });

        it('should render button with NewSearchLabel dictionary', () => {
            render(<RecentSearchesPanel {...mockProps} />);

            expect(screen.queryByTestId('start-new-search-btn')).toHaveTextContent(
                mockLocalStore.fields.NewSearchLabel.value,
            );
        });

        it('should render button with NewSearchMobile dictionary on mobile', () => {
            mockUseMobileViewport = true;

            render(<RecentSearchesPanel {...mockProps} />);

            expect(screen.getByTestId('start-new-search-btn')).toHaveTextContent(
                mockLocalStore.fields.NewSearchLabelMobile.value,
            );
        });

        it('should NOT render button when isAnySearchParametersSelected is false', () => {
            mockStores.searchStore.isAnySearchParametersSelected = false;

            render(<RecentSearchesPanel {...mockProps} />);

            expect(screen.queryByTestId('start-new-search-btn')).not.toBeInTheDocument();
        });

        it('should NOT render button when selectedDropdown is NOT Recent', () => {
            mockProps.selectedDropdown = SearchBarDropdown.From;

            render(<RecentSearchesPanel {...mockProps} />);

            expect(screen.queryByTestId('start-new-search-btn')).not.toBeInTheDocument();
        });
    });

    describe('EventListener', () => {
        it('should NOT add EventListener when selectedDropdown is not Recent', () => {
            const mockAddEventListener = jest.spyOn(document, 'addEventListener');

            render(<RecentSearchesPanel {...mockProps} />);

            expect(mockAddEventListener).not.toHaveBeenCalledWith('click', expect.any(Function));
        });

        it('should add EventListener when selectedDropdown is Recent', () => {
            const mockAddEventListener = jest.spyOn(document, 'addEventListener');
            mockProps.selectedDropdown = SearchBarDropdown.Recent;

            render(<RecentSearchesPanel {...mockProps} />);

            expect(mockAddEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        });

        it('should remove EventListener on unmount', () => {
            const mockRemoveEventListener = jest.spyOn(document, 'removeEventListener');

            const { unmount } = render(<RecentSearchesPanel {...mockProps} />);

            unmount();
            expect(mockRemoveEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        });

        it('should call changeSelectedDropdown with null and remove EventListener on outside click', () => {
            const mockRemoveEventListener = jest.spyOn(document, 'removeEventListener');
            mockProps.searchStickyWrRef = { current: document.createElement('div') };
            mockProps.selectedDropdown = SearchBarDropdown.Recent;

            render(<RecentSearchesPanel {...mockProps} />);

            fireEvent.click(document.body);

            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
            expect(mockRemoveEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        });

        it('should NOT call changeSelectedDropdown on inside click', () => {
            mockProps.searchStickyWrRef = { current: document.createElement('div') };
            mockProps.selectedDropdown = SearchBarDropdown.Recent;

            render(<RecentSearchesPanel {...mockProps} />);

            fireEvent.click(mockProps.searchStickyWrRef.current);

            expect(mockProps.changeSelectedDropdown).not.toHaveBeenCalled();
        });

        it('should NOT call changeSelectedDropdown on outside click when selectedDropdown is not Recent', () => {
            mockProps.searchStickyWrRef = { current: document.createElement('div') };

            render(<RecentSearchesPanel {...mockProps} />);

            fireEvent.click(document.body);

            expect(mockProps.changeSelectedDropdown).not.toHaveBeenCalled();
        });
    });
});
