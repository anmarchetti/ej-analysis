import React from 'react';
import { render } from '@testing-library/react';

import Option from './Option';

const createProps = () => ({
    isSelected: true,
    getStyles: jest.fn(),
    cx: jest.fn(),
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<Option />', () => {
    beforeEach(() => {
        mockProps = createProps();
        window.HTMLElement.prototype.scrollIntoView = jest.fn();
    });

    it('should render option', () => {
        const { container } = render(<Option {...mockProps} />);

        expect(container.getElementsByClassName('css-o8533i-Option').length).toBe(1);
    });
});
