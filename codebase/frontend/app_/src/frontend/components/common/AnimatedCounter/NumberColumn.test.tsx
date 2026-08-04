import * as React from 'react';
import { render, screen } from '@testing-library/react';

import NumberColumn from './NumberColumn';

const props = {
    digit: 3,
    duration: 0.3,
    fontSize: '18px',
    lineHeight: '24px',
};

describe('<NumberColumn />', () => {
    it('should be rendered', () => {
        const { container } = render(<NumberColumn {...props} />);

        expect(container.querySelector('.wrapper')).toBeInTheDocument();
        expect(container.querySelectorAll('.digit')).toHaveLength(10);
        expect(screen.getByTestId('selected-digit')).toBeInTheDocument();
        expect(container.querySelector('.placeholder')).toBeInTheDocument();
    });
});
