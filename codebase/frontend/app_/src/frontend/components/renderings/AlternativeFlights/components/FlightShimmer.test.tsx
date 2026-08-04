import React from 'react';
import { render, screen } from '@testing-library/react';

import { FlightShimmer } from './FlightShimmer';

describe('<FlightShimmer />', () => {
    it('should render FlightShimmer', () => {
        render(<FlightShimmer />);

        expect(screen.getByTestId('flight-shimmer')).toBeInTheDocument();
    });
});
