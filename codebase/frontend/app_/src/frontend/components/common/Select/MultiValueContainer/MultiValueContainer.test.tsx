import React from 'react';
import { render } from '@testing-library/react';

import MultiValueContainer from './MultiValueContainer';

const createProps = () => ({
    isSelected: false,
    children: 'container',
    innerProps: {},
    getStyles: jest.fn(),
    cx: jest.fn(),
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<MultiValueContainer />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render MultiValueContainer with container', () => {
        const { getByText } = render(<MultiValueContainer {...mockProps} />);

        expect(getByText('container')).toBeInTheDocument();
    });

    it('should NOT render children', () => {
        mockProps.children = null;
        const { queryByText } = render(<MultiValueContainer {...mockProps} />);

        expect(queryByText('container')).not.toBeInTheDocument();
    });
});
