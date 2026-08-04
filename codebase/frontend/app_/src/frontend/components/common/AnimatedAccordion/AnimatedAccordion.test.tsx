import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AnimatedAccordion, { IAnimatedAccordionProps } from './AnimatedAccordion';

const createProps = (): IAnimatedAccordionProps => ({
    buttonContent: <div data-tid='button-content' />,
    children: <div data-tid='children-content' />,
});

let mockProps;

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, className, children }) => (
        <button data-tid='button' onClick={onClick} className={className}>
            {children}
        </button>
    ),
}));

jest.mock('frontend/components/common/AnimatedWrapper/AnimatedWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='animated-wrapper'>{children}</div>,
}));

jest.mock('frontend/components/icons-new/Arrow', () => ({
    __esModule: true,
    default: ({ className }) => <div data-tid='arrow' className={className} />,
}));

describe('<AnimatedAccordion />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<AnimatedAccordion {...mockProps} />);

        expect(screen.getByTestId('animated-accordion')).toBeInTheDocument();
        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.getByTestId('button-content')).toBeInTheDocument();
        expect(screen.getByTestId('arrow')).toBeInTheDocument();
        expect(screen.getByTestId('animated-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('children-content')).toBeInTheDocument();
    });

    it('should render content with classes from props', () => {
        mockProps.buttonClass = 'buttonClass';
        mockProps.wrapperClass = 'wrapperClass';

        render(<AnimatedAccordion {...mockProps} />);

        expect(screen.getByTestId('animated-accordion')).toHaveClass('wrapperClass');
        expect(screen.getByTestId('button')).toHaveClass('buttonClass');
    });

    it('should handle button click', async () => {
        mockProps.openedWrapperClass = 'openedWrapperClass';

        render(<AnimatedAccordion {...mockProps} />);

        expect(screen.getByTestId('animated-accordion')).not.toHaveClass('openedWrapperClass');
        expect(screen.getByTestId('arrow')).toHaveClass('arrowDown');

        await userEvent.click(screen.getByTestId('button'));

        expect(screen.getByTestId('animated-accordion')).toHaveClass('openedWrapperClass');
        expect(screen.getByTestId('arrow')).toHaveClass('arrowUp');
    });

    it('should call onClick from props when it is provided', async () => {
        mockProps.onClick = jest.fn();

        render(<AnimatedAccordion {...mockProps} />);

        await userEvent.click(screen.getByTestId('button'));

        expect(mockProps.onClick).toHaveBeenCalled();
    });
});
