import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { tabAccordionItems } from './__mocks__/tabAccordionItems';
import TabAccordion, { ITabAccordionProps } from './TabAccordion';

const createProps = (): ITabAccordionProps => ({
    items: tabAccordionItems,
    renderContent: jest.fn(),
    onTabClick: jest.fn(),
    scrollIntoView: false,
    tabAccordionClassName: 'tabAccordionClassName',
    tabCollapseBtnClassName: 'tabCollapseBtnClassName',
    tabCollapseBtnSelectedClassName: 'tabCollapseBtnSelectedClassName',
    tabToggleClassName: 'tabToggleClassName',
    tabToggleSelectedClassName: 'tabToggleSelectedClassName',
});

let mockProps = createProps();

const mockTabAccordionCollapseProps = jest.fn();
jest.mock('./components/TabAccordionCollapse/TabAccordionCollapse', () => ({
    __esModule: true,
    default: props => {
        mockTabAccordionCollapseProps(props);

        return (
            <div data-tid={`tab-accordion-collapse-${props.tab.id}`} onClick={() => props.onTabClick(props.tab)}>
                {props.children}
            </div>
        );
    },
}));

const mockTabAccordionToggleProps = jest.fn();
jest.mock('./components/TabAccordionToggle/TabAccordionToggle', () => ({
    __esModule: true,
    default: props => {
        mockTabAccordionToggleProps(props);

        return (
            <div data-tid={`tab-accordion-toggle-${props.tab.id}`} onClick={() => props.onTabClick(props.tab)}>
                {props.children}
            </div>
        );
    },
}));

let mockIsMoreThenTabletScreen = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenTabletViewport: () => mockIsMoreThenTabletScreen,
}));

