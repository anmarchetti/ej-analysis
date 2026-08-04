import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockAmendDatesStore } from 'frontend/__mocks__';

import SummaryHeader from './SummaryHeader';

expect.extend(toHaveNoViolations);

const createMockProps = () => ({
    numberOfNightsLabel: '7 nights',
});

let mockStores;
let mockProps = createMockProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SummaryHeader />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendDatesStore: {
                ...mockAmendDatesStore,
            },
            routerStore: {
                redirectToAmendDatesSummaryPage: jest.fn(),
            },
        });
        mockProps = createMockProps();
    });

    it('Should render', () => {
        render(<SummaryHeader {...mockProps} />);

        expect(screen.getByTestId('date-change-summary-header')).toBeInTheDocument();
        expect(screen.getByTestId('amend-header-cta')).toBeInTheDocument();
        expect(screen.getByText('7 nights')).toBeInTheDocument();
        expect(screen.getByText('Thu 11th May 2023')).toBeInTheDocument();
        expect(screen.getByText('Thu 18th May 2023')).toBeInTheDocument();
        expect(screen.getByText('LGW')).toBeInTheDocument();
        expect(screen.getByText('ACE')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('Should not render if number of nights is 0', () => {
        mockStores.amendDatesStore.numberOfNights = 0;
        render(<SummaryHeader {...mockProps} />);

        expect(screen.queryByTestId('date-change-summary-header')).not.toBeInTheDocument();
    });

    it('Disable continue if dates haven not been changed', () => {
        mockStores.amendDatesStore.isDatesChanged = false;
        render(<SummaryHeader {...mockProps} />);

        const button = screen.getByText('Globals.Buttons.Continue');
        fireEvent.click(button);

        expect(mockStores.routerStore.redirectToAmendDatesSummaryPage).not.toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<SummaryHeader {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
