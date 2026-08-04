import React from 'react';
import { render, screen } from '@testing-library/react';

import PriceGraphShimmer from './PriceGraphShimmer';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({
        marketStore: {
            formatMoney: jest.fn(a => `£${a}`),
        },
        priceGraphStore: { currency: 'GBP' },
    }),
}));

let props;
const createProps = () => ({ width: '200px' });

describe('<PriceGraphShimmer />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render shimmer', () => {
        const { container } = render(<PriceGraphShimmer {...props} />);

        expect(screen.getByText('£2000')).toBeInTheDocument();
        expect(screen.getByText('£1500')).toBeInTheDocument();
        expect(screen.getByText('£1000')).toBeInTheDocument();
        expect(screen.getByText('£500')).toBeInTheDocument();
        expect(screen.getByText('£0')).toBeInTheDocument();
        expect(screen.getByTestId('price-graph-shimmer')).toHaveStyle('width: 200px');

        expect(container.getElementsByClassName('bars')).toHaveLength(5);
        expect(container.getElementsByClassName('bar')).toHaveLength(15);
    });

    it('should render shimmer without width when width is NOT in props', () => {
        render(<PriceGraphShimmer />);

        expect(screen.getByTestId('price-graph-shimmer')).not.toHaveStyle('width: 200px');
    });
});
