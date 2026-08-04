import React, { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ExpandableItem, { IExpandableItemProps } from './ExpandableItem';

let mockProps: PropsWithChildren<IExpandableItemProps>;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons/ChevronRight', () => () => <div data-tid='chevron-right' />);

const mockHeightAnimation = jest.fn();
jest.mock('frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockHeightAnimation(props);

        return <div data-tid='height-animation'>{children}</div>;
    },
}));

describe('<ExpandableItem />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = {
            children: <div data-tid='children' />,
            title: 'title',
            icon: <div data-tid='icon' />,
            isDisabled: false,
            isOpened: false,
            className: 'external-class-name',
            titleWrapperClassName: 'title-wrapper-class-name',
            contentClassName: 'content-class-name',
            isShadowy: true,
            containerRef: React.createRef(),
            isLoading: false,
        };
    });

    it('Should render component in closed state', () => {
        const { container } = render(<ExpandableItem {...mockProps} />);

        const expandItem = screen.getByTestId('expand-item');
        expect(mockProps.containerRef!.current).toBe(expandItem);
        expect(expandItem).toBeInTheDocument();
        expect(expandItem).toHaveAttribute('class', 'container expand-item external-class-name shadowy');
        expect(expandItem).toHaveAttribute('data-expanded', 'false');
        expect(expandItem).not.toHaveClass('disabled');
        expect(screen.queryByTestId('expandable-item-shimmer')).not.toBeInTheDocument();

        expect(mockProps.containerRef!.current).toBe(screen.getByTestId('expand-item'));
        expect(screen.getByTestId('expand-item')).toBeInTheDocument();
        expect(screen.getByTestId('expand-item')).toHaveAttribute(
            'class',
            'container expand-item external-class-name shadowy',
        );
        expect(screen.getByTestId('expand-item')).toHaveAttribute('data-expanded', 'false');
        expect(screen.getByTestId('expand-item-icon')).toBeInTheDocument();
        expect(screen.getByTestId('expand-item-title')).toBeInTheDocument();
        expect(screen.getByTestId('expand-arrow')).toBeInTheDocument();
        expect(screen.getByTestId('expand-button')).toBeInTheDocument();
        expect(container.querySelector('.openedChildrenWrapper')).not.toBeInTheDocument();
        expect(screen.getByText('title')).toBeInTheDocument();
        expect(container.querySelector('.title-wrapper-class-name')).toBeInTheDocument();
        expect(container.querySelector('.opened')).not.toBeInTheDocument();
        expect(container.querySelector('.disabled')).not.toBeInTheDocument();

        expect(mockHeightAnimation).toHaveBeenCalledWith({
            isOpened: false,
            timeout: 500,
            containerClasName: 'animatedContainer',
        });
    });

    it('Should be rendered with custom data-tid attribute', () => {
        mockProps.dataTid = 'custom-data-tid';
        render(<ExpandableItem {...mockProps} />);

        expect(screen.getByTestId('custom-data-tid')).toBeInTheDocument();
        expect(screen.queryByTestId('expand-item')).not.toBeInTheDocument();
    });

    it('Should be opened when click on a tile and render children', async () => {
        render(<ExpandableItem {...mockProps} />);

        const button = screen.getByTestId('expand-button');
        await userEvent.click(button!);

        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId('expand-item')).toHaveAttribute(
            'class',
            'container expand-item external-class-name shadowy opened',
        );
        expect(screen.getByTestId('expand-item')).toHaveAttribute('data-expanded', 'true');
    });

    it('Should NOT be opened when click on a tile if isOpened prop has been provided', async () => {
        mockProps.children = undefined;
        mockProps.onOpen = jest.fn();
        render(<ExpandableItem {...mockProps} />);

        const button = screen.getByTestId('expand-button');
        await userEvent.click(button!);

        expect(screen.queryByTestId('children')).not.toBeInTheDocument();
        expect(mockProps.onOpen).toHaveBeenCalledWith(true);
    });

    it('Should NOT call onOpen when isDisabled', async () => {
        mockProps.isDisabled = true;
        mockProps.onOpen = jest.fn();
        render(<ExpandableItem {...mockProps} />);

        const button = screen.getByTestId('expand-button');
        await userEvent.click(button!);

        expect(mockProps.onOpen).not.toHaveBeenCalled();
    });

    it('Should NOT render an icon if it has not been provided', () => {
        mockProps.icon = undefined;
        render(<ExpandableItem {...mockProps} />);

        expect(screen.queryByTestId('expand-item-icon')).not.toBeInTheDocument();
    });

    it('Should NOT render children and caret if it has not been provided', () => {
        mockProps.children = undefined;
        mockProps.isOpened = true;
        render(<ExpandableItem {...mockProps} />);

        expect(screen.queryByTestId('children')).not.toBeInTheDocument();
        expect(screen.queryByTestId('expand-arrow')).not.toBeInTheDocument();
        expect(screen.queryByTestId('chevon-right')).not.toBeInTheDocument();
    });

    it('Should be rendered in disabled state', () => {
        mockProps.isDisabled = true;
        const { container } = render(<ExpandableItem {...mockProps} />);

        expect(container.querySelector('.disabled')).toBeInTheDocument();
    });

    it('Should render id if provided', () => {
        mockProps.id = 'test-id';
        render(<ExpandableItem {...mockProps} />);

        expect(screen.getByTestId('expand-item')).toHaveAttribute('id', 'test-id');
    });

    it('should render shimmer', () => {
        mockProps.isLoading = true;
        mockProps.id = 'test-id';

        render(<ExpandableItem {...mockProps} />);
        expect(screen.getByTestId('expand-item-shimmer')).toHaveAttribute('id', 'test-id');
        expect(screen.queryByTestId('expand-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('expand-item')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should NOT render aria-label when isDisabled is true', () => {
            mockProps.isDisabled = true;
            const { container } = render(<ExpandableItem {...mockProps} />);

            expect(container.querySelector('.meta')).not.toHaveAttribute('aria-label');
            expect(container.querySelector('.meta')).toHaveAttribute('disabled');
        });

        it('should render aria-label and tab index', () => {
            const { container } = render(<ExpandableItem {...mockProps} />);

            expect(container.querySelector('.meta')).toHaveAttribute(
                'aria-label',
                SitecoreDictionary.GlobalsButtonsExpand,
            );
            expect(container.querySelector('.meta')).toHaveAttribute('tabIndex', '0');
        });

        it('should render aria-label in opened state', () => {
            mockProps.isOpened = true;
            const { container } = render(<ExpandableItem {...mockProps} />);

            expect(container.querySelector('.meta')).toHaveAttribute(
                'aria-label',
                SitecoreDictionary.GlobalsButtonsClose,
            );
        });
    });
});
