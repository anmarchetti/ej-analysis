import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RadioButton, { IRadioButtonProps } from './RadioButton';

const resetMocks = () =>
    ({
        label: 'label',
        onChange: jest.fn(),
        checked: false,
        name: 'name',
        dataTid: 'data-tid',
        children: <div data-tid='test-children' />,
    } as IRadioButtonProps);

let mocks;

describe('<RadioButton />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should standard render', () => {
        render(<RadioButton {...mocks} />);

        expect(screen.getByTestId('data-tid')).toHaveClass('radio');
        expect(screen.getByTestId('radio-label')).toHaveTextContent('label');
        expect(screen.getByTestId('test-children')).toBeInTheDocument();
        expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('should NOT render label when it absent in props', () => {
        mocks.label = undefined;

        render(<RadioButton {...mocks} />);

        expect(screen.queryByTestId('radio-label')).not.toBeInTheDocument();
    });

    it('should render with additional classes', () => {
        mocks.checked = true;
        mocks.disabled = true;
        mocks.readOnly = true;
        mocks.pill = true;
        mocks.className = 'test-class';
        mocks.labelClass = 'test-label-class';
        mocks.value = 'value';

        render(<RadioButton {...mocks} />);

        const radio = screen.getByRole('radio');

        expect(screen.getByTestId('data-tid')).toHaveClass(
            'radio radio--disabled radio--checked radio--pill test-class',
        );
        expect(radio).toHaveAttribute('checked');
        expect(radio).toHaveAttribute('disabled');
        expect(radio).toHaveAttribute('readOnly');
        expect(radio).toHaveAttribute('value', 'value');
    });

    it('should call onChange on radio change', async () => {
        render(<RadioButton {...mocks} />);

        await userEvent.type(screen.getByRole('radio'), 'test');

        expect(mocks.onChange).toHaveBeenCalled();
    });
});