describe('TabAccordion', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockIsMoreThenTabletScreen = true;
    });

    it('renders standard with first tab selected by default', () => {
        render(<TabAccordion {...mockProps} />);

        expect(screen.getByTestId('tab-accordion')).toBeInTheDocument();

        tabAccordionItems.map((tab, index) => {
            expect(screen.getByTestId(`tab-accordion-toggle-${tab.id}`)).toBeInTheDocument();
            expect(mockTabAccordionToggleProps).toHaveBeenCalledWith({
                tab: tab,
                isOpened: index === 0,
                onTabClick: expect.any(Function),
                children: expect.anything(),
                tabToggleClassName: 'tabToggleClassName',
                tabToggleSelectedClassName: 'tabToggleSelectedClassName',
            });
        });

        expect(mockProps.renderContent).toHaveBeenCalledWith(tabAccordionItems[0]);
    });

    it('renders component with defaultSelectedTabId when it is provided', () => {
        mockProps.defaultSelectedTabId = tabAccordionItems[1].id;
        render(<TabAccordion {...mockProps} />);

        expect(screen.getByTestId('tab-accordion')).toBeInTheDocument();

        tabAccordionItems.map((tab, index) => {
            expect(screen.getByTestId(`tab-accordion-toggle-${tab.id}`)).toBeInTheDocument();
            expect(mockTabAccordionToggleProps).toHaveBeenCalledWith({
                tab: tab,
                isOpened: index === 1,
                onTabClick: expect.any(Function),
                children: expect.anything(),
                tabToggleClassName: 'tabToggleClassName',
                tabToggleSelectedClassName: 'tabToggleSelectedClassName',
            });
        });

        expect(mockProps.renderContent).toHaveBeenCalledWith(tabAccordionItems[1]);
    });

    it('renders component without selected tab by default on mobile', () => {
        mockIsMoreThenTabletScreen = false;
        render(<TabAccordion {...mockProps} />);

        expect(screen.getByTestId('tab-accordion')).toBeInTheDocument();

        tabAccordionItems.map(tab => {
            expect(screen.getByTestId(`tab-accordion-collapse-${tab.id}`)).toBeInTheDocument();
            expect(mockTabAccordionCollapseProps).toHaveBeenCalledWith({
                tab: tab,
                isOpened: false,
                onTabClick: expect.any(Function),
                renderContent: expect.any(Function),
                scrollIntoView: false,
                tabCollapseBtnClassName: 'tabCollapseBtnClassName',
                tabCollapseBtnSelectedClassName: 'tabCollapseBtnSelectedClassName',
            });
        });

        expect(mockProps.renderContent).not.toHaveBeenCalled();
    });

    it('selects tab and calls onTabClick prop when user press button', async () => {
        render(<TabAccordion {...mockProps} />);

        expect(screen.getByTestId(`tab-accordion-toggle-${tabAccordionItems[0].id}`)).toBeInTheDocument();

        tabAccordionItems.map((tab, index) => {
            expect(screen.getByTestId(`tab-accordion-toggle-${tab.id}`)).toBeInTheDocument();
            expect(mockTabAccordionToggleProps).toHaveBeenCalledWith({
                tab: tab,
                isOpened: index === 0,
                onTabClick: expect.any(Function),
                children: expect.anything(),
                tabToggleClassName: 'tabToggleClassName',
                tabToggleSelectedClassName: 'tabToggleSelectedClassName',
            });
        });

        await userEvent.click(screen.getByTestId(`tab-accordion-toggle-${tabAccordionItems[1].id}`));

        tabAccordionItems.map((tab, index) => {
            expect(screen.getByTestId(`tab-accordion-toggle-${tab.id}`)).toBeInTheDocument();
            expect(mockTabAccordionToggleProps).toHaveBeenCalledWith({
                tab: tab,
                isOpened: index === 1,
                onTabClick: expect.any(Function),
                children: expect.anything(),
                tabToggleClassName: 'tabToggleClassName',
                tabToggleSelectedClassName: 'tabToggleSelectedClassName',
            });
        });

        expect(mockProps.onTabClick).toHaveBeenCalledTimes(1);
    });

    it('scrolls into view selected tab when user press button', async () => {
        const scrollIntoViewMock = jest.fn();
        HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
        mockProps.scrollIntoView = true;

        render(<TabAccordion {...mockProps} />);

        await userEvent.click(screen.getByTestId(`tab-accordion-toggle-${tabAccordionItems[1].id}`));

        expect(scrollIntoViewMock).toHaveBeenCalled();
    });

    it('unselects tab when user click already selected tab on mobile', async () => {
        mockIsMoreThenTabletScreen = false;
        render(<TabAccordion {...mockProps} />);

        await userEvent.click(screen.getByTestId(`tab-accordion-collapse-${tabAccordionItems[1].id}`));

        tabAccordionItems.map((tab, index) => {
            expect(screen.getByTestId(`tab-accordion-collapse-${tab.id}`)).toBeInTheDocument();
            expect(mockTabAccordionCollapseProps).toHaveBeenCalledWith({
                tab: tab,
                isOpened: index === 1,
                onTabClick: expect.any(Function),
                renderContent: expect.any(Function),
                scrollIntoView: false,
                tabCollapseBtnClassName: 'tabCollapseBtnClassName',
                tabCollapseBtnSelectedClassName: 'tabCollapseBtnSelectedClassName',
            });
        });

        await userEvent.click(screen.getByTestId(`tab-accordion-collapse-${tabAccordionItems[1].id}`));

        tabAccordionItems.map(tab => {
            expect(screen.getByTestId(`tab-accordion-collapse-${tab.id}`)).toBeInTheDocument();
            expect(mockTabAccordionCollapseProps).toHaveBeenCalledWith({
                tab: tab,
                isOpened: false,
                onTabClick: expect.any(Function),
                renderContent: expect.any(Function),
                scrollIntoView: false,
                tabCollapseBtnClassName: 'tabCollapseBtnClassName',
                tabCollapseBtnSelectedClassName: 'tabCollapseBtnSelectedClassName',
            });
        });
    });

    it('has first tab selected and scroll into view when user change screen size from mobile to desktop', () => {
        const scrollIntoViewMock = jest.fn();
        HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
        mockProps.scrollIntoView = true;
        mockIsMoreThenTabletScreen = false;

        const { rerender } = render(<TabAccordion {...mockProps} />);

        tabAccordionItems.map(tab => {
            expect(screen.getByTestId(`tab-accordion-collapse-${tab.id}`)).toBeInTheDocument();
            expect(mockTabAccordionCollapseProps).toHaveBeenCalledWith({
                tab: tab,
                isOpened: false,
                onTabClick: expect.any(Function),
                renderContent: expect.any(Function),
                scrollIntoView: true,
                tabCollapseBtnClassName: 'tabCollapseBtnClassName',
                tabCollapseBtnSelectedClassName: 'tabCollapseBtnSelectedClassName',
            });
        });

        mockIsMoreThenTabletScreen = true;
        rerender(<TabAccordion {...mockProps} />);

        tabAccordionItems.map((tab, index) => {
            expect(screen.getByTestId(`tab-accordion-toggle-${tab.id}`)).toBeInTheDocument();
            expect(mockTabAccordionToggleProps).toHaveBeenCalledWith({
                tab: tab,
                isOpened: index === 0,
                onTabClick: expect.any(Function),
                children: expect.anything(),
                tabToggleClassName: 'tabToggleClassName',
                tabToggleSelectedClassName: 'tabToggleSelectedClassName',
            });
        });
    });

    it('does NOT have tab selected when user change screen size from desktop to mobile', () => {
        const scrollIntoViewMock = jest.fn();
        HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
        mockProps.scrollIntoView = true;
        mockIsMoreThenTabletScreen = true;

        const { rerender } = render(<TabAccordion {...mockProps} />);

        mockIsMoreThenTabletScreen = false;
        rerender(<TabAccordion {...mockProps} />);

        tabAccordionItems.map(tab => {
            expect(screen.getByTestId(`tab-accordion-collapse-${tab.id}`)).toBeInTheDocument();
            expect(mockTabAccordionCollapseProps).toHaveBeenCalledWith({
                tab: tab,
                isOpened: false,
                onTabClick: expect.any(Function),
                renderContent: expect.any(Function),
                scrollIntoView: true,
                tabCollapseBtnClassName: 'tabCollapseBtnClassName',
                tabCollapseBtnSelectedClassName: 'tabCollapseBtnSelectedClassName',
            });
        });
    });

    it('have tab selected when user selects tab on desktop and change screen size from desktop to mobile', async () => {
        const scrollIntoViewMock = jest.fn();
        HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
        mockProps.scrollIntoView = true;
        mockIsMoreThenTabletScreen = true;

        const { rerender } = render(<TabAccordion {...mockProps} />);

        await userEvent.click(screen.getByTestId(`tab-accordion-toggle-${tabAccordionItems[1].id}`));

        mockIsMoreThenTabletScreen = false;
        rerender(<TabAccordion {...mockProps} />);

        waitFor(() =>
            tabAccordionItems.map((tab, index) => {
                expect(screen.getByTestId(`tab-accordion-collapse-${tab.id}`)).toBeInTheDocument();
                expect(mockTabAccordionCollapseProps).toHaveBeenCalledWith({
                    tab: tab,
                    isOpened: index === 1,
                    onTabClick: expect.any(Function),
                    renderContent: expect.any(Function),
                    scrollIntoView: true,
                    tabCollapseBtnClassName: 'tabCollapseBtnClassName',
                    tabCollapseBtnSelectedClassName: 'tabCollapseBtnSelectedClassName',
                });
            }),
        );
    });
});
