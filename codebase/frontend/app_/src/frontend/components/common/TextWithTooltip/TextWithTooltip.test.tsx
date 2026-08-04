import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { ITextWithTooltipProps, TextWithTooltip } from './TextWithTooltip';
import * as splitTextUtils from './TextWithTooltip.utils';

const createProps = (): ITextWithTooltipProps => ({
    message: 'text',
    tooltipMessage: 'tooltip',
    dataTid: 'test-id',
    tooltipTriggerClassName: 'tooltipClass',
    wrapperClassName: 'wrapperClass',
});

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: ({ className }) => <div data-tid='tooltip-trigger' className={className} />,
    TooltipContent: ({ text }) => <div data-tid='tooltip-content'>{text}</div>,
}));

let mockProps;
jest.spyOn(splitTextUtils, 'getSplitText').mockImplementation(p => [p, 'last word']);

describe('<TextWithTooltip />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render when message is NOT provided', () => {
        mockProps.message = '';

        const { container } = render(<TextWithTooltip {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render', () => {
        render(<TextWithTooltip {...mockProps} />);

        expect(screen.getByTestId('test-id')).toHaveClass('wrapperClass');
        expect(screen.getByText('text')).toBeInTheDocument();
        expect(screen.getByText('last word')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-trigger')).toHaveClass('tooltipClass');
        expect(screen.getByTestId('tooltip-content')).toHaveTextContent('tooltip');
    });

    it('should render tag from props', () => {
        mockProps.tag = 'h1';

        render(<TextWithTooltip {...mockProps} />);

        expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should NOT render tooltip when tooltipMessage is NOT provided', () => {
        mockProps.tooltipMessage = '';

        render(<TextWithTooltip {...mockProps} />);

        expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });
});
