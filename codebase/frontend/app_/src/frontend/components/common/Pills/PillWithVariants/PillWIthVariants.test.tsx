import React from 'react';
import { render, screen } from '@testing-library/react';

import { PillSizeVariants } from './PillSizeVariants';
import { PillWithVariants } from './PillWithVariants';

const mockPill = jest.fn();
jest.mock('frontend/components/common/Pills/Pill/Pill', () => ({
    __esModule: true,
    default: ({ dataTid, icon, ...props }) => {
        mockPill(props);

        return <div data-tid={dataTid}>{icon}</div>;
    },
}));

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: ({ children }) => <div data-tid='tooltip-trigger'>{children}</div>,
    TooltipContent: ({ text }) => <div data-tid='tooltip-content'>{text}</div>,
}));

const createProps = () => ({
    content: {
        icon: <div data-tid='icon' />,
        text: 'text',
        tooltipMessage: 'tooltipMessage',
    },
    tooltipClass: 'tooltip',
    pillClass: 'pill',
    dataIdPrefix: 'prefix',
});

let mockProps;

describe('<PillWithVariants />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render pill with icon when pillSize is undefined', () => {
        render(<PillWithVariants {...mockProps} />);

        expect(screen.getByTestId('prefix-pill')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(mockPill).toHaveBeenCalledWith({
            ellipsis: true,
            contentClass: 'pill',
            title: 'text',
            text: 'tooltipMessage',
            tooltipClass: 'tooltip',
        });
    });

    it('should render BigPill variant when pillSize is big', () => {
        mockProps.pillSize = PillSizeVariants.Big;

        render(<PillWithVariants {...mockProps} />);

        expect(screen.getByTestId('prefix-pill-wrapper')).toHaveClass('bigWrapper');
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-content')).toHaveTextContent('tooltipMessage');
        expect(screen.getByTestId('prefix-pill-text')).toHaveTextContent('text');
    });

    it('should render pill variant when pillSize is regular', () => {
        mockProps.pillSize = PillSizeVariants.Regular;

        render(<PillWithVariants {...mockProps} />);

        expect(screen.getByTestId('prefix-pill-wrapper')).not.toHaveClass('bigWrapper');
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-content')).toHaveTextContent('tooltipMessage');
        expect(screen.getByTestId('prefix-pill-text')).toHaveTextContent('text');
    });

    it('should render small pill variant when pillSize is small', () => {
        mockProps.pillSize = PillSizeVariants.Small;

        render(<PillWithVariants {...mockProps} />);

        expect(screen.getByTestId('prefix-pill-wrapper')).toHaveClass('smallWrapper');
    });
});
