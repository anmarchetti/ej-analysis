import React from 'react';
import { render, screen } from '@testing-library/react';

import CalendarSkeleton from './CalendarSkeleton';

describe('CalendarSkeleton Component', () => {
    it('contains two Skeleton components', () => {
        render(<CalendarSkeleton />);

        const skeletons = screen.getAllByTestId('calendar-skeleton');
        expect(skeletons.length).toBe(2);
    });
});
