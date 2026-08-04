import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import LuxuryBar from './LuxuryBar';

const mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('LuxuryBar', () => {
    const label = 'Luxury Label';

    it('should render the banner with the correct text and classes', () => {
        render(<LuxuryBar label={label} />);

        const banner = screen.getByTestId('luxury-bar');

        expect(banner).toBeInTheDocument();
        expect(banner).toHaveTextContent(label);
        expect(banner).toHaveClass('luxuryBanner', 'luxuryBar');
    });

    it('should render the SVG luxury icon', () => {
        render(<LuxuryBar label={label} />);

        const banner = screen.getByTestId('luxury-bar');
        const svg = banner.querySelector('svg');

        expect(svg).toBeInTheDocument();
    });
});
