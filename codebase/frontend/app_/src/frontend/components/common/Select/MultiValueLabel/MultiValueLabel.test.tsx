import React from 'react';
import { render } from '@testing-library/react';

import MultiValueLabel from './MultiValueLabel';

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

describe('<MultiValueLabel />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render MultiValueLabel with label', () => {
        const { getByText } = render(<MultiValueLabel {...mockProps} />);

        expect(getByText('label')).toBeInTheDocument();
    });

    it('should NOT render children', () => {
        mockProps.children = null;
        const { queryByText } = render(<MultiValueLabel {...mockProps} />);

        expect(queryByText('label')).not.toBeInTheDocument();
    });
});
