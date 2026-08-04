import React from 'react';
import { components } from 'react-select';
import { render, screen } from '@testing-library/react';

import ValueContainer from './ValueContainer';

const createProps = () => ({
    selectProps: { placeholder: 'Placeholder' },
    children: [<p key='child1'>child1</p>, <p key='child2'>child2</p>],
    getStyles: jest.fn(),
    cx: jest.fn(),
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<ValueContainer />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render placeholder', () => {
        const { getByText } = render(<ValueContainer {...mockProps} />);

        expect(getByText('Placeholder')).toBeInTheDocument();
    });

    it('should render 2 children', () => {
        const { getByText } = render(<ValueContainer {...mockProps} />);

        expect(getByText('child1')).toBeInTheDocument();
        expect(getByText('child2')).toBeInTheDocument();
    });

    it('should NOT render child1 when it is type placeholder', () => {
        mockProps.children = [
            <components.Placeholder key='child1'>child1</components.Placeholder>,
            <p key='child2'>child2</p>,
        ];
        const { getByText, queryByText } = render(<ValueContainer {...mockProps} />);

        expect(queryByText('child1')).not.toBeInTheDocument();
        expect(getByText('child2')).toBeInTheDocument();
    });

    it('should set role and aria-describedby for Input child if it is not searchable combobox and id is react-select-..-input', () => {
        const DummyInput = props => <input {...props} />;
        DummyInput.displayName = 'DummyInput';
        mockProps.children = [<DummyInput key='dummy' id='react-select-test-id-input' />];
        mockProps.selectProps.id = 'test-id';
        mockProps.selectProps.isSearchable = false;

        render(<ValueContainer {...mockProps} />);

        expect(screen.getByRole('textbox')).toHaveAttribute(
            'aria-describedby',
            'selected-options-screen-reader-test-id',
        );
    });
});
