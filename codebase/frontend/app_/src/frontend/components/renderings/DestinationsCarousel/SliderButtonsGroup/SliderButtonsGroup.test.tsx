import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import SliderButtonsGroup from './SliderButtonsGroup';

const createProps = () => ({
    next: jest.fn(),
    previous: jest.fn(),
});

let mockProps = createProps();

const mockSliderNavButtonComponent = jest.fn();
jest.mock('frontend/components/common/SliderNavButton', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockSliderNavButtonComponent(props);

        return <div data-tid='slider-nav-button' onClick={onClick} />;
    },
}));

describe('<SliderButtonsGroup />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('Should render SliderButtonsGroup', () => {
        render(<SliderButtonsGroup {...mockProps} />);
        expect(screen.getAllByTestId('slider-nav-button').length).toBe(2);
    });

    it('Handles onClick event', () => {
        render(<SliderButtonsGroup {...mockProps} />);
        const buttons = screen.getAllByTestId('slider-nav-button');

        fireEvent.click(buttons[0]);
        expect(mockProps.previous).toHaveBeenCalled();

        fireEvent.click(buttons[1]);
        expect(mockProps.next).toHaveBeenCalled();
    });
});
