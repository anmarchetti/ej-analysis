import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { availableFilters } from 'frontend/__mocks__/filters';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FlightTimes from './FlightTimes';

const mockFilterCheckControl = jest.fn();
jest.mock(
    'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/BaseCheckboxGroup/FilterCheckControl',
    () => ({
        __esModule: true,
        default: ({ onChange, ...props }) => {
            mockFilterCheckControl(props);

            return <button onClick={onChange} onKeyDown={jest.fn()} data-tid='filter-check-control' />;
        },
    }),
);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;
const flightTimesData = availableFilters[5].options;

describe('<FlightTimes />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchFiltersStore: {
                onChange: jest.fn(),
                isOptionDisabled: jest.fn(() => false),
                isFilterGroupSelected: jest.fn(() => true),
                getPreparedGroupContent: jest.fn(() => flightTimesData),
            },
        });
    });

    it('should NOT render when inbound and outbound flights are NOT provided', () => {
        mockStores.searchFiltersStore.getPreparedGroupContent = jest.fn(() => []);

        const { container } = render(<FlightTimes />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when inbound and outbound flights have no children', () => {
        mockStores.searchFiltersStore.getPreparedGroupContent = jest.fn(() => [
            { name: RouteDirection.Inbound, children: [] },
            { name: RouteDirection.Outbound, children: [] },
        ]);

        const { container } = render(<FlightTimes />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render outbound and inbound flights with FilterCheckControl components', () => {
        render(<FlightTimes />);

        expect(screen.getByTestId('outbound-departure-time')).toBeInTheDocument();
        expect(screen.getByTestId('inbound-departure-time')).toBeInTheDocument();
        expect(screen.getByTestId('flights-group-header-departure')).toBeInTheDocument();
        expect(screen.getByTestId('flights-group-header-return')).toBeInTheDocument();
        expect(screen.getAllByTestId('filter-check-control')).toHaveLength(10);
        expect(
            screen.getByText(SitecoreDictionary.SearchPodFiltersTitlesOutboundDepartureTimeSubtitle),
        ).toBeInTheDocument();
        expect(
            screen.getByText(SitecoreDictionary.SearchPodFiltersTitlesInboundDepartureTimeSubtitle),
        ).toBeInTheDocument();
    });

    it('should call onChange on outbound FilterCheckControl change', async () => {
        render(<FlightTimes />);

        const button = screen.getAllByTestId('filter-check-control')[0];

        await userEvent.click(button);

        expect(mockStores.searchFiltersStore.onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Outbound early morning (00:00-05:59)',
            }),
        );
    });

    it('should call onChange on inbound FilterCheckControl change', async () => {
        render(<FlightTimes />);

        const button = screen.getAllByTestId('filter-check-control')[5];

        await userEvent.click(button);

        expect(mockStores.searchFiltersStore.onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Inbound early morning (00:00-05:59)',
            }),
        );
    });
});
