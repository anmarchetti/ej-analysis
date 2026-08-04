import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockTooltipContextData } from 'frontend/__mocks__/tooltip';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import * as utils from 'frontend/components/common/Tooltip/Tooltip.utils';

import TooltipTrigger from './TooltipTrigger';

jest.mock('frontend/components/icons/InfoCircle', () => ({
    __esModule: true,
    default: () => <div data-tid='info-circle' />,
}));

const mockUseTooltipContext = jest.spyOn(utils, 'useTooltipContext').mockReturnValue(mockTooltipContextData);

const child = <button data-tid='button'>hover me</button>;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({
        layoutStore: {
            getPhrase: jest.fn(p => p),
        },
    }),
}));

describe('TooltipTrigger', () => {
    it('should render default icon when children are undefined', () => {
        const { container, rerender } = render(<TooltipTrigger />);

        const button = container.querySelector('button');
        const icon = screen.getByTestId('info-circle');

        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('data-state', 'closed');
        expect(button).toHaveAttribute('aria-label', SitecoreDictionary.AccessibilityAriaLabelsTooltipTrigger);
        expect(button).toHaveAttribute('type', 'button');
        expect(icon).toBeInTheDocument();
        expect(mockTooltipContextData.getReferenceProps).toHaveBeenCalledWith({});

        mockUseTooltipContext.mockReturnValueOnce({ ...mockTooltipContextData, open: true });

        rerender(<TooltipTrigger />);

        expect(button).toHaveAttribute('data-state', 'open');
        expect(button).toHaveAttribute('aria-describedby', mockTooltipContextData.tooltipId);
    });

    it('should render children with correct props', () => {
        const { rerender } = render(<TooltipTrigger>{child}</TooltipTrigger>);

        const button = screen.getByTestId('button');

        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('data-state', 'closed');

        expect(mockTooltipContextData.getReferenceProps).toHaveBeenCalledWith({
            children: 'hover me',
            'data-state': 'closed',
            'data-tid': 'button',
            ref: expect.any(Function),
            'aria-describedby': mockTooltipContextData.tooltipId,
        });

        mockUseTooltipContext.mockReturnValueOnce({ ...mockTooltipContextData, open: true });

        rerender(<TooltipTrigger />);

        expect(button).toHaveAttribute('data-state', 'open');
        expect(button).toHaveAttribute('aria-describedby', mockTooltipContextData.tooltipId);
    });
});
