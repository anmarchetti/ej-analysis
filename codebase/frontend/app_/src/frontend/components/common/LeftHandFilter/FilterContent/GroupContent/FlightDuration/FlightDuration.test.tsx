import React from 'react';
import { render, screen } from '@testing-library/react';

import { MAX_FLIGHT_DURATION, MIN_FLIGHT_DURATION } from 'frontend/store/base/search/BaseSearchFilterStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FlightDuration from './FlightDuration';

jest.mock('./FlightDuration.utils', () => ({
    __esModule: true,
    default: () => ({ getPhrase: jest.fn(p => p), slider: {}, leftCounter: {}, rightCounter: {} }),
}));

jest.mock('frontend/components/common/LeftHandFilter/FilterContent/GroupContent/PriceFilter/CompoundSlider', () => ({
    __esModule: true,
    CompoundSlider: () => <div data-tid='compound-slider' />,
}));

jest.mock('./FlightDurationCounter', () => ({
    __esModule: true,
    default: () => <div data-tid='counter' />,
}));

describe('<FlightDuration />', () => {
    it('should standard render', () => {
        render(<FlightDuration />);

        expect(screen.getByTestId('flight-duration-filter-min-value')).toHaveTextContent(
            `${MIN_FLIGHT_DURATION} ${SitecoreDictionary.GlobalsLabelsTimeHoursAny}`,
        );
        expect(screen.getByTestId('compound-slider')).toBeInTheDocument();
        expect(screen.getByTestId('flight-duration-filter-max-value')).toHaveTextContent(
            `${MAX_FLIGHT_DURATION}+ ${SitecoreDictionary.GlobalsLabelsTimeHoursPlural}`,
        );
        expect(
            screen.getByText(`${SitecoreDictionary.SearchPodFiltersLabelsFlightDurationShowFlightsBetween}:`),
        ).toBeInTheDocument();
        expect(screen.getAllByTestId('counter')).toHaveLength(2);
        expect(
            screen.getByText(
                `${SitecoreDictionary.GlobalsLabelsTimeHoursAny} ${SitecoreDictionary.GlobalConjunctionsAnd}`,
            ),
        ).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsLabelsTimeHoursPlural)).toBeInTheDocument();
    });
});
