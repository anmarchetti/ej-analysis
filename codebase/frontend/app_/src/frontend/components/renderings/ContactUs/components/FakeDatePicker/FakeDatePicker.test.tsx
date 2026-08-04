import React from 'react';
import { render, screen } from '@testing-library/react';

import FakeDatePicker, { IFakeDatePickerProps } from './FakeDatePicker';

const createProps = (): IFakeDatePickerProps => ({
    label: 'label',
    value: '',
    onClick: jest.fn(),
    ariaExpanded: false,
    ariaLabelNoSelection: 'No date selected',
    ariaLabelSelectedValue: 'Selected date {value}',
    id: 'date-picker-id',
});

let mockProps = createProps();

describe('CalendarWrapper', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render correctly with NO date selected', () => {
        render(<FakeDatePicker {...mockProps} />);

        const button = screen.getByTestId('booking-dates-picker');
        expect(button).toHaveAttribute('aria-label', mockProps.ariaLabelNoSelection);
        expect(button).toHaveTextContent('');
        expect(button).toHaveAttribute('aria-expanded', mockProps.ariaExpanded.toString());

        const label = screen.getByTestId('booking-dates-picker-label');
        expect(label).toHaveTextContent(mockProps.label);
        expect(label).not.toHaveClass('floatingLabel');
        expect(label).toHaveClass('label');
    });

    it('should render correctly with date selected', () => {
        mockProps.value = '2023-01-01';
        render(<FakeDatePicker {...mockProps} />);

        const button = screen.getByTestId('booking-dates-picker');
        expect(button).toHaveAttribute('aria-label', `Selected date 2023-01-01`);
        expect(button).toHaveTextContent(mockProps.value);

        expect(screen.getByTestId('booking-dates-picker-label')).toHaveClass('label floatingLabel');
    });
});
