import React from 'react';
import { render, screen } from '@testing-library/react';

import AmendTransfersShimmer from './AmendTransfersShimmer';

jest.mock('frontend/components/common/BoardCardSkeleton/BoardCardSkeleton', () => ({
    __esModule: true,
    default: () => <div data-tid='board-skeleton' />,
}));

describe('<AmendTransfersShimmer />', () => {
    it('should render component', () => {
        render(<AmendTransfersShimmer />);

        expect(screen.getAllByTestId('board-skeleton')).toHaveLength(3);
        expect(screen.getByTestId('amend-transfer-skeleton')).toBeInTheDocument();
    });
});
