import React from 'react';
import { render, screen } from '@testing-library/react';

import Pill from './Pill';

const mockTooltipContent = jest.fn();
jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div>{children}</div>,
    TooltipTrigger: ({ children }) => <div data-tid='tooltip-trigger'>{children}</div>,
    TooltipContent: props => {
        mockTooltipContent(props);

        return <div data-tid='tooltip-content' />;
    },
}));

const mockPillContentComponent = jest.fn();
jest.mock('./PillContent', () => ({
    __esModule: true,
    default: props => {
        mockPillContentComponent(props);

        return <div data-tid='pill-content' />;
    },
}));

describe('<Pill />', () => {
    let mockProps;

    beforeEach(() => {
        mockProps = {
            contentClass: 'contentClass',
            iconClass: 'iconClass',
            titleClass: 'titleClass',
            title: 'title',
            icon: <i>icon</i>,
            text: '',
            tooltipClass: 'tooltipClass',
        };
    });

    it('should render correctly', () => {
        render(<Pill {...mockProps} />);

        expect(screen.queryByTestId('tooltip-trigger')).not.toBeInTheDocument();
        expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument();

        expect(screen.getByTestId('pill-content')).toBeInTheDocument();
        expect(mockPillContentComponent).toHaveBeenCalledWith({
            contentClass: 'contentClass',
            dotted: false,
            ellipsis: false,
            icon: expect.any(Object),
            iconClass: 'iconClass',
            title: 'title',
            titleClass: 'titleClass',
        });
    });

    it('should render correctly as tooltip when text is defined', () => {
        mockProps.text = 'text';
        mockProps.ellipsis = false;

        render(<Pill {...mockProps} />);

        expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
        expect(mockTooltipContent).toHaveBeenCalledWith({ className: 'tooltipClass', text: 'text' });

        expect(screen.getByTestId('pill-content')).toBeInTheDocument();
        expect(mockPillContentComponent).toHaveBeenCalledWith({
            contentClass: 'contentClass',
            dotted: true,
            ellipsis: false,
            icon: expect.any(Object),
            iconClass: 'iconClass',
            title: 'title',
            titleClass: 'titleClass',
        });
    });
});
