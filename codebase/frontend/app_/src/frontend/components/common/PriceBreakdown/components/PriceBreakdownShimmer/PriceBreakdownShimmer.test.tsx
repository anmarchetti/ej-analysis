import React from 'react';
import { render, screen } from '@testing-library/react';

import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import * as utils from 'frontend/components/common/PriceBreakdown/PriceBreakdown.utils';

import PriceBreakdownShimmer from './PriceBreakdownShimmer';

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenMobileViewport: jest.fn(),
}));

describe('<PriceBreakdownShimmer />', () => {
    it('should render standard on desktop', () => {
        jest.mocked(useMoreThenMobileViewport).mockReturnValue(true);
        render(<PriceBreakdownShimmer />);

        expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-desktop-shimmer`)).toBeInTheDocument();
        expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-title-shimmer`)).toBeInTheDocument();
        expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-details-shimmer`)).toBeInTheDocument();
        expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-summary-shimmer`)).toBeInTheDocument();
    });

    it('should NOT render on mobile', () => {
        jest.mocked(useMoreThenMobileViewport).mockReturnValue(false);
        const { container } = render(<PriceBreakdownShimmer />);

        expect(container).toBeEmptyDOMElement();
    });
});
