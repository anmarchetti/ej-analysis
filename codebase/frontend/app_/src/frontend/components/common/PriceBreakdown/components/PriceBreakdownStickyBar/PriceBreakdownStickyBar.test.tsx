import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { DATA_TID_PREFIX } from 'frontend/components/common/PriceBreakdown/PriceBreakdown.utils';

import PriceBreakdownStickyBar, { IPriceBreakdownStickyBarProps } from './PriceBreakdownStickyBar';

const createMockProps = (): IPriceBreakdownStickyBarProps => ({
    isMobileDrawerOpened: false,
    toggleMobileDrawer: jest.fn(),
    transactionAmount: '100',
    paymentField: mockSitecoreField('refund'),
    title: mockSitecoreField('title'),
});

let mockProps = createMockProps();

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-react', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid={props['data-tid']} />;
    },
}));

const mockButton = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButton(props);

        return (
            <div data-tid={props.dataTid} onClick={props.onClick}>
                {props.children}
            </div>
        );
    },
}));

jest.mock('frontend/components/icons-new/ChevronDown', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-chevron-down' />,
}));

jest.mock('frontend/components/icons-new/ChevronUp', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-chevron-up' />,
}));

describe('<PriceBreakdownStickyBar />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should render standard', () => {
        render(<PriceBreakdownStickyBar {...mockProps} />);

        expect(screen.getByTestId(`${DATA_TID_PREFIX}-mobile-footer`)).toHaveClass('stickyFooter stickyFooterShadow');

        expect(screen.getByTestId(`${DATA_TID_PREFIX}-title`)).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            tag: 'span',
            field: mockProps.title,
            'data-tid': `${DATA_TID_PREFIX}-title`,
        });

        expect(screen.getByTestId('icon-chevron-up')).toBeInTheDocument();

        expect(screen.getByTestId(`${DATA_TID_PREFIX}-summary`)).toBeInTheDocument();
        expect(screen.getByTestId(`${DATA_TID_PREFIX}-transaction-amount`)).toHaveTextContent(
            mockProps.transactionAmount,
        );

        expect(screen.getByTestId(`${DATA_TID_PREFIX}-payment-instructions`)).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            tag: 'span',
            field: mockProps.paymentField,
            'data-tid': `${DATA_TID_PREFIX}-payment-instructions`,
        });
    });

    it('should render chevron down icon and not use class stickyFooterShadow when isMobileDrawerOpened = true', () => {
        mockProps.isMobileDrawerOpened = true;
        render(<PriceBreakdownStickyBar {...mockProps} />);

        expect(screen.getByTestId(`${DATA_TID_PREFIX}-mobile-footer`)).toHaveClass('stickyFooter');
        expect(screen.getByTestId(`${DATA_TID_PREFIX}-mobile-footer`)).not.toHaveClass('stickyFooterShadow');
        expect(screen.getByTestId('icon-chevron-down')).toBeInTheDocument();
    });

    it('should call toggleMobileDrawer on button click', async () => {
        render(<PriceBreakdownStickyBar {...mockProps} />);

        const button = screen.getByTestId(`${DATA_TID_PREFIX}-toggle-button`);
        await userEvent.click(button);

        expect(mockProps.toggleMobileDrawer).toHaveBeenCalled();
    });

    it('should render paidToUsTextNode when provided', () => {
        mockProps.paidToUsTextNode = <span aria-label='paid-to-us'>Paid to us</span>;

        render(<PriceBreakdownStickyBar {...mockProps} />);

        expect(screen.getByRole('generic', { name: 'paid-to-us' })).toBeInTheDocument();
    });

    it('should NOT render paidToUsTextNode when not provided', () => {
        render(<PriceBreakdownStickyBar {...mockProps} />);

        expect(screen.queryByRole('generic', { name: 'paid-to-us' })).not.toBeInTheDocument();
    });
});
