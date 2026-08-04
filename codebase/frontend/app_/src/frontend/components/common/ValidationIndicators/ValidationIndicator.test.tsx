import React from 'react';
import { render, screen } from '@testing-library/react';

import ValidationIndicator from './ValidationIndicator';

jest.mock('frontend/components/icons-new/Tick', () => ({
    __esModule: true,
    default: () => 'SvgTick',
}));

jest.mock('frontend/components/icons-new/Cross', () => ({
    __esModule: true,
    default: () => 'SvgCross',
}));

describe('<ValidationIndicator />', () => {
    it('Should default state', () => {
        const { container } = render(<ValidationIndicator label='label' valid={null} />);

        expect(screen.getByText('label')).toBeVisible();
        expect(container.firstChild).not.toHaveClass('validation-indicator--valid validation-indicator--invalid');
    });

    it('Should valid state', () => {
        const { container } = render(<ValidationIndicator label='label' valid={true} />);

        expect(container.firstChild).toHaveClass('validation-indicator--valid');
        expect(screen.getByText('SvgTick')).toBeVisible();
    });

    it('Should invalid state', () => {
        const { container } = render(<ValidationIndicator label='label' valid={false} />);

        expect(container.firstChild).toHaveClass('validation-indicator--invalid');
        expect(screen.getByText('SvgCross')).toBeVisible();
    });
});
