import React from 'react';
import { render } from '@testing-library/react';

import BoardCardSkeleton, { IBoardCardSkeletonProps } from './BoardCardSkeleton';

const createProps = () => ({
    isSelected: false,
    isSpoiler: false,
    height: 0,
    className: 'className',
});

let props: IBoardCardSkeletonProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<BoardCardSkeleton />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should standard render', () => {
        const { getByTestId } = render(<BoardCardSkeleton {...props} />);

        expect(getByTestId('board-skeleton-box')).toHaveClass('card card className');
        expect(getByTestId('board-skeleton-box')).not.toHaveClass('current spoiler');
        expect(getByTestId('board-skeleton-icon')).toHaveClass('icon');
        expect(getByTestId('board-skeleton-btn')).toHaveClass('childrenContainer shimmerBtn');
    });

    it('should contain "current" class when isSelected prop is true', () => {
        props.isSelected = true;

        const { getByTestId } = render(<BoardCardSkeleton {...props} />);

        expect(getByTestId('board-skeleton-box')).toHaveClass('current');
    });

    it('should contain "spoiler" class when isSpoiler prop is true', () => {
        props.isSpoiler = true;

        const { getByTestId } = render(<BoardCardSkeleton {...props} />);

        expect(getByTestId('board-skeleton-box')).toHaveClass('spoiler');
    });

    it('should have the height as passed in height prop', () => {
        props.height = 256;

        const { getByTestId } = render(<BoardCardSkeleton {...props} />);

        expect(getByTestId('board-skeleton-box')).toHaveStyle({ height: `${props.height}px` });
    });

    describe('linesAmount prop', () => {
        it('should render default amount if content lines', () => {
            const { getByTestId } = render(<BoardCardSkeleton {...props} />);
            expect(getByTestId('board-skeleton-content').children.length).toEqual(1);
        });

        it('should render 0 content lines', () => {
            const { getByTestId } = render(<BoardCardSkeleton {...props} linesAmount={0} />);
            expect(getByTestId('board-skeleton-content').children.length).toEqual(0);
        });

        it('should render 2 content lines', () => {
            const { getByTestId } = render(<BoardCardSkeleton {...props} linesAmount={2} />);
            expect(getByTestId('board-skeleton-content').children.length).toEqual(2);
        });
    });
});
