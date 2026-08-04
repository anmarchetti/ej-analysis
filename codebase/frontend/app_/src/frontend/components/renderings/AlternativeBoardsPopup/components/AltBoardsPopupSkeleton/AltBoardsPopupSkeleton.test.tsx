import { render, screen } from '@testing-library/react';

import AltBoardsPopupSkeleton from './AltBoardsPopupSkeleton';

jest.mock('frontend/components/common/BoardCardSkeleton/BoardCardSkeleton', () => ({
    __esModule: true,
    default: props => <div data-tid='board-card-skeleton' {...props} />,
}));

describe('<AltBoardsPopupSkeleton />', () => {
    it('should standard render', () => {
        const { container } = render(<AltBoardsPopupSkeleton />);
        const boardCardSkeletonItems = screen.getAllByTestId('board-card-skeleton');
        const placeholderShimmerItems = container.getElementsByClassName('placeholder-shimmer');

        expect(screen.getByTestId('alt-board-popup-skeleton-box')).toBeInTheDocument();
        expect(boardCardSkeletonItems[0].getAttribute('linesAmount')).toEqual('2');
        expect(boardCardSkeletonItems[1].getAttribute('linesAmount')).toEqual('0');
        expect(boardCardSkeletonItems[2].getAttribute('linesAmount')).toBeNull();
        expect(boardCardSkeletonItems[3].getAttribute('linesAmount')).toEqual('2');
        expect(placeholderShimmerItems[0]).toHaveClass('shimmerTitle');
        expect(placeholderShimmerItems[1]).toHaveClass('shimmerSubtitle');
        expect(placeholderShimmerItems[2]).toHaveClass('shimmerSubtitle');
    });
});
