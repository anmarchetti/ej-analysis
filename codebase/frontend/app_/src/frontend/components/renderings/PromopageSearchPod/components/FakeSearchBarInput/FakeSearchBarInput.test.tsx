import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import IconCalendar from 'frontend/components/icons/Calendar';

import { FakeSearchBarInput, IFakeSearchBarInputProps } from './FakeSearchBarInput';

const createProps = (): IFakeSearchBarInputProps => ({
    id: 'id',
    label: 'label',
    value: '',
    placeholder: 'placeholder',
    icon: <IconCalendar />,
    isSubmitted: false,
    onClick: jest.fn(),
});
let mockProps;

describe('<FakeSearchBarInput />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('Should standard render', () => {
        render(<FakeSearchBarInput {...mockProps} />);

        expect(screen.getByTestId('input')).toBeInTheDocument();
        expect(screen.getByTestId('text')).toBeInTheDocument();
        expect(screen.getByTestId('label')).toBeInTheDocument();
        expect(screen.queryByTestId('extra-label')).not.toBeInTheDocument();
    });

    it('Should display value instead of placeholder if value is provided', () => {
        mockProps.value = 'value';
        render(<FakeSearchBarInput {...mockProps} />);

        expect(screen.getByTestId('text')).toHaveTextContent(mockProps.value);
    });

    it('Should display submitted view when props.IsSubmitted = true', () => {
        mockProps.isSubmitted = true;
        render(<FakeSearchBarInput {...mockProps} />);

        expect(screen.getByTestId('submitted-label')).toBeInTheDocument();
        expect(screen.getByTestId('input')).toHaveClass('submitted');
        expect(screen.queryAllByTestId('label')).toHaveLength(0);
    });

    it('Should display extra label in submitted view', () => {
        mockProps.isSubmitted = true;
        mockProps.extraLabel = 'extra label';
        render(<FakeSearchBarInput {...mockProps} />);

        expect(screen.getByTestId('extra-label')).toBeInTheDocument();
        expect(screen.getByTestId('input')).toHaveClass('flexibleSubmitted');
    });

    it('Should call onClick', () => {
        render(<FakeSearchBarInput {...mockProps} />);

        fireEvent.click(screen.getByTestId('input'));
        expect(mockProps.onClick).toHaveBeenCalled();
    });
});
