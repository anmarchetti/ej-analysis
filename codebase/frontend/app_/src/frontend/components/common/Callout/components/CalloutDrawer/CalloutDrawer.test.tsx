import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import CalloutDrawer, { ICalloutDrawerProps } from './CalloutDrawer';

expect.extend(toHaveNoViolations);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return (
            <button data-tid='button' onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

const mockFloatingPopup = jest.fn();
jest.mock('frontend/components/common/FloatingPopup/FloatingPopup', () => ({
    __esModule: true,
    default: ({ children, footerContent, ...props }) => {
        mockFloatingPopup(props);

        return (
            <div data-tid='floating-popup'>
                {children}
                {footerContent}
            </div>
        );
    },
}));

const mockSwipeableContent = jest.fn();
jest.mock('frontend/components/common/FloatingPopup/components/SwipeableContent/SwipeableContent', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockSwipeableContent(props);

        return <div data-tid='swipeable-content'>{children}</div>;
    },
}));

const mockText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockText(props);

        return <div data-tid='text' />;
    },
}));

const createMockProps = (): ICalloutDrawerProps => ({
    onClose: jest.fn(),
    title: mockSitecoreField('Drawer Title'),
    titleClassName: 'titleClassName',
    footerClassName: 'footerClassName',
});

let mockProps;
let mockStores;

describe('<CalloutDrawer />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores();
    });

    it('Should render content', () => {
        render(
            <CalloutDrawer {...mockProps}>
                <div>Drawer content</div>
            </CalloutDrawer>,
        );

        expect(screen.getByTestId('floating-popup')).toBeInTheDocument();
        expect(mockFloatingPopup).toHaveBeenCalledWith({
            footerClass: 'footer footerClassName',
            swipeable: true,
            onClose: expect.any(Function),
        });

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: expect.any(Function),
            children: SitecoreDictionary.GlobalsButtonsClose,
            isFullWidth: true,
            isOutlined: undefined,
            className: '',
        });

        expect(screen.getByTestId('swipeable-content')).toBeInTheDocument();
        expect(mockSwipeableContent).toHaveBeenCalled();

        expect(screen.getByTestId('text')).toBeInTheDocument();
        expect(mockText).toHaveBeenCalledWith({
            field: mockProps.title,
            tag: 'h3',
            className: 'drawerTitle titleClassName',
            ['data-tid']: 'callout-drawer-title',
        });

        expect(screen.getByText('Drawer content')).toBeInTheDocument();
    });

    it('Clicking close button should call onClose', async () => {
        render(<CalloutDrawer {...mockProps} />);

        const closeButton = screen.getByTestId('button');
        await userEvent.click(closeButton);

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('Should render outlined button when isCTAOutlined is true', () => {
        mockProps.isCTAOutlined = true;

        render(<CalloutDrawer {...mockProps} />);

        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isOutlined: true,
                className: 'outlined',
            }),
        );
    });

    it('Should not render outlined button when isCTAOutlined is false', () => {
        mockProps.isCTAOutlined = false;

        render(<CalloutDrawer {...mockProps} />);

        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isOutlined: false,
                className: '',
            }),
        );
    });

    describe('Accessibility', () => {
        it('Should pass accessibility', async () => {
            const { container } = render(<CalloutDrawer {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
