import React from 'react';
import { render, screen } from '@testing-library/react';

import FlipCardLine from './FlipCardLine';

describe('<FlipCardLine />', () => {
    const resetMocks = () => ({
        symbols: ['t', 'e', 's', 't'],
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render', () => {
        render(<FlipCardLine {...mocks} />);

        expect(screen.getByTestId('flip-card-line')).toBeInTheDocument();
        expect(screen.getAllByTestId('flip-card')).toHaveLength(mocks.symbols.length);
    });
});
