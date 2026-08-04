import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import DatesDetails, { IDatesDetailsProps } from './DatesDetails';

const createMockProps = (): IDatesDetailsProps => ({
    startDate: '2022-01-01',
    endDate: '2022-01-08',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/CalendarLined', () => () => <div data-tid='calendar-lined' />);

describe('<DatesDetails />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores();
    });

    it('should render DatesDetails component', () => {
        render(<DatesDetails {...mockProps} />);

        expect(screen.getByTestId('dates-details')).toBeInTheDocument();
        expect(screen.getByTestId('calendar-lined')).toBeInTheDocument();
        expect(screen.getByText('01 Jan - 08 Jan 2022, 7 Globals.Labels.NightsPlural')).toBeInTheDocument();
    });

    it('should render dataTid if provided', () => {
        mockProps.dataTid = 'test-id';
        render(<DatesDetails {...mockProps} />);

        expect(screen.getByTestId('test-id')).toBeInTheDocument();
        expect(screen.getByTestId('test-id-label')).toBeInTheDocument();
    });

    it('should render className if provided', () => {
        mockProps.className = 'test-class';
        render(<DatesDetails {...mockProps} />);

        expect(screen.getByTestId('dates-details')).toHaveClass('test-class');
    });

    it('should render only duration if showOnlyDuration is true', () => {
        mockProps.showOnlyDuration = true;
        render(<DatesDetails {...mockProps} />);

        expect(screen.getByText('7 Globals.Labels.NightsPlural')).toBeInTheDocument();
    });
});
