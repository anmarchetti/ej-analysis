import React from 'react';
import { render } from '@testing-library/react';

import DropdownIndicator from './DropdownIndicator';

const createProps = () => ({
    isSelected: false,
    children: 'label',
    innerProps: {},
    getStyles: jest.fn(),
    cx: jest.fn(),
    isMulti: false,
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/components/icons-new/ChevronDown', () => () => <div data-tid='chevron-down' />);

describe('<DropdownIndicator />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render IconChevronDown', () => {
        const { getByTestId } = render(<DropdownIndicator {...mockProps} />);

        expect(getByTestId('chevron-down')).toBeInTheDocument();
    });

    it('should render DropdownIndicator without multi class when isMulti is false', () => {
        const { container } = render(<DropdownIndicator {...mockProps} />);

        expect(container.getElementsByClassName('multiDropdownIndicator').length).toBe(0);
    });

    it('should render DropdownIndicator with multi class', () => {
        mockProps.isMulti = true;
        const { container } = render(<DropdownIndicator {...mockProps} />);

        expect(container.getElementsByClassName('multiDropdownIndicator').length).toBe(1);
    });
});
