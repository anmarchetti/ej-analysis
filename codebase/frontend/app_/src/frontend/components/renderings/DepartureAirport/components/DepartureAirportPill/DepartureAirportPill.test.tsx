import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import DepartureAirportPill, { IDepartureAirportPillProps } from './DepartureAirportPill';

import styles from './DepartureAirportPill.module.scss';

jest.mock('frontend/components/icons-new/Cross', () => ({
    __esModule: true,
    default: () => <div data-tid='cross-icon' />,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, ...props }) => {
        mockButtonProps(props);

        return <button onClick={onClick}>{children}</button>;
    },
}));

const createProps = (): IDepartureAirportPillProps => ({
    name: 'name',
    onClick: jest.fn(),
    dataTid: 'pill',
    ariaLabel: 'ariaLabel',
});

let mockProps;

describe('<DepartureAirportPill />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<DepartureAirportPill {...mockProps} />);

        expect(screen.getByText(mockProps.name)).toBeInTheDocument();
        expect(within(screen.getByRole('button')).getByTestId('cross-icon')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            dataTid: 'remove-airport-button',
            'aria-label': mockProps.ariaLabel,
            isText: true,
            className: styles.button,
        });
    });

    it('should call onClick when clicking on button', () => {
        render(<DepartureAirportPill {...mockProps} />);

        fireEvent.click(screen.getByRole('button'));

        expect(mockProps.onClick).toHaveBeenCalled();
    });
});
