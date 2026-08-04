import React from 'react';
import { render } from '@testing-library/react';

import OtherRoutesSkeleton from './OtherRoutesSkeleton';

describe('<OtherRoutesSkeleton />', () => {
    it('should render correctly on desktop', () => {
        const { container } = render(<OtherRoutesSkeleton />);
        const rows = container.getElementsByClassName('table-row');

        expect(rows).toHaveLength(3);
        expect(rows[0]).not.toHaveClass('mobile');
        expect(rows[0].getElementsByClassName('table-col placeholder-shimmer')).toHaveLength(6);
    });

    it('should render correctly on mobile', () => {
        const { container } = render(<OtherRoutesSkeleton isMobile />);
        const rows = container.getElementsByClassName('table-row');

        expect(rows).toHaveLength(3);
        expect(rows[0]).toHaveClass('mobile');
        expect(rows[0].getElementsByClassName('table-col placeholder-shimmer')).toHaveLength(2);
    });
});
