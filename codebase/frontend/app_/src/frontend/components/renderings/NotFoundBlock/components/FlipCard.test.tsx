import React from 'react';
import { render, screen } from '@testing-library/react';

import FlipCard from './FlipCard';

describe('<FlipCardLine />', () => {
    it('should render', () => {
        render(
            <FlipCard>
                <div />
            </FlipCard>,
        );

        expect(screen.getByTestId('flip-card')).toBeInTheDocument();
    });
});
