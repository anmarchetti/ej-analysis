import React, { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import CarouselWrapper, { TCarouselRef } from './CarouselWrapper';
import { updateFocusableElements } from './CarouselWrapper.utils';

const mockCarouselProps = jest.fn();
const mockGoToSlide = jest.fn();
jest.mock('react-multi-carousel', () => {
    const React = jest.requireActual('react');
    const { forwardRef, useImperativeHandle, useRef } = React;

    return {
        __esModule: true,
        default: forwardRef((props: any, ref: any) => {
            const localRef = useRef();

            useImperativeHandle(ref, () => ({
                goToSlide: mockGoToSlide,
                state: { currentSlide: 0 },
                containerRef: {
                    current: {
                        querySelectorAll: jest.fn(() => []),
                    },
                },
            }));

            mockCarouselProps(props);

            return (
                <div data-tid='carousel' ref={localRef}>
                    {props.children}
                    <button onClick={props.afterChange} data-tid='change-slide' />
                </div>
            );
        }),
    };
});

jest.mock('./CarouselWrapper.utils', () => ({
    updateFocusableElements: jest.fn(),
}));

let mockProps;
const createMockProps = () => ({
    afterChange: jest.fn(),
    responsive: {},
    ref: createRef<TCarouselRef>(),
    className: 'test-class',
});

describe('CarouselWrapper', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should pass props to carousel and render children', () => {
        render(
            <CarouselWrapper {...mockProps}>
                <div data-tid='children' />
            </CarouselWrapper>,
        );

        expect(mockCarouselProps).toHaveBeenCalledWith(
            expect.objectContaining({
                responsive: {},
                className: 'carousel test-class',
            }),
        );
        expect(screen.getByTestId('children')).toBeInTheDocument();
    });

    it('should call updateFocusableElements on mount', () => {
        render(
            <CarouselWrapper {...mockProps}>
                <button key='1' aria-hidden={false} data-tid='slide-1'>
                    Slide 1
                </button>
                <button key='2' aria-hidden={true} data-tid='slide-2'>
                    Slide 2
                </button>
            </CarouselWrapper>,
        );

        jest.runAllTimers();

        expect(updateFocusableElements).toHaveBeenCalledTimes(1);
    });

    it('should call updateFocusableElements when children are changed', () => {
        const { rerender } = render(
            <CarouselWrapper {...mockProps}>
                <button key='0' data-tid='slide-0' />
            </CarouselWrapper>,
        );

        rerender(
            <CarouselWrapper {...mockProps}>
                <button key='1' data-tid='slide-1' />
                <button key='2' data-tid='slide-2' />
            </CarouselWrapper>,
        );

        jest.runAllTimers();

        // first call on mount and second call on children change
        expect(updateFocusableElements).toHaveBeenCalledTimes(2);
    });

    it('should call updateFocusableElements and afterChange from props after changing active slide', () => {
        render(
            <CarouselWrapper {...mockProps}>
                <button key='0' data-tid='slide-0' />
            </CarouselWrapper>,
        );

        fireEvent.click(screen.getByTestId('change-slide'));

        jest.runAllTimers();

        // first call on mount and second call on afterChange
        expect(updateFocusableElements).toHaveBeenCalledTimes(2);
        expect(mockProps.afterChange).toHaveBeenCalled();
    });

    it('should call goToSlide with 0 on mount when initialSlide is NOT provided', () => {
        render(<CarouselWrapper {...mockProps} />);

        expect(mockGoToSlide).toHaveBeenCalledWith(0);
    });

    it('should call goToSlide with initialSlide from props', () => {
        mockProps.initialSlide = 2;

        const { rerender } = render(<CarouselWrapper {...mockProps} />);

        expect(mockGoToSlide).toHaveBeenCalledWith(2);

        mockProps.initialSlide = 3;

        rerender(<CarouselWrapper {...mockProps} />);

        expect(mockGoToSlide).toHaveBeenCalledWith(3);
    });
});
