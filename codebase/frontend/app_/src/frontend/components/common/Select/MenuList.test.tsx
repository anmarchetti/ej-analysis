import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MenuList from './MenuList';

const createProps = () => ({
    selectProps: { hasOverlay: false, onOverlayClick: jest.fn() },
    getStyles: jest.fn(),
    cx: jest.fn(),
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<MenuList />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render year-dropdown__overlay when has NOT overaly', () => {
        const { container } = render(<MenuList {...mockProps} />);

        expect(container.getElementsByClassName('year-dropdown__overlay').length).toBe(0);
    });

    it('should render year-dropdown__overlay when has overaly', () => {
        mockProps.selectProps.hasOverlay = true;
        const { container } = render(<MenuList {...mockProps} />);

        expect(container.getElementsByClassName('year-dropdown__overlay').length).toBe(1);
    });

    it('should call on overlay click after click on onverlay', async () => {
        mockProps.selectProps.hasOverlay = true;
        const { container } = render(<MenuList {...mockProps} />);

        await userEvent.click(container.getElementsByClassName('year-dropdown__overlay')[0]);

        expect(mockProps.selectProps.onOverlayClick).toHaveBeenCalled();
    });
});
