import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { STICKY_BOX_ID } from 'frontend/components/common/StickyBox';

import StickyBoxDynamicHeight, { IStickyBoxDynamicHeightProps } from './StickyBoxDynamicHeight';

const createProps = (): IStickyBoxDynamicHeightProps => ({
    render: jest.fn(resetHeight => <div data-tid='test-render' onClick={resetHeight} />),
});

let mockProps: IStickyBoxDynamicHeightProps;

describe('<StickyBoxDynamicHeight />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component with children', () => {
        render(<StickyBoxDynamicHeight {...mockProps} />);

        expect(screen.getByTestId('sticky-box-dynamic')).toBeInTheDocument();
        expect(screen.getByTestId('test-render')).toBeInTheDocument();
    });

    it('should have sticky-box id', () => {
        render(<StickyBoxDynamicHeight {...mockProps} />);

        expect(screen.getByTestId('sticky-box-dynamic')).toHaveAttribute('id', STICKY_BOX_ID);
    });

    it('should set height and reset it when freezeHeight and resetHeight are called in render component', () => {
        render(<StickyBoxDynamicHeight {...mockProps} />);

        const wrapper = screen.getByTestId('sticky-box-dynamic');
        jest.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
            top: 0,
            height: 150,
        } as DOMRect);

        //calls freezeHeight after component is mount
        act(() => {
            (mockProps.render as jest.Mock).mock.calls[0][1]();
        });

        expect(wrapper.style.height).toBe('150px');

        fireEvent.click(screen.getByTestId('test-render'));

        expect(wrapper.style.height).toBe('auto');
    });

    it('should call freezeHeight and set auto height when sticky box is not at the top', () => {
        render(<StickyBoxDynamicHeight {...mockProps} />);

        const wrapper = screen.getByTestId('sticky-box-dynamic');
        jest.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
            top: 100,
            height: 150,
        } as DOMRect);

        //calls freezeHeight after component is mount
        act(() => {
            (mockProps.render as jest.Mock).mock.calls[0][1]();
        });

        expect(wrapper.style.height).toBe('auto');
    });
});
