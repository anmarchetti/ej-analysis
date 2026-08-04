import React from 'react';
import { render, screen } from '@testing-library/react';

import BoardCardSkeleton from 'frontend/components/common/BoardCardSkeleton/BoardCardSkeleton';

import AmendBoardSkeleton from './AmendBoardSkeleton';

jest.mock('frontend/components/common/BoardCardSkeleton/BoardCardSkeleton', () =>
    jest.fn(() => <div data-tid='board-skeleton' />),
);

describe('AmendBoardSkeleton', () => {
    it('should render the container with the correct data-tid attribute', () => {
        render(<AmendBoardSkeleton />);
        const container = screen.getByTestId('amend-board-skeleton-box');
        expect(container).toBeInTheDocument();
    });

    it('should render two BoardCardSkeleton components', () => {
        render(<AmendBoardSkeleton />);
        expect(BoardCardSkeleton).toHaveBeenCalledTimes(2);
        expect(BoardCardSkeleton).toHaveBeenCalledWith(
            {
                bodyClassName: 'body',
                className: 'card',
                linesAmount: 2,
            },
            {},
        );
    });

    it('should render a divider with the placeholder-shimmer class', () => {
        const { container } = render(<AmendBoardSkeleton />);
        const divider = container.querySelector('.placeholder-shimmer');
        expect(divider).toBeInTheDocument();
    });
});
