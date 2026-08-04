import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import RatingGroup from './RatingGroup';

jest.mock('./StarRatings', () => ({
    __esModule: true,
    default: () => <div data-tid='star-ratings' />,
}));

jest.mock('./TripAdvisorRatings', () => ({
    __esModule: true,
    default: () => <div data-tid='trip-advisor-ratings' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;

describe('<RatingGroup />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('renders StarRatings before TripAdvisorRatings when triggeringCode is StarRating', () => {
        render(
            <RatingGroup storeInstance={mockStores.searchFiltersStore} triggeringCode={FilterGroupCodes.StarRating} />,
        );

        const items = screen.getAllByTestId(/star-ratings|trip-advisor-ratings/);

        expect(items[0]).toHaveAttribute('data-tid', 'star-ratings');
        expect(items[1]).toHaveAttribute('data-tid', 'trip-advisor-ratings');
    });

    it('renders TripAdvisorRatings before StarRatings when triggeringCode is TripAdvisorRating', () => {
        render(
            <RatingGroup
                storeInstance={mockStores.searchFiltersStore}
                triggeringCode={FilterGroupCodes.TripAdvisorRating}
            />,
        );

        const items = screen.getAllByTestId(/star-ratings|trip-advisor-ratings/);

        expect(items[0]).toHaveAttribute('data-tid', 'trip-advisor-ratings');
        expect(items[1]).toHaveAttribute('data-tid', 'star-ratings');
    });

    it('renders both sub-components regardless of triggeringCode', () => {
        render(
            <RatingGroup storeInstance={mockStores.searchFiltersStore} triggeringCode={FilterGroupCodes.StarRating} />,
        );

        expect(screen.getByTestId('star-ratings')).toBeInTheDocument();
        expect(screen.getByTestId('trip-advisor-ratings')).toBeInTheDocument();
    });
});
