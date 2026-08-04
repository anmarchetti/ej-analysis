import React from 'react';
import { render } from '@testing-library/react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import RoomSkeleton from 'frontend/components/common/Room/RoomSkeleton/RoomSkeleton';

import AmendRoomSkeleton, { DESKTOP_HEIGHT, MOBILE_HEIGHT } from './AmendRoomSkeleton';

jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: jest.fn(),
}));

jest.mock('frontend/components/common/Room/RoomSkeleton/RoomSkeleton', () =>
    jest.fn(() => <div data-tid='room-skeleton' />),
);

describe('AmendRoomSkeleton', () => {
    it('should render two RoomSkeleton components', () => {
        jest.mocked(useMobileViewport).mockReturnValue(false);
        render(<AmendRoomSkeleton />);

        expect(RoomSkeleton).toHaveBeenCalledTimes(2);
        expect(RoomSkeleton).toHaveBeenCalledWith(
            {
                containerClass: 'container',
                contentClassName: 'content',
                height: DESKTOP_HEIGHT,
                contentLines: 3,
            },
            {},
        );
    });

    it('should apply correct height for mobile view', () => {
        jest.mocked(useMobileViewport).mockReturnValue(true);
        render(<AmendRoomSkeleton />);

        expect(RoomSkeleton).toHaveBeenCalledWith(
            expect.objectContaining({
                height: MOBILE_HEIGHT,
            }),
            {},
        );
    });

    it('should render the shimmer divider', () => {
        (useMobileViewport as jest.Mock).mockReturnValue(false);
        const { container } = render(<AmendRoomSkeleton />);
        const shimmerDivider = container.querySelector('.placeholder-shimmer');
        expect(shimmerDivider).toBeInTheDocument();
    });
});
