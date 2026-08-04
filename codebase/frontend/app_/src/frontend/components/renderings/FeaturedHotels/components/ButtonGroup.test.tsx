import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ButtonGroup } from './ButtonGroup';

const createProps = () => ({
    carouselState: { currentSlide: 1, totalItems: 3 },
    previous: jest.fn(),
    next: jest.fn(),
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ButtonGroup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render correctly with both buttons when current slide not on start or end', () => {
        render(<ButtonGroup {...mockProps} />);

        expect(screen.getByTestId('carousel-button-group')).toBeInTheDocument();
        expect(screen.getByTestId('arrow--left')).toBeInTheDocument();
        expect(screen.getByTestId('arrow--right')).toBeInTheDocument();
    });

    it('should only render the next button when on the first slide', () => {
        mockProps.carouselState.currentSlide = 0;
        render(<ButtonGroup {...mockProps} />);

        expect(screen.getByTestId('carousel-button-group')).toBeInTheDocument();
        expect(screen.queryByTestId('arrow--left')).not.toBeInTheDocument();
        expect(screen.getByTestId('arrow--right')).toBeInTheDocument();
    });

    it('should only render the previous button when on the last slide', () => {
        mockProps.carouselState.currentSlide = 2;
        render(<ButtonGroup {...mockProps} />);

        expect(screen.getByTestId('carousel-button-group')).toBeInTheDocument();
        expect(screen.getByTestId('arrow--left')).toBeInTheDocument();
        expect(screen.queryByTestId('arrow--right')).not.toBeInTheDocument();
    });

    it('should call previous function when left arrow is clicked', () => {
        render(<ButtonGroup {...mockProps} />);

        fireEvent.click(screen.getByTestId('arrow--left'));

        expect(mockProps.previous).toHaveBeenCalledTimes(1);
        expect(mockProps.next).not.toHaveBeenCalled();
    });

    it('should call next function when right arrow is clicked', () => {
        render(<ButtonGroup {...mockProps} />);

        fireEvent.click(screen.getByTestId('arrow--right'));

        expect(mockProps.next).toHaveBeenCalledTimes(1);
        expect(mockProps.previous).not.toHaveBeenCalled();
    });

    it('should have correct accessibility labels on buttons', () => {
        render(<ButtonGroup {...mockProps} />);

        expect(screen.getByTestId('arrow--left')).toHaveAttribute(
            'aria-label',
            SitecoreDictionary.AccessibilityAriaLabelsPreviousButton,
        );
        expect(screen.getByTestId('arrow--right')).toHaveAttribute(
            'aria-label',
            SitecoreDictionary.AccessibilityAriaLabelsNextButton,
        );
    });
});
