import React from 'react';
import { render } from '@testing-library/react';

import InputOption from './CheckboxOption';

const createProps = () => ({
    isSelected: false,
    children: 'label',
    innerProps: {},
    getStyles: jest.fn(),
    cx: jest.fn(),
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<CheckboxOption />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render checkbox with label', () => {
        const { getByTestId } = render(<InputOption {...mockProps} />);

        expect(getByTestId('checkbox-multi-option')).toHaveTextContent('label');
    });

    it('should render checkbox without label when no children', () => {
        mockProps.children = null;
        const { getByTestId } = render(<InputOption {...mockProps} />);

        expect(getByTestId('checkbox-multi-option')).toHaveTextContent('');
    });
});
