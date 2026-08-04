import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import SliderButtonsGroup from './SliderButtonsGroup';

let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SliderButtonsGroup />', () => {
    const resetMocks = () => ({
        next: jest.fn(),
        previous: jest.fn(),
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores();
    });

    it('Should standard render', () => {
        render(<SliderButtonsGroup {...mocks} />);

        expect(screen.getByTestId('slide-button-next')).toBeInTheDocument();
        expect(screen.getByTestId('slide-button-prev')).toBeInTheDocument();
    });

    it('Should call next on next btn click', () => {
        render(<SliderButtonsGroup {...mocks} />);

        fireEvent.click(screen.getByTestId('slide-button-next'));
        expect(mocks.next).toHaveBeenCalled();
    });

    it('Should call previous on prev btn click', () => {
        render(<SliderButtonsGroup {...mocks} />);

        fireEvent.click(screen.getByTestId('slide-button-prev'));
        expect(mocks.previous).toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should render aria-label', () => {
            render(<SliderButtonsGroup {...mocks} />);

            expect(screen.getByTestId('slide-button-prev')).toHaveAttribute(
                'aria-label',
                SitecoreDictionary.AccessibilityAriaLabelsPreviousButton,
            );
            expect(screen.getByTestId('slide-button-next')).toHaveAttribute(
                'aria-label',
                SitecoreDictionary.AccessibilityAriaLabelsNextButton,
            );
        });
    });
});
