import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';

import settings from 'code/settings';

import HeightAnimatedContainer, { IHeightAnimatedContainerProps } from './HeightAnimatedContainer'; // Adjust the import path if necessary

jest.useFakeTimers();

const createProps = (): IHeightAnimatedContainerProps => ({
    onEnter: jest.fn(),
    onEntered: jest.fn(),
    onExit: jest.fn(),
    onExited: jest.fn(),
    containerClasName: 'containerClasName',
});

let mockProps = createProps();

describe('HeightAnimatedContainer', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    const heightAnimationComponent = (additionalProps = {}) => (
        <HeightAnimatedContainer {...additionalProps} {...mockProps}>
            <div data-tid='content'>Test Content</div>
        </HeightAnimatedContainer>
    );

    it('should render content when isOpened is true', () => {
        render(heightAnimationComponent({ isOpened: true }));

        expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should NOT render content when isOpened is false', () => {
        render(heightAnimationComponent({ isOpened: false }));

        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('should call onEnter and onEntered props during enter transition', async () => {
        const { rerender } = render(heightAnimationComponent({ isOpened: false }));

        rerender(heightAnimationComponent({ isOpened: true }));

        await waitFor(() => {
            expect(mockProps.onEnter).toHaveBeenCalledTimes(1);
            expect(mockProps.onEntered).toHaveBeenCalledTimes(1);
        });
    });

    it('should call onExit and onExited props and update height before exit transition', async () => {
        const mockScrollHeight = 100;

        const { rerender } = render(heightAnimationComponent({ isOpened: true }));

        const container = screen.getByTestId('animated-container');
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
            configurable: true,
            value: mockScrollHeight,
        });

        rerender(heightAnimationComponent({ isOpened: false }));

        act(() => {
            jest.advanceTimersByTime(0);
        });

        expect(container).toHaveStyle({ height: `${mockScrollHeight}px` });

        act(() => {
            jest.advanceTimersByTime(1);
        });

        expect(container).toHaveStyle({ height: '0px' });

        await waitFor(() => {
            expect(mockProps.onExit).toHaveBeenCalledTimes(1);
            expect(mockProps.onExited).toHaveBeenCalledTimes(1);
        });
    });

    it('should apply the correct className during transition', async () => {
        const mockScrollHeight = 200;
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
            configurable: true,
            value: mockScrollHeight,
        });
        const { rerender } = render(heightAnimationComponent({ isOpened: true }));

        expect(screen.getByTestId('animated-container')).toHaveClass('animation--height container containerClasName');
        expect(screen.getByTestId('animated-container')).not.toHaveClass('overflowHidden');

        rerender(heightAnimationComponent({ isOpened: false }));

        await waitFor(() => {
            expect(screen.getByTestId('animated-container')).toHaveClass('overflowHidden');
        });
    });

    it('should update height dynamically', async () => {
        const mockScrollHeight = 200;
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
            configurable: true,
            value: mockScrollHeight,
        });

        const { rerender } = render(heightAnimationComponent({ isOpened: true }));

        expect(screen.getByTestId('animated-container')).not.toHaveAttribute('height');

        rerender(heightAnimationComponent({ isOpened: false }));
        expect(screen.getByTestId('animated-container')).toHaveStyle({ height: `${mockScrollHeight}px` });

        await waitFor(() => {
            expect(screen.getByTestId('animated-container')).toHaveStyle({ height: `0px` });
        });
    });

    it('should use the default timeout if none is provided', () => {
        jest.useFakeTimers();
        jest.spyOn(global, 'setTimeout');

        const { rerender } = render(heightAnimationComponent({ isOpened: true, timeout: undefined }));

        rerender(heightAnimationComponent({ isOpened: false, timeout: undefined }));

        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), settings.Animation.DurationMs);
    });

    it('should use provided timeout', () => {
        jest.useFakeTimers();
        jest.spyOn(global, 'setTimeout');

        const { rerender } = render(heightAnimationComponent({ isOpened: true, timeout: 100 }));

        rerender(heightAnimationComponent({ isOpened: false, timeout: 1000 }));

        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it('should handle custom enter/exit props', () => {
        const { rerender } = render(heightAnimationComponent({ isOpened: true, enter: false, exit: false }));

        rerender(heightAnimationComponent({ isOpened: false, enter: false, exit: false }));

        expect(mockProps.onExit).not.toHaveBeenCalled();

        rerender(heightAnimationComponent({ isOpened: true, enter: false, exit: false }));

        expect(mockProps.onEnter).not.toHaveBeenCalled();
    });

    it('should mount on enter and unmount on exit when keepMounted is false', () => {
        const { rerender } = render(heightAnimationComponent({ isOpened: false, keepMounted: false }));

        expect(screen.queryByTestId('content')).not.toBeInTheDocument();

        rerender(heightAnimationComponent({ isOpened: true, keepMounted: false }));

        // Content should be mounted after transition
        expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should keep component mounted when keepMounted is true', () => {
        const { rerender } = render(heightAnimationComponent({ isOpened: false, keepMounted: true }));

        expect(screen.getByTestId('content')).toBeInTheDocument();

        rerender(heightAnimationComponent({ isOpened: true, keepMounted: true }));

        expect(screen.getByTestId('content')).toBeInTheDocument();
    });
});
