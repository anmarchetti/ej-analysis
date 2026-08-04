import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FlightDurationCounter, { IFlightDurationCounterProps } from './FlightDurationCounter';

const createProps = (): IFlightDurationCounterProps => ({
    isDecreaseDisabled: false,
    isIncreaseDisabled: false,
    onChange: jest.fn(),
    step: 0.5,
    value: 2,
    ariaLabel: SitecoreDictionary.AccessibilityAriaLabelsFlightDurationMaxValue,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FlightDurationCounter />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should standard render', () => {
        render(<FlightDurationCounter {...mockProps} />);

        expect(screen.getByTestId('flight-duration-counter-button-minus')).toBeInTheDocument();
        expect(screen.getByTestId('flight-duration-counter-button-plus')).toBeInTheDocument();
        expect(screen.getByTestId('flight-duration-counter-button-minus')).toHaveAttribute(
            'aria-label',
            SitecoreDictionary.AccessibilityAriaLabelsFlightDurationCounterMinus,
        );
        expect(screen.getByTestId('flight-duration-counter-button-plus')).toHaveAttribute(
            'aria-label',
            SitecoreDictionary.AccessibilityAriaLabelsFlightDurationCounterPlus,
        );
        expect(screen.getByTestId('flight-duration-counter-value')).toHaveAttribute('value', '2');
    });

    describe('interaction with buttons', () => {
        it('should call onChange when any button is enabled', () => {
            render(<FlightDurationCounter {...mockProps} />);

            const buttons = screen.getAllByRole('button');

            fireEvent.click(buttons[0]);
            fireEvent.click(buttons[1]);

            expect(mockProps.onChange.mock.calls.length).toEqual(2);
        });

        it('should NOT call onChange when any button is disabled', () => {
            mockProps.isDecreaseDisabled = true;
            mockProps.isIncreaseDisabled = true;

            render(<FlightDurationCounter {...mockProps} />);

            const buttons = screen.getAllByRole('button');

            fireEvent.click(buttons[0]);
            fireEvent.click(buttons[1]);

            expect(mockProps.onChange.mock.calls.length).toEqual(0);
        });
    });
});
