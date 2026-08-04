import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as useMediaQuery from 'frontend/hooks/useMediaQuery';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import FilterTitleClear from './FilterTitleClear';

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FilterTitleClear />', () => {
    const resetMocks = () => ({
        code: FilterGroupCodes.Date,
        countableFilters: [
            {
                groupCode: FilterGroupCodes.Date,
            },
        ],
        onRemoveAllFilterGroup: jest.fn(),
    });

    let mocks;
    const useMobileViewportSpy = jest.spyOn(useMediaQuery, 'useMobileViewport');

    beforeEach(() => {
        mockStores = createStores();
        mocks = resetMocks();
        useMobileViewportSpy.mockReturnValue(false);
    });

    it('should NOT render when filterCount is 0', () => {
        mocks.countableFilters = undefined;

        const { container } = render(<FilterTitleClear {...mocks} />);

        expect(container.getElementsByClassName('titleClear')[0]).toBeEmptyDOMElement();
    });

    it('should render button when filter group code is equal to code', () => {
        render(<FilterTitleClear {...mocks} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render button when filter group code is OutboundDepartureTime and code is FlightTimes', () => {
        mocks.code = FilterGroupCodes.FlightTimes;
        mocks.countableFilters[0].groupCode = FilterGroupCodes.OutboundDepartureTime;

        render(<FilterTitleClear {...mocks} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render button with correct data-tid when filter group code is InboundDepartureTime and code is FlightTimes', () => {
        mocks.code = FilterGroupCodes.FlightTimes;
        mocks.countableFilters[0].groupCode = FilterGroupCodes.InboundDepartureTime;

        render(<FilterTitleClear {...mocks} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByTestId(`clear-${mocks.code}`)).toBeInTheDocument();
    });

    it('should render button when filter group code is TripAdvisorRating and code is StarRating', () => {
        mocks.code = FilterGroupCodes.StarRating;
        mocks.countableFilters[0].groupCode = FilterGroupCodes.TripAdvisorRating;

        render(<FilterTitleClear {...mocks} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render button when filter group code is StarRating and code is TripAdvisorRating', () => {
        mocks.code = FilterGroupCodes.TripAdvisorRating;
        mocks.countableFilters[0].groupCode = FilterGroupCodes.StarRating;

        render(<FilterTitleClear {...mocks} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render button when filter group code is TripAdvisorRating and code is TripAdvisorRating', () => {
        mocks.code = FilterGroupCodes.TripAdvisorRating;
        mocks.countableFilters[0].groupCode = FilterGroupCodes.TripAdvisorRating;

        render(<FilterTitleClear {...mocks} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render button when filter group code is PromoCollection and code is HotelTypes', () => {
        mocks.code = FilterGroupCodes.HotelTypes;
        mocks.countableFilters[0].groupCode = FilterGroupCodes.PromoCollection;

        render(<FilterTitleClear {...mocks} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should call onRemoveAllFilterGroup on button click', async () => {
        render(<FilterTitleClear {...mocks} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mocks.onRemoveAllFilterGroup).toHaveBeenCalled();
    });

    describe('disableAnimation behavior', () => {
        it('should pass disableAnimation=true on mobile when filters are present on first render', () => {
            useMobileViewportSpy.mockReturnValue(true);

            const { container } = render(<FilterTitleClear {...mocks} />);

            const wrappers = container.querySelectorAll('[class*="wrapper"]');
            expect(wrappers.length).toBeGreaterThan(0);
            // Animation classes should not be present
            expect(container.querySelector('[class*="Entrance"]')).not.toBeInTheDocument();
        });

        it('should pass disableAnimation=false on desktop regardless of filters', () => {
            useMobileViewportSpy.mockReturnValue(false);

            const { container } = render(<FilterTitleClear {...mocks} />);

            // Animation classes should be present
            expect(container.querySelector('[class*="Entrance"]')).toBeInTheDocument();
        });

        it('should animate on mobile after filters were cleared and re-added', () => {
            useMobileViewportSpy.mockReturnValue(true);

            const { rerender, container } = render(<FilterTitleClear {...mocks} />);

            // First render - no animation
            expect(container.querySelector('[class*="Entrance"]')).not.toBeInTheDocument();

            // Clear filters
            rerender(<FilterTitleClear {...mocks} countableFilters={[]} />);

            // Re-add filters - should animate now
            rerender(<FilterTitleClear {...mocks} />);

            expect(container.querySelector('[class*="Entrance"]')).toBeInTheDocument();
        });
    });
});
