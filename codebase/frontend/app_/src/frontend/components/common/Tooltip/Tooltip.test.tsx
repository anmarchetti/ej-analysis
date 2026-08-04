import React from 'react';
import { render, screen } from '@testing-library/react';

import Tooltip from './Tooltip';
import { TooltipContext } from './Tooltip.utils';

describe('<Tooltip />', () => {
    it('should render children correctly', () => {
        render(
            <Tooltip>
                <div data-tid='children' />
            </Tooltip>,
        );
        expect(screen.getByTestId('children')).toBeInTheDocument();
    });

    it('should provide tooltip context', () => {
        const TestComponent = () => {
            const context = React.useContext(TooltipContext);

            return context ? <div data-tid='context-provided' /> : <div data-tid='no-context' />;
        };

        render(
            <Tooltip>
                <TestComponent />
            </Tooltip>,
        );

        expect(screen.getByTestId('context-provided')).toBeInTheDocument();
    });
});
