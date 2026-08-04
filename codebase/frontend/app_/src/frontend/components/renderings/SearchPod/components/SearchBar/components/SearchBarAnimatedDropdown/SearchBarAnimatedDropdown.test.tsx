import React from 'react';
import { waitFor } from '@testing-library/dom';
import { act, render, screen } from '@testing-library/react';

import settings from 'code/settings';
import { createMockStores } from 'frontend/__mocks__';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SearchBarAnimatedDropdown, {
    DEFAULT_INDENT_BOTTOM,
    ISearchBarAnimatedDropdownProps,
    SEARCHPOD_BORDER_WIDTH,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarAnimatedDropdown/SearchBarAnimatedDropdown';
import { SEARCHBAR_STICKY_BOX_ID } from 'frontend/components/renderings/SearchPod/components/SearchBar/constants';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockIsBackend = false;
jest.mock('frontend/utils/isBackend', () => ({
    __esModule: true,
    default: jest.fn(() => mockIsBackend),
}));

const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
let resizeObserverCallback: (entries: any[]) => void;
class ResizeObserverMock {
    constructor(callback: (entries: any[]) => void) {
        resizeObserverCallback = callback;
    }

    observe = mockObserve;
    disconnect = mockDisconnect;
}

Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: ResizeObserverMock,
});

jest.spyOn(global, 'requestAnimationFrame').mockImplementation(cb => {
    cb(performance.now());

    return 0;
});

const children = <div data-tid='dropdown-content' />;
const defaultStyleValue = `height: 0px; overflow: hidden; transition: height ${settings.Animation.DurationMs}ms ease; --searchpod-border-width: ${SEARCHPOD_BORDER_WIDTH}px;`;

let mockStores;
let mockProps: ISearchBarAnimatedDropdownProps;

const createMockProps = (): ISearchBarAnimatedDropdownProps => ({
    isOpened: true,
    selectedDropdown: SearchBarDropdown.When,
});

describe('SearchBarAnimatedDropdown', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({ searchStore: { errorMessages: null } });
        mockIsBackend = false;
    });

    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it('should render children opened', () => {
        render(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
        expect(screen.getByTestId('search-bar-animated-dropdown-wrapper')).toHaveAttribute('style', defaultStyleValue);
    });

    it('should remove children after closing', () => {
        const { rerender, container } = render(
            <SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>,
        );

        expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();

        mockProps.isOpened = false;
        rerender(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        jest.runAllTimers();

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render on backend', () => {
        mockIsBackend = true;
        const { container } = render(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isOpened is false', () => {
        mockIsBackend = true;
        mockProps.isOpened = false;
        const { container } = render(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        expect(container).toBeEmptyDOMElement();
    });

    it('should update container height when content resizes (isOpenedRef && contentRef check)', () => {
        render(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        const contentElement = screen.getByTestId('search-bar-animated-dropdown-content');
        const wrapperElement = screen.getByTestId('search-bar-animated-dropdown-wrapper');

        // mock the offsetHeight property
        Object.defineProperty(contentElement, 'offsetHeight', {
            configurable: true,
            value: 500,
        });

        // simulate changing size DOM event
        act(() => {
            if (resizeObserverCallback) {
                resizeObserverCallback([]);
            }
        });

        expect(wrapperElement).toHaveStyle('height: 500px');
    });

    it('should close without transition when another dropdown is opened', () => {
        const { rerender } = render(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        expect(screen.getByTestId('search-bar-animated-dropdown-wrapper')).toHaveAttribute('style', defaultStyleValue);

        mockProps.selectedDropdown = SearchBarDropdown.Who;
        mockProps.isOpened = false;
        rerender(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        expect(screen.getByTestId('search-bar-animated-dropdown-wrapper')).toHaveAttribute(
            'style',
            `height: 0px; overflow: hidden; transition: none; --searchpod-border-width: ${SEARCHPOD_BORDER_WIDTH}px;`,
        );
    });

    it('should close with transition when dropdown is closed without opening another one', () => {
        const { rerender } = render(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        expect(screen.getByTestId('search-bar-animated-dropdown-wrapper')).toHaveAttribute('style', defaultStyleValue);

        mockProps.selectedDropdown = null;
        mockProps.isOpened = false;
        rerender(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        expect(screen.getByTestId('search-bar-animated-dropdown-wrapper')).toHaveAttribute('style', defaultStyleValue);
    });

    it('should call observe when dropdown is opened', async () => {
        render(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        await waitFor(() => {
            expect(mockObserve).toHaveBeenCalled();
        });
    });

    it('should call disconnect when dropdown is closed', async () => {
        const { rerender } = render(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        await waitFor(() => {
            expect(mockObserve).toHaveBeenCalled();
        });

        mockProps.isOpened = false;
        rerender(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        jest.runAllTimers();

        await waitFor(() => {
            expect(mockDisconnect).toHaveBeenCalled();
        });
    });

    it('should cleanup observer and set isVisible to false on unmount', async () => {
        const { unmount, container } = render(
            <SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>,
        );

        await waitFor(() => {
            expect(mockObserve).toHaveBeenCalled();
        });

        unmount();

        await waitFor(() => {
            expect(mockDisconnect).toHaveBeenCalled();
        });
        expect(container).toBeEmptyDOMElement();
    });

    it('should disconnect observer when visibility turns off (!isVisible check)', () => {
        const { rerender } = render(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        expect(mockObserve).toHaveBeenCalled();
        mockDisconnect.mockClear();

        mockProps.isOpened = false;

        rerender(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

        act(() => {
            jest.runAllTimers();
        });

        expect(mockDisconnect).toHaveBeenCalled();
    });

    describe('updateMaxHeight', () => {
        const mockWindowInnerHeight = 1000;
        const mockTopPosition = 100;
        const mockValuesElPaddingBottom = 15;

        const stickyBox = document.createElement('div');
        stickyBox.setAttribute('id', SEARCHBAR_STICKY_BOX_ID);
        document.body.appendChild(stickyBox);

        beforeEach(() => {
            Object.defineProperty(window, 'innerHeight', {
                writable: true,
                configurable: true,
                value: mockWindowInnerHeight,
            });

            jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
                top: mockTopPosition,
                bottom: 0,
                left: 0,
                right: 0,
                width: 0,
                height: 0,
                x: 0,
                y: 0,
                toJSON: () => '',
            });

            jest.spyOn(window, 'getComputedStyle').mockImplementation(
                () =>
                    ({
                        paddingBottom: `${mockValuesElPaddingBottom}`,
                    } as CSSStyleDeclaration),
            );
        });

        it('should correctly calculate and pass maxContainerHeight from updateMaxHeight', () => {
            render(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

            const expectedMaxHeight =
                mockWindowInnerHeight -
                mockTopPosition -
                mockValuesElPaddingBottom -
                SEARCHPOD_BORDER_WIDTH -
                DEFAULT_INDENT_BOTTOM;

            expect(screen.getByTestId('search-bar-animated-dropdown-content').style.maxHeight).toBe(
                `${expectedMaxHeight}px`,
            );
        });

        it('should observe the sticky box parent element to detect layout shifts', async () => {
            render(<SearchBarAnimatedDropdown {...mockProps}>{children}</SearchBarAnimatedDropdown>);

            await waitFor(() => {
                expect(mockObserve).toHaveBeenCalledWith(stickyBox);
            });
        });
    });
});
