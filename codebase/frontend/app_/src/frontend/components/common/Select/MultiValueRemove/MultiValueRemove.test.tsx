import React from 'react';
import { render } from '@testing-library/react';

import MultiValueRemove from './MultiValueRemove';

const createProps = () => ({
    isSelected: false,
    innerProps: {},
    getStyles: jest.fn(),
    cx: jest.fn(),
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/components/icons-new/Cross', () => () => <div data-tid='cross' />);

describe('<MultiValueRemove />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render clear Indicator', () => {
        const { getByTestId } = render(<MultiValueRemove {...mockProps} />);

        expect(getByTestId('cross')).toBeInTheDocument();
    });
});
