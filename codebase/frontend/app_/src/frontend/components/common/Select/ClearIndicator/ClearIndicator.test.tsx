import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import ClearIndicator from './ClearIndicator';

const createProps = () => ({
    isSelected: false,
    children: 'label',
    innerProps: {},
    getStyles: jest.fn(),
    cx: jest.fn(),
    isMulti: false,
    selectProps: { inputValue: '', onInputChange: jest.fn(), value: 'test' },
    clearValue: jest.fn(),
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/components/icons-new/Cross', () => () => <div data-tid='cross' />);

describe('<ClearIndicator />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render the clear indicator button when onMouseDown is provided', () => {
        mockProps.onMouseDown = jest.fn();

        render(<ClearIndicator {...mockProps} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render the clear indicator icon without a button when onMouseDown is not provided', () => {
        mockProps.onMouseDown = undefined;

        render(<ClearIndicator {...mockProps} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.getByTestId('clear-indicator-icon')).toBeInTheDocument();
    });

    it('should call onMouseDown when the button is clicked', () => {
        mockProps.onMouseDown = jest.fn();

        render(<ClearIndicator {...mockProps} />);

        fireEvent.mouseDown(screen.getByRole('button'));

        expect(mockProps.onMouseDown).toHaveBeenCalled();
    });
});
