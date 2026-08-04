import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import AnimationTile, { IAnimationTileProps } from './AnimationTile';

import styles from './AnimationTile.module.scss';

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockFrontPanelComponent = jest.fn();
jest.mock('frontend/components/renderings/AnimationTiles/components/FrontPanel/FrontPanel', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockFrontPanelComponent(props);

        return (
            <div data-tid='front-panel'>
                <button onClick={onClick}>onClick</button>
            </div>
        );
    },
}));

const mockActivePanelComponent = jest.fn();
jest.mock('frontend/components/renderings/AnimationTiles/components/ActivePanel/ActivePanel', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockActivePanelComponent(props);

        return (
            <div data-tid='active-panel'>
                <button onClick={onClick}>onClick</button>
            </div>
        );
    },
}));

const resetMocks = (): IAnimationTileProps => ({
    item: {
        displayName: 'displayName',
        fields: {
            Title: mockSitecoreField('Title'),
            MoreText: mockSitecoreField('MoreText'),
            Icon: mockSitecoreField(mockSitecoreImageField('iconSrc')),
            Image: mockSitecoreField(mockSitecoreImageField('Image')),
            ActiveTitle: mockSitecoreField('ActiveTitle'),
            ActiveDescription: mockSitecoreField('ActiveDescription'),
            ActiveIcon: mockSitecoreField(mockSitecoreImageField('ActiveIconSrc')),
        },
    },
    dataTid: 'test-tid',
});

let mocks;

describe('<AnimationTile />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockUseMobileViewport = false;
    });

    it('should NOT render when item has no fields', () => {
        mocks.item.fields = null as any;
        const { container } = render(<AnimationTile {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render data-tid wrapper when data-tid provided', () => {
        const { container } = render(<AnimationTile {...mocks} />);

        expect(container.firstChild).toHaveAttribute('data-tid', 'test-tid');
    });

    it('should render ActivePanel', () => {
        render(<AnimationTile {...mocks} />);

        expect(screen.getByTestId('active-panel')).toBeInTheDocument();
    });

    it('should render FrontPanel', () => {
        render(<AnimationTile {...mocks} />);

        expect(screen.getByTestId('front-panel')).toBeInTheDocument();
    });

    it('should NOT render wrapperBorder class when details are NOT shown', () => {
        const { container } = render(<AnimationTile {...mocks} />);

        expect(container.getElementsByClassName(styles.wrapperBorder).length).toBe(0);
    });

    it('should toggle hideContainer prop correctly when trigger onClick prop on FrontPanel and ActivePanel', () => {
        render(<AnimationTile {...mocks} />);

        expect(screen.getByTestId('front-panel').parentElement).not.toHaveClass(styles.hideContainer);
        expect(mockActivePanelComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                hideContainer: true,
            }),
        );

        fireEvent.click(within(screen.getByTestId('front-panel')).getByRole('button', { name: 'onClick' }));

        expect(screen.getByTestId('front-panel').parentElement).toHaveClass(styles.hideContainer);
        expect(mockActivePanelComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                hideContainer: false,
            }),
        );

        fireEvent.click(within(screen.getByTestId('active-panel')).getByRole('button', { name: 'onClick' }));

        expect(screen.getByTestId('front-panel').parentElement).not.toHaveClass(styles.hideContainer);
        expect(mockActivePanelComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                hideContainer: true,
            }),
        );
    });

    it('should NOT toggle hideContainer prop when trigger onClick prop on FrontPanel on mobile', () => {
        mockUseMobileViewport = true;
        render(<AnimationTile {...mocks} />);

        expect(screen.getByTestId('front-panel').parentElement).not.toHaveClass(styles.hideContainer);
        expect(mockActivePanelComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                hideContainer: true,
            }),
        );

        fireEvent.click(within(screen.getByTestId('front-panel')).getByRole('button', { name: 'onClick' }));

        expect(screen.getByTestId('front-panel').parentElement).not.toHaveClass(styles.hideContainer);
        expect(mockActivePanelComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                hideContainer: true,
            }),
        );
    });
});
