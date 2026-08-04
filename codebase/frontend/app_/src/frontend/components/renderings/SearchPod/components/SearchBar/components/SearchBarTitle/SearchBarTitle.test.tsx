import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SearchBarTitle, {
    ISearchBarTitleProps,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarTitle/SearchBarTitle';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/Cross', () => () => <div data-tid='icon-cross' />);
jest.mock('frontend/components/icons-new/Search', () => () => <div data-tid='icon-search' />);
jest.mock('frontend/components/icons/ChevronDown', () => () => <div data-tid='icon-chevron-down' />);

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const createProps = (): ISearchBarTitleProps => ({
    isCollapsedMobileVariant: false,
    isStickyOnMobile: false,
    isSearchBarExpanded: false,
    isSearchBarSticky: false,
    searchExpandableBoxRef: React.createRef(),
    setSearchBarExpHeightValue: jest.fn(),
    setIsSearchBarExpanded: jest.fn(),
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isHomePage: false,
            isHotelDetailsBookPage: false,
        },
    });

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

let mockProps: ISearchBarTitleProps;
let mockStores;
let mockLocalStore;

describe('<SearchBarTitle />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockUseMobileViewport = true;
        mockLocalStore = createMockLocalStore();
    });

    it('should render standard', () => {
        const { container } = render(<SearchBarTitle {...mockProps} />);

        const component = screen.getByRole('button');
        const iconWrapper = container.querySelector('.search-bar__exp-btn-box') as HTMLElement;

        expect(component).toHaveTextContent(mockLocalStore.fields.PerfectHolidayTitle.value);
        expect(component).toHaveClass('search-bar__title');
        expect(iconWrapper).toBeInTheDocument();
        expect(within(iconWrapper).getByTestId('icon-chevron-down')).toBeInTheDocument();
    });

    it('should NOT render when isSearchBarExpanded is false, isHotelDetailsBookPage is true and useMobileViewport returns true', () => {
        mockStores.layoutStore.isHotelDetailsBookPage = true;
        const { container } = render(<SearchBarTitle {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render Cross icon when isCollapsedMobileVariant & isSearchBarExpanded are true', () => {
        mockProps.isCollapsedMobileVariant = true;
        mockProps.isSearchBarExpanded = true;

        render(<SearchBarTitle {...mockProps} />);

        expect(screen.getByTestId('icon-cross')).toBeInTheDocument();
    });

    it('should render Search icon when isCollapsedMobileVariant is true but searchBarExpanded is false', () => {
        mockProps.isCollapsedMobileVariant = true;
        mockProps.isSearchBarExpanded = false;

        render(<SearchBarTitle {...mockProps} />);

        expect(screen.getByTestId('icon-search')).toBeInTheDocument();
    });

    describe('onClick', () => {
        const mockSearchExpandableBoxRefHeight = 200;

        jest.useFakeTimers();

        beforeEach(() => {
            mockProps.isCollapsedMobileVariant = true;
            mockProps.searchExpandableBoxRef = {
                current: { getBoundingClientRect: jest.fn(() => ({ height: mockSearchExpandableBoxRefHeight })) },
            } as any;
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        test('should do nothing when searchExpandableBoxRef is null', () => {
            mockProps.searchExpandableBoxRef = { current: null };
            render(<SearchBarTitle {...mockProps} />);

            fireEvent.click(screen.getByRole('button'));

            expect(mockProps.setSearchBarExpHeightValue).not.toHaveBeenCalled();
            expect(mockProps.setIsSearchBarExpanded).not.toHaveBeenCalled();
        });

        test('should do nothing when useMobileViewport returns false', () => {
            mockUseMobileViewport = false;
            render(<SearchBarTitle {...mockProps} />);

            fireEvent.click(screen.getByRole('button'));

            expect(mockProps.setSearchBarExpHeightValue).not.toHaveBeenCalled();
            expect(mockProps.setIsSearchBarExpanded).not.toHaveBeenCalled();
        });

        test('should collapse search bar when isSearchBarExpanded is true', async () => {
            mockProps.isSearchBarExpanded = true;
            render(<SearchBarTitle {...mockProps} />);

            fireEvent.click(screen.getByRole('button'));

            expect(mockProps.setSearchBarExpHeightValue).toHaveBeenCalledWith(mockSearchExpandableBoxRefHeight);

            await waitFor(() => {
                expect(mockProps.setSearchBarExpHeightValue).toHaveBeenCalledWith(undefined);
            });
            expect(mockProps.setIsSearchBarExpanded).toHaveBeenCalledWith(false);
        });

        test('should expand search bar when isSearchBarExpanded is false', async () => {
            render(<SearchBarTitle {...mockProps} />);

            fireEvent.click(screen.getByRole('button'));

            expect(mockProps.setSearchBarExpHeightValue).toHaveBeenCalledWith(mockSearchExpandableBoxRefHeight);

            await waitFor(() => {
                expect(mockProps.setSearchBarExpHeightValue).toHaveBeenCalledWith(undefined);
            });
            expect(mockProps.setIsSearchBarExpanded).toHaveBeenCalledWith(true);
        });
    });
});
