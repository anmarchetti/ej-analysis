import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IRadioButtonNewProps } from './interfaces';
import RadioButtonNew from './RadioButtonNew';

import styles from './RadioButtonNew.module.scss';

const resetMocks = (): IRadioButtonNewProps => ({
    label: 'label',
    onChange: jest.fn(),
    checked: false,
    name: 'name',
    dataTid: 'data-tid',
    children: <div data-tid='test-children' />,
});

let mocks: IRadioButtonNewProps;

describe('<RadioButtonNew />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render standard radio button', () => {
        render(<RadioButtonNew {...mocks} />);

        expect(screen.getByTestId('data-tid')).toHaveClass(styles.radioButton);
        expect(screen.getByTestId('radio-label')).toHaveTextContent('label');
        expect(screen.getByTestId('test-children')).toBeInTheDocument();
        expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('should not render label when label prop is missing', () => {
        render(<RadioButtonNew {...{ ...mocks, label: undefined }} />);

        expect(screen.queryByTestId('radio-label')).not.toBeInTheDocument();
    });

    it('should apply conditional classes', () => {
        render(<RadioButtonNew {...mocks} checked disabled pill labelClass='custom-label' value='test-value' />);

        const root = screen.getByTestId('data-tid');
        const input = screen.getByRole('radio');

        expect(root).toHaveClass(styles.radioButton);
        expect(root).toHaveClass(styles.disabled);
        expect(root).toHaveClass(styles.checked);
        expect(root).toHaveClass(styles.pill);

        expect(input).toHaveAttribute('value', 'test-value');
        expect(screen.getByText('label')).toHaveClass('custom-label');
    });

    it('should call onChange when input is changed', async () => {
        render(<RadioButtonNew {...mocks} />);

        await userEvent.click(screen.getByRole('radio'));

        expect(mocks.onChange).toHaveBeenCalled();
    });
});
