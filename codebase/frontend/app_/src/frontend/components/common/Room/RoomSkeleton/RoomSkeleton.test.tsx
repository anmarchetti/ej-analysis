import React from 'react';
import { render } from '@testing-library/react';

import RoomSkeleton from './RoomSkeleton';

const createProps = () => ({
    isLarge: false,
    height: 0,
});

let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<RoomSkeleton />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('Card block should not contain large and selected classes when isLarge prop is false and height is undefined', () => {
        const { container } = render(<RoomSkeleton {...props} />);

        expect(container.querySelector('.card')).not.toHaveClass('large selected');
        expect(container.querySelector('.img')).not.toHaveStyle({ height: `${props.height}px` });
    });

    it('Card block should contain large and selected classes when isLarge prop is true', () => {
        props.isLarge = true;
        const { container } = render(<RoomSkeleton {...props} />);

        expect(container.querySelector('.card')).toHaveClass('large selected');
    });

    it('Image should have the height as passed in height prop', () => {
        props.height = 300;
        const { container } = render(<RoomSkeleton {...props} />);

        expect(container.querySelector('.img')).toHaveStyle({ height: `${props.height}px` });
    });

    it('Should render the correct number of shimmer lines based on contentLines prop', () => {
        props.contentLines = 3;
        const { container } = render(<RoomSkeleton {...props} />);

        expect(container.querySelectorAll('.content-line').length).toBe(props.contentLines);
    });

    it('Should apply the containerClass prop to the card container', () => {
        props.containerClass = 'custom-container-class';
        const { container } = render(<RoomSkeleton {...props} />);

        expect(container.querySelector('.card')).toHaveClass(props.containerClass);
    });

    it('Should apply the contentClassName prop to the content row', () => {
        props.contentClassName = 'custom-content-class';
        const { container } = render(<RoomSkeleton {...props} />);

        expect(container.querySelector('.row')).toHaveClass(props.contentClassName);
    });
});
