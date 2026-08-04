import React from 'react';
import { render, screen } from '@testing-library/react';

import { IPricePillProps, PricePill } from './PricePill';

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: ({ children }) => <div data-tid='tooltip-trigger'>{children}</div>,
    TooltipContent: ({ children }) => <div data-tid='tooltip-content'>{children}</div>,
}));

const resetMocks = () =>
    ({
        children: <div data-tid='test-children' />,
        isSmall: false,
        isGreen: false,
        isBlack: false,
        isYellow: false,
        isWarning: false,
        tooltipMessage: '',
    } as IPricePillProps);

let mocks;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<PricePill />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render price pill without tooltip when tooltipMessage is NOT provided', () => {
        render(<PricePill {...mocks} />);

        expect(screen.getByTestId('price-pill')).toHaveClass('price-pill pricePill no-print');
        expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });

    it('should render price pill with all additional classes', () => {
        mocks.className = 'test-class';
        mocks.isSmall = true;
        mocks.isGreen = true;
        mocks.isBlack = true;
        mocks.isRed = true;
        mocks.isYellow = true;
        mocks.isWarning = true;
        mocks.isLightGreen = true;
        mocks.isLightRed = true;
        mocks.isFullWidth = true;
        mocks.tooltipMessage = true;
        mocks.isTooltipOnRight = true;

        render(<PricePill {...mocks} />);

        expect(screen.getByTestId('price-pill')).toHaveClass(
            'price-pill test-class no-print price-pill--small price-pill--green price-pill--black price-pill--red price-pill--yellow price-pill--warning price-pill--lightGreen price-pill--lightRed price-pill--fullWidth price-pill--tooltip-right',
        );
    });

    it('should render tooltip trigger and textContent when tooltipMessage is provided', () => {
        mocks.tooltipMessage = 'tooltipMessage';

        render(<PricePill {...mocks} />);

        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
    });
});
