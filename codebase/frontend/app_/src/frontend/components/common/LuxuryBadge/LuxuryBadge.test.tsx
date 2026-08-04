import React from 'react';
import { render, screen } from '@testing-library/react';

import LuxuryBadge, { ILuxuryBadgeProps } from './LuxuryBadge';

const createProps = (): ILuxuryBadgeProps => ({
    wrapperClassName: 'wrapper-class',
});

let mockProps: ILuxuryBadgeProps;

jest.mock('frontend/components/icons-new/LuxuryGradient', () => ({
    __esModule: true,
    default: () => <i data-tid='luxury' />,
}));

describe('<LuxuryBadge />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render with default props', () => {
        render(<LuxuryBadge {...mockProps} />);

        expect(screen.getByTestId('luxury-badge-icon')).toHaveClass('wrapper wrapper-class');
        expect(screen.getByTestId('luxury')).toBeInTheDocument();
    });

    it('should render without classes from props', () => {
        render(<LuxuryBadge />);

        expect(screen.getByTestId('luxury-badge-icon')).not.toHaveClass('wrapper-class');
        expect(screen.getByTestId('luxury')).toBeInTheDocument();
    });
});
