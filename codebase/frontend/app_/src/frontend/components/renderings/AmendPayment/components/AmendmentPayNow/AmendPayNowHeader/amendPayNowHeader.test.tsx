import { render, screen } from '@testing-library/react';

import AmendPayNowHeader, { IAmendPayNowHeaderProps } from './AmendPayNowHeader';

const mockProps: IAmendPayNowHeaderProps = {
    title: 'title',
    description: 'description',
    withIcon: true,
    wide: true,
    className: 'className',
};

jest.mock('frontend/components/icons-new/BellRinging', () => ({
    __esModule: true,
    default: () => <div data-tid='bell-icon' />,
}));

describe('<AmendPayNowHeader />', () => {
    it('Should render props without icon', () => {
        render(<AmendPayNowHeader {...mockProps} />);

        expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
        expect(screen.getByTestId('amend-pay-now-header')).toBeInTheDocument();
        expect(screen.getByTestId('amend-pay-now-header')).toHaveClass('className wide');
        expect(screen.getByText('title')).toBeInTheDocument();
        expect(screen.getByText('description')).toBeInTheDocument();
    });

    it('Should render props without icon', () => {
        mockProps.withIcon = false;
        render(<AmendPayNowHeader {...mockProps} />);

        expect(screen.queryByTestId('bell-icon')).not.toBeInTheDocument();
    });
});
