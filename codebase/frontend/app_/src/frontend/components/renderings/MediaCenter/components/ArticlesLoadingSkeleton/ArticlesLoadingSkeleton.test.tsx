import React from 'react';
import { render, screen } from '@testing-library/react';

import { ArticlesLoadingSkeleton } from './ArticlesLoadingSkeleton';

describe('<ArticlesLoadingSkeleton />', () => {
    it('should render ArticlesLoadingSkeleton', () => {
        const { container } = render(<ArticlesLoadingSkeleton />);

        expect(screen.getByTestId('articles-loading-skeleton')).toBeInTheDocument();
        expect(container.querySelectorAll('.placeholder-shimmer')).toHaveLength(4);
    });
});
