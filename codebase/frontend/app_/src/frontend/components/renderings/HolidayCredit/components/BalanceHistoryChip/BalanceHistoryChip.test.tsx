import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockBalanceHistoryFields } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistoryFields.mocks';

import BalanceHistoryChip, { BalanceOrderStatuses, TBalanceHistoryChipProps } from './BalanceHistoryChip';

const createProps = (status: BalanceOrderStatuses = BalanceOrderStatuses.Active): TBalanceHistoryChipProps => ({
    fields: mockBalanceHistoryFields,
    status,
});

const createStores = () => createMockStores();

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <span data-tid='text' />;
    },
}));

jest.mock('frontend/components/icons-new/ClockFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='clock-icon' />,
}));

jest.mock('frontend/components/icons-new/SuccessFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='success-icon' />,
}));

jest.mock('frontend/components/icons-new/WarningFilled', () => ({
    __esModule: true,
    default: ({ className }) => <div data-tid='warning-icon' className={className} />,
}));

describe('<BalanceHistoryChip />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render active status correctly', () => {
        mockProps = createProps(BalanceOrderStatuses.Active);
        render(<BalanceHistoryChip {...mockProps} />);

        expect(screen.getByTestId('success-icon')).toBeInTheDocument();
        expect(screen.getByTestId('text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockBalanceHistoryFields.ExpireStateActive,
            tag: 'span',
        });
    });

    it('should render expire soon status correctly', () => {
        mockProps = createProps(BalanceOrderStatuses.ExpireSoon);
        render(<BalanceHistoryChip {...mockProps} />);

        expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
        expect(screen.getByTestId('text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockBalanceHistoryFields.ExpireStateExpiresSoon,
            tag: 'span',
        });
    });

    it('should render expired status correctly', () => {
        mockProps = createProps(BalanceOrderStatuses.Expired);
        render(<BalanceHistoryChip {...mockProps} />);

        expect(screen.getByTestId('warning-icon')).toHaveClass('expiredIcon');
        expect(screen.getByTestId('text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockBalanceHistoryFields.ExpireStateExpired,
            tag: 'span',
        });
    });

    it('should render used status correctly', () => {
        mockProps = createProps(BalanceOrderStatuses.Used);
        render(<BalanceHistoryChip {...mockProps} />);

        expect(screen.getByTestId('success-icon')).toBeInTheDocument();
        expect(screen.getByTestId('text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockBalanceHistoryFields.ExpireStateUsed,
            tag: 'span',
        });
    });
});
