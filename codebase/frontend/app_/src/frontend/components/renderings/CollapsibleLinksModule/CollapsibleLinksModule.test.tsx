import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import {
    collapsibleLinksFieldsMock,
    collapsibleLinksParamsMock,
    mockLinksToRender,
} from './__mocks__/collapsibleLinksMocks';
import { useCollapsibleLinksByColumns } from './CollapsibleLinks.hooks';
import { CollapsibleLinksModule, TCollapsibleLinksModuleProps } from './CollapsibleLinksModule';

const createProps = (): TCollapsibleLinksModuleProps => ({
    fields: collapsibleLinksFieldsMock,
    params: collapsibleLinksParamsMock,
    rendering: { uid: '123' } as any,
});

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links'>{props.field.value}</div>;
    },
}));

const mockLinksList = jest.fn();
jest.mock('./components/LinksList/LinksList', () => ({
    __esModule: true,
    default: props => {
        mockLinksList(props);

        return <div data-tid='links-list' />;
    },
}));

const mockToggleButton = jest.fn();
jest.mock('./components/ToggleButton/ToggleButton', () => ({
    __esModule: true,
    default: ({ setIsBlockExpanded, ...props }) => {
        mockToggleButton(props);

        return (
            <div data-tid='toggle-button'>
                <button onClick={() => setIsBlockExpanded(true)}>setIsBlockExpanded</button>
            </div>
        );
    },
}));

const mockDrawer = jest.fn();
jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: props => {
        mockDrawer(props);

        return <div data-tid='drawer'>{props.children}</div>;
    },
}));

const mockText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockText(props);

        return <div data-tid='text'>{props.field.value}</div>;
    },
}));

jest.mock('./CollapsibleLinks.hooks', () => ({
    useCollapsibleLinksByColumns: jest.fn().mockReturnValue({
        links: mockLinksToRender,
        linksByColumns: [mockLinksToRender.slice(0, 3), mockLinksToRender.slice(3)],
        numberOfColumns: 2,
    }),
    useMaxVisibleLinksInColumn: jest.fn().mockReturnValue(3),
}));

let mockIsMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useXSMobileViewport: () => mockIsMobileViewport,
}));

let mockProps = createProps();

describe('<CollapsibleLinksModule />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockIsMobileViewport = false;
    });

    it('should NOT render component when no fields', () => {
        delete mockProps.fields;

        const { container } = render(<CollapsibleLinksModule {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when totalLinksNumber = 0', () => {
        (useCollapsibleLinksByColumns as any).mockReturnValueOnce({
            links: [],
            linksByColumns: [mockLinksToRender.slice(0, 3), mockLinksToRender.slice(3)],
            numberOfColumns: 2,
        });

        const { container } = render(<CollapsibleLinksModule {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render correctly with initial state', () => {
        render(<CollapsibleLinksModule {...mockProps} />);

        expect(mockText).toHaveBeenCalledWith({
            tag: collapsibleLinksParamsMock.TitleTag,
            className: 'collapsibleLinksTitle mobile-f14-desktop-f16 weight-200 position-center font-rounded',
            field: mockProps.fields?.Title,
        });
        expect(screen.getByText('Title')).toBeInTheDocument();

        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            field: mockProps.fields?.Subtitle,
        });
        expect(screen.getByText('Subtitle')).toBeInTheDocument();

        expect(screen.getAllByTestId('links-list')).toHaveLength(2);

        expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
    });

    describe('ToggleButton', () => {
        it('should not render button when totalInitialVisibleLinks === totalLinksNumber', () => {
            render(<CollapsibleLinksModule {...mockProps} />);

            expect(mockToggleButton).not.toHaveBeenCalled();
            expect(screen.queryByTestId('toggle-button')).not.toBeInTheDocument();
        });

        it('should not render button on mobile when MaxVisibleLinksOnMobile > totalLinksNumber', () => {
            mockIsMobileViewport = true;
            mockProps.params.MaxVisibleLinksOnMobile = '6';

            render(<CollapsibleLinksModule {...mockProps} />);

            expect(screen.queryByTestId('show-more')).not.toBeInTheDocument();
        });

        it('should not render button when MaxVisibleLinks > totalLinksNumber', () => {
            mockProps.params.MaxVisibleLinks = '6';

            render(<CollapsibleLinksModule {...mockProps} />);

            expect(screen.queryByTestId('show-more')).not.toBeInTheDocument();
        });

        it('should render button when MaxVisibleLinks < totalLinksNumber', () => {
            mockProps.params.MaxVisibleLinks = '4';

            render(<CollapsibleLinksModule {...mockProps} />);

            expect(screen.getByTestId('show-more')).toBeInTheDocument();
            expect(mockToggleButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    moduleTitle: mockProps.fields?.Title.value,
                    isBlockExpanded: false,
                    params: mockProps.params,
                    rendUid: mockProps.rendering.uid,
                }),
            );
            expect(within(screen.getByTestId('show-more')).getByTestId('toggle-button')).toBeInTheDocument();
        });
    });

    describe('mobile', () => {
        beforeEach(() => {
            mockProps.params.MaxVisibleLinksOnMobile = '4';
            mockIsMobileViewport = true;
        });

        it('should render standard', () => {
            render(<CollapsibleLinksModule {...mockProps} />);

            expect(mockText).toHaveBeenCalledTimes(1);
            expect(mockRichTextWithLinks).toHaveBeenCalledTimes(1);
            expect(mockToggleButton).toHaveBeenCalledTimes(1);
        });

        it('should NOT render drawer by default', () => {
            render(<CollapsibleLinksModule {...mockProps} />);

            expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
        });

        it('should render drawer after click on show more button', () => {
            render(<CollapsibleLinksModule {...mockProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'setIsBlockExpanded' }));

            const drawer = screen.getByTestId('drawer');

            expect(drawer).toBeInTheDocument();
            expect(within(drawer).getByTestId('text')).toBeInTheDocument();
            expect(within(drawer).getByTestId('rich-text-with-links')).toBeInTheDocument();
            expect(within(drawer).getByTestId('toggle-button')).toBeInTheDocument();
        });
    });
});
