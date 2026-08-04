import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import TickCheck, { ITickCheckProps } from './TickCheck';

expect.extend(toHaveNoViolations);

let mockProps: ITickCheckProps;

describe('<TickCheck />', () => {
    beforeEach(() => {
        mockProps = {
            isChecked: true,
            isDisabled: false,
            index: 1,
        };
    });

    it('Should render component', () => {
        const { container } = render(<TickCheck {...mockProps} />);

        expect(screen.getByTestId('tick')).toBeInTheDocument();
        expect(screen.getByTestId('tick')).not.toHaveTextContent(mockProps.index!.toString());
        expect(container.querySelector('.icon-svg')).toBeInTheDocument();
        expect(container.querySelector('.container.checked.tick-check')).toBeInTheDocument();
    });

    it('should NOT render icon and render text instead when isChecked props has not been provided', () => {
        mockProps.isChecked = false;
        const { container } = render(<TickCheck {...mockProps} />);

        expect(container.querySelector('.icon-svg')).not.toBeInTheDocument();
        expect(screen.getByTestId('tick')).toHaveTextContent(mockProps.index!.toString());
        expect(container.querySelector('.container.tick-check')).toBeInTheDocument();
    });

    it('Should be rendered with isDisabled prop', () => {
        mockProps.isDisabled = true;
        const { container } = render(<TickCheck {...mockProps} />);

        expect(screen.getByTestId('tick')).toBeInTheDocument();
        expect(container.querySelector('.container.checked.disabled.tick-check')).toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<TickCheck {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
