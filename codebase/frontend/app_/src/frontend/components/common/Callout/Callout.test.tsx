import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';

import Callout, { ICalloutProps } from './Callout';

expect.extend(toHaveNoViolations);

const mockCalloutContainerProps = jest.fn();
jest.mock('./components/CalloutContainer/CalloutContainer', () => ({
    __esModule: true,
    CalloutContainer: props => {
        mockCalloutContainerProps(props);

        return <div data-tid='callout-container' />;
    },
}));

const mockCalloutDrawerProps = jest.fn();
jest.mock('./components/CalloutDrawer/CalloutDrawer', () => ({
    __esModule: true,
    default: props => {
        mockCalloutDrawerProps(props);

        return <div data-tid='callout-drawer'>{props.children}</div>;
    },
}));

jest.mock('frontend/hooks/useMediaQuery');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUseMobileViewport = useMobileViewport as jest.MockedFn<typeof useMobileViewport>;

const createProps = (): ICalloutProps => ({
    content: null,
    orientation: CalloutOrientation.Top,
    position: CalloutPosition.Center,
    drawerTitleClassName: 'drawerTitleClassName',
    footerClassName: 'footerClassName',
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
});

let mockProps: ICalloutProps;
let mockStores;

describe('Callout', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockUseMobileViewport.mockReturnValue(false);
    });

    it('Should render component without CalloutContainer at the beginning', () => {
        render(<Callout {...mockProps} />);

        expect(screen.queryByTestId('callout-container')).not.toBeInTheDocument();
    });

    it('Should render component with CalloutContainer when happen click on the icon element', async () => {
        render(<Callout {...mockProps} />);

        const parentEl = screen.getByTestId('callout-parent');
        await userEvent.click(parentEl);

        expect(screen.getByTestId('callout-container')).toBeInTheDocument();
        expect(mockCalloutContainerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                containerClass: 'callout__content top center',
                onClose: expect.any(Function),
                calculateWidth: undefined,
                isCloseWhenClickOnContent: undefined,
            }),
        );

        expect(screen.getByTestId('callout-wrapper')).toHaveClass('callout__container no-print');
    });

    it('should render component without no-print class when enablePrintMode is true', async () => {
        mockProps.enablePrintMode = true;
        render(<Callout {...mockProps} />);

        expect(screen.getByTestId('callout-wrapper')).not.toHaveClass('no-print');
    });

    it('Should render component with CalloutContainer on mobile with click handlers when isShownOnHover prop was provided', async () => {
        mockProps.isShownOnHover = true;
        mockUseMobileViewport.mockReturnValue(true);
        render(<Callout {...mockProps} />);

        const parentEl = screen.getByTestId('callout-parent');
        await userEvent.click(parentEl);

        expect(screen.getByTestId('callout-container')).toBeInTheDocument();
    });

    it('Should render component with CalloutContainer when Enter key has been pressed', () => {
        render(<Callout {...mockProps} />);

        const parentEl = screen.getByTestId('callout-parent');
        fireEvent.keyDown(parentEl, { code: 'Enter' });

        expect(screen.getByTestId('callout-container')).toBeInTheDocument();
    });

    it('Should render component with CalloutContainer when Space key has been pressed', () => {
        render(<Callout {...mockProps} />);

        const parentEl = screen.getByTestId('callout-parent');
        fireEvent.keyDown(parentEl, { code: 'Space' });

        expect(screen.getByTestId('callout-container')).toBeInTheDocument();
    });

    it('Should NOT render component with CalloutContainer when NOT Enter OR Space key has been clicked', () => {
        render(<Callout {...mockProps} />);

        const parentEl = screen.getByTestId('callout-parent');
        fireEvent.keyDown(parentEl, { code: '1' });

        expect(screen.queryByTestId('callout-container')).not.toBeInTheDocument();
    });

    it('Should hide rendered CalloutContainer when onBlur event has happened', async () => {
        const user = userEvent.setup();
        render(<Callout {...mockProps} />);

        const parentEl = screen.getByTestId('callout-parent');
        fireEvent.keyDown(parentEl, { code: 'Enter' });

        expect(screen.getByTestId('callout-container')).toBeInTheDocument();

        await user.tab();
        parentEl.blur();

        waitFor(() => expect(screen.queryByTestId('callout-container')).not.toBeInTheDocument());
    });

    it('Should render component with CalloutContainer when hovering over the icon element', () => {
        mockProps.isShownOnHover = true;
        render(<Callout {...mockProps} />);

        const parentEl = screen.getByTestId('callout-parent');

        fireEvent.mouseOver(parentEl);
        expect(screen.getByTestId('callout-container')).toBeInTheDocument();

        fireEvent.mouseLeave(parentEl);
        expect(screen.queryByTestId('callout-container')).not.toBeInTheDocument();
    });

    it('Should listeners be subscribed and unsubscribed when focus and blur happen', () => {
        window.addEventListener = jest.fn();
        window.removeEventListener = jest.fn();

        render(<Callout {...mockProps} />);

        const parentEl = screen.getByTestId('callout-parent');
        parentEl.focus();

        expect(window.addEventListener).toHaveBeenCalled();

        parentEl.blur();

        expect(window.removeEventListener).toHaveBeenCalled();
    });

    it('Should render default icon as child when no children are provided', () => {
        const { container } = render(<Callout {...mockProps} />);

        expect(screen.getByTestId('callout-parent')).toBeInTheDocument();
        expect(container.querySelector('.more-info')).toBeInTheDocument();
        expect(container.querySelector('.svg-inline--fa')).toBeInTheDocument();
    });

    it('Should render with smallIcon className when isIconSmall is true', () => {
        const { container } = render(<Callout {...mockProps} isIconSmall={true} />);

        expect(container.querySelector('.smallIcon')).toBeInTheDocument();
    });

    it('Should call handleCalloutHoverState when hover overing the icon element', () => {
        mockProps.isShownOnHover = true;
        const handleCalloutHoverState = jest.fn();
        render(<Callout {...mockProps} handleCalloutHoverState={handleCalloutHoverState} />);

        const parentEl = screen.getByTestId('callout-parent');

        fireEvent.mouseOver(parentEl);
        expect(screen.getByTestId('callout-container')).toBeInTheDocument();

        fireEvent.mouseLeave(parentEl);
        expect(screen.queryByTestId('callout-container')).not.toBeInTheDocument();

        expect(handleCalloutHoverState).toHaveBeenCalled();
    });

    it('Should call handleCalloutHoverState when click icon element', () => {
        const handleCalloutHoverState = jest.fn();
        render(<Callout {...mockProps} handleCalloutHoverState={handleCalloutHoverState} />);

        const parentEl = screen.getByTestId('callout-parent');

        fireEvent.click(parentEl);
        expect(screen.getByTestId('callout-container')).toBeInTheDocument();

        expect(handleCalloutHoverState).toHaveBeenCalled();
    });

    it('Should call handleCalloutHoverState when KeyDown on icon element', async () => {
        const handleCalloutHoverState = jest.fn();
        render(<Callout {...mockProps} handleCalloutHoverState={handleCalloutHoverState} />);

        const parentEl = screen.getByTestId('callout-parent');
        fireEvent.keyDown(parentEl, { code: 'Enter' });

        expect(screen.getByTestId('callout-container')).toBeInTheDocument();
        expect(handleCalloutHoverState).toHaveBeenCalled();
    });

    describe('Drawer Variant', () => {
        const clickTooltip = async () => {
            const parentEl = screen.getByTestId('callout-parent');
            await userEvent.click(parentEl);
        };

        beforeEach(() => {
            mockProps.isDrawerVariant = true;
            mockProps.drawerTitle = mockSitecoreField('Drawer Title');
            mockProps.content = <div>Drawer Content</div>;
        });

        it('should render with CalloutDrawer if isDrawerVariant and drawerTitle provided', async () => {
            render(<Callout {...mockProps} />);

            expect(screen.queryByTestId('callout-drawer')).not.toBeInTheDocument();
            await clickTooltip();

            expect(screen.getByTestId('callout-drawer')).toBeInTheDocument();
            expect(mockCalloutDrawerProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    onClose: expect.any(Function),
                    title: mockProps.drawerTitle,
                    titleClassName: mockProps.drawerTitleClassName,
                    footerClassName: mockProps.footerClassName,
                }),
            );

            expect(screen.getByText('Drawer Content')).toBeInTheDocument();
        });

        it('should pass isCTAOutlined prop to CalloutDrawer', async () => {
            mockProps.isCTAOutlined = true;

            render(<Callout {...mockProps} />);
            await clickTooltip();

            expect(mockCalloutDrawerProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isCTAOutlined: true,
                }),
            );
        });

        it('should NOT render CalloutDrawer when isDrawerVariant is false', async () => {
            mockProps.isDrawerVariant = false;
            render(<Callout {...mockProps} />);

            await clickTooltip();

            expect(screen.queryByTestId('callout-drawer')).not.toBeInTheDocument();

            expect(screen.getByTestId('callout-container')).toBeInTheDocument();
        });

        it('should NOT render CalloutDrawer when drawerTitle is not provided', async () => {
            mockProps.drawerTitle = undefined;
            render(<Callout {...mockProps} />);

            await clickTooltip();

            expect(screen.queryByTestId('callout-drawer')).not.toBeInTheDocument();

            expect(screen.getByTestId('callout-container')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('Should pass accessibility', async () => {
            const { container } = render(<Callout {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
