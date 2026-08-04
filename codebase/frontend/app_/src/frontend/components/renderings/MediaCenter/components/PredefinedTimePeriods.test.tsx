import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import { PredefinedTimePeriods } from './PredefinedTimePeriods';

const createStores = () => ({
    mediaCenterStore: {
        selectedDatesFilters: [],
        activePredefinedTimePeriod: undefined,
        setActivePredefinedTimePeriod: jest.fn(),
    },
    appStore: {
        isScreenLessMedium: false,
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PredefinedTimePeriods />', () => {
    beforeEach(() => {
        mockStores = createMockStores(createStores());
    });

    it('should standard render', () => {
        render(<PredefinedTimePeriods />);
        expect(screen.getByTestId('predefined-period')).toBeInTheDocument();
    });

    it('should select predefined time period', () => {
        render(<PredefinedTimePeriods />);
        const firstPill = screen.getAllByTestId('predefined-period-pill')[0];

        fireEvent.click(firstPill);

        expect(mockStores.mediaCenterStore.setActivePredefinedTimePeriod).toHaveBeenCalled();
    });
});
