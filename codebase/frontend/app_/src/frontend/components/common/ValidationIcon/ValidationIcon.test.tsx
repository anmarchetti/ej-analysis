import { render, screen } from '@testing-library/react';

import { ValidationIcon } from 'frontend/components/common/ValidationIcon/ValidationIcon';

jest.mock('frontend/components/icons-new/WarningFilled', () => () => <svg data-tid='svg-warning-filled' />);

jest.mock('frontend/components/icons-new/WarningFilledTransparent', () => () => (
    <svg data-tid='svg-warning-filled-transparent' />
));

describe('<BackToPage />', () => {
    it('should render SvgWarningFilled when isTradePortal is false (or undefined)', () => {
        render(<ValidationIcon />);

        expect(screen.getByTestId('svg-warning-filled')).toBeInTheDocument();
        expect(screen.queryByTestId('svg-warning-filled-transparent')).not.toBeInTheDocument();
    });

    it('should render SvgWarningFilled when isTradePortal is explicitly false', () => {
        render(<ValidationIcon isTradePortal={false} />);

        expect(screen.getByTestId('svg-warning-filled')).toBeInTheDocument();
        expect(screen.queryByTestId('svg-warning-filled-transparent')).not.toBeInTheDocument();
    });

    it('should render SvgWarningFilledTransparent when isTradePortal is true', () => {
        render(<ValidationIcon isTradePortal={true} />);

        expect(screen.getByTestId('svg-warning-filled-transparent')).toBeInTheDocument();
        expect(screen.queryByTestId('svg-warning-filled')).not.toBeInTheDocument();
    });
});
