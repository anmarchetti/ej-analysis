import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IValidationError } from 'models/data/validation/IValidationError';

import ValidatableFieldNew from './ValidatableFieldNew';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;

describe('<ValidatableFieldNew />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('should render correctly with default props', () => {
        const { container } = render(
            <ValidatableFieldNew id='field-id' label='Field Label' errors={[]} onChange={jest.fn()} />,
        );

        expect(container).not.toBeEmptyDOMElement();
    });

    it('should display error message when there are validation errors', () => {
        render(
            <ValidatableFieldNew
                id='field-id'
                label='Field Label'
                errors={[{ errorMessage: 'Error message' }] as unknown as IValidationError[]}
                onChange={jest.fn()}
            />,
        );

        const input = screen.getByTestId('validatable-field-input');

        if (input) {
            fireEvent.focus(input);
            fireEvent.blur(input);
        }

        expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should show valid icon when the field is valid', () => {
        const { container } = render(
            <ValidatableFieldNew
                id='field-id'
                label='Field Label'
                errors={[]}
                value='Valid value'
                onChange={jest.fn()}
                disabled
            />,
        );

        expect(container.firstChild).toHaveClass('disabled');
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should call onChange when input value changes', () => {
        const handleChange = jest.fn();

        render(<ValidatableFieldNew id='field-id' label='Field Label' errors={[]} onChange={handleChange} />);

        fireEvent.change(screen.getByLabelText('Field Label'), { target: { value: 'New value' } });
        expect(handleChange).toHaveBeenCalledWith('New value');
    });

    it('should update state on focus and blur events', async () => {
        const { container } = render(
            <ValidatableFieldNew id='field-id' label='Field Label' errors={[]} onChange={jest.fn()} />,
        );

        const input = screen.getByTestId('validatable-field-input');

        if (input) {
            expect(container.firstChild).toHaveClass('wrapper');
            expect(container.firstChild).not.toHaveClass('active', 'focused', 'error', 'disabled');

            fireEvent.focus(input);

            expect(container.firstChild).toHaveClass('wrapper', 'active', 'focused');
            expect(container.firstChild).not.toHaveClass('error', 'disabled');

            fireEvent.blur(input);

            expect(container.firstChild).toHaveClass('wrapper', 'active');
            expect(container.firstChild).not.toHaveClass('error', 'disabled');
        }
    });
});
