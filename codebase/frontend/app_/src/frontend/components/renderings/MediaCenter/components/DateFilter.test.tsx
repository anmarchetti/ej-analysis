import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { DateFilter } from './DateFilter';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewPort = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewPort,
}));

jest.mock('frontend/components/common/FakeInput/FakeInput', () => ({ onClick, value, placeholder }) => (
    <>
        <input data-tid='fake-input' onClick={onClick} value={value} />
        <span data-tid='fake-input-placeholder'>{placeholder}</span>
    </>
));

jest.mock('./PredefinedTimePeriods', () => () => <div data-tid='predefined-time-periods' />);

jest.mock('./CalendarFilterDesktop', () => () => <div data-tid='calendar-filter-desktop' />);

const mockCalendarFilterDrawerProps = jest.fn();
jest.mock('./CalendarFilterDrawer', () => props => {
    mockCalendarFilterDrawerProps(props);

    return <div data-tid='calendar-filter-drawer' />;
});

jest.mock('frontend/components/common/SearchFilters/SelectedFilters', () => ({ onClearAll }) => (
    <div data-tid='selected-filters' onClick={onClearAll} />
));

const createStores = () =>
    createMockStores({
        mediaCenterStore: {
            isApplyDisabled: false,
            selectedDatesFilters: [],
            availableFilters: [],
            maxDateFrom: undefined,
            minDateTo: undefined,
            setIsApplyDisabledState: jest.fn(),
            onChangeDatePickerFrom: jest.fn(),
            onChangeDatePickerTo: jest.fn(),
            onClearDatesFilter: jest.fn(),
            onApply: jest.fn(),
            activePredefinedTimePeriod: undefined,
            setActivePredefinedTimePeriod: jest.fn(),
            datePickerFromState: '2025-01-01',
            datePickerToState: '2025-01-03',
            formatDateDMY: jest.fn(d => d),
        },
    });

let mockStores;

describe('DateFilter', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockUseMobileViewPort = false;
    });

    it('should render DateFilter', () => {
        render(<DateFilter />);

        expect(screen.getByTestId('date-filter')).toBeInTheDocument();
    });

    it('should render DateFilter mobile', () => {
        mockUseMobileViewPort = true;
        render(<DateFilter />);

        expect(screen.getByTestId('date-filter-mobile')).toBeInTheDocument();
    });

    it('should contain CalendarFilterDesktop and PredefinedTimePeriods', () => {
        render(<DateFilter />);

        expect(screen.getByTestId('predefined-time-periods')).toBeInTheDocument();
        expect(screen.getAllByTestId('calendar-filter-desktop')).toHaveLength(2);
    });

    it('should render empty value in inputs', () => {
        mockStores.mediaCenterStore.datePickerFromState = '';
        mockStores.mediaCenterStore.datePickerToState = '';
        mockUseMobileViewPort = true;
        render(<DateFilter />);

        expect(screen.getAllByTestId('fake-input')[0]).toHaveValue('');
        expect(screen.getAllByTestId('fake-input')[1]).toHaveValue('');
    });

    it('should render correct value in inputs', () => {
        mockUseMobileViewPort = true;
        render(<DateFilter />);

        expect(screen.getAllByTestId('fake-input')[0]).toHaveValue('2025-01-01');
        expect(screen.getAllByTestId('fake-input')[1]).toHaveValue('2025-01-03');
    });

    it('should contain CalendarFilterDrawer, SearchBarInput and PredefinedTimePeriods on mobile', () => {
        mockUseMobileViewPort = true;
        render(<DateFilter />);

        expect(screen.getByTestId('predefined-time-periods')).toBeInTheDocument();
        expect(screen.getAllByTestId('calendar-filter-drawer')).toHaveLength(2);
        expect(screen.getAllByTestId('fake-input')).toHaveLength(2);
        expect(screen.getByText(SitecoreDictionary.PressHubFiltersPlaceHoldersFromField)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.PressHubFiltersPlaceHoldersToField)).toBeInTheDocument();
    });

    it('should open drawer when click on input', () => {
        mockUseMobileViewPort = true;
        render(<DateFilter />);

        expect(mockCalendarFilterDrawerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isDrawerActive: false,
            }),
        );
        fireEvent.click(screen.getAllByTestId('fake-input')[0]);

        expect(mockCalendarFilterDrawerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isDrawerActive: true,
            }),
        );
    });

    it('should call onClearDatesFilter when click on clear filters', () => {
        mockUseMobileViewPort = true;
        render(<DateFilter />);

        fireEvent.click(screen.getByTestId('selected-filters'));

        expect(mockStores.mediaCenterStore.onClearDatesFilter).toHaveBeenCalled();
    });
});
