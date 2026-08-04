import React from 'react';
import { render, screen } from '@testing-library/react';

import LoadingState from './LoadingState';

describe('<LoadingState />', () => {
    it('should render component', () => {
        render(<LoadingState />);

        expect(screen.getByTestId('cancel-booking-banner-loading')).not.toHaveClass('masonry');
    });

    it('should render component with masonry style', () => {
        render(<LoadingState useMasonryStyle />);

        expect(screen.getByTestId('cancel-booking-banner-loading')).toHaveClass('masonry');
    });
});
