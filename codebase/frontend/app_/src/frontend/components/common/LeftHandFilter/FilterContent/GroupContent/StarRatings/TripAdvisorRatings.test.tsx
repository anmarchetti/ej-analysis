import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { availableFilters } from 'frontend/__mocks__/filters';
import { AmendHotelStoreFilters } from 'frontend/store/holidays/amend/amendHotel/AmendHotelStore.filters';
import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import TradePortalSearchFilterStore from 'frontend/store/tradePortal/search/TradePortalSearchFiltersStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import TripAdvisorRatings from './TripAdvisorRatings';

const mockTripadvisorRatingProps = jest.fn();
jest.mock('frontend/components/common/TripadvisorRating/TripadvisorRating', () => ({
    __esModule: true,
    default: props => {
        mockTripadvisorRatingProps(props);

        return <div data-tid='tripadvisor-rating' />;
    },
}));

jest.mock(
    'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/BaseCheckboxGroup/FilterCheckControl/FilterCheckControl',
    () => ({
        __esModule: true,
        default: ({ onChange, label }) => (
            <button onClick={onChange} onKeyDown={jest.fn()} data-tid='filter-check-control'>
                {label}
            </button>
        ),
    }),
);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;
const tripAdvisorRatingData = availableFilters[9].options;

describe('<TripAdvisorRatings />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchFiltersStore: {
                onChange: jest.fn(),
                isOptionDisabled: jest.fn(() => false),
                isFilterGroupSelected: jest.fn(() => true),
                getPreparedGroupContent: jest.fn(() => tripAdvisorRatingData),
            },
        });
    });

    it('returns null when there is no trip advisor rating content', () => {
        mockStores.searchFiltersStore.getPreparedGroupContent = jest.fn(() => []);

        const { container } = render(<TripAdvisorRatings storeInstance={mockStores.searchFiltersStore} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render TripAdvisorRatings with FilterCheckControl and correct label', () => {
        render(<TripAdvisorRatings storeInstance={mockStores.searchFiltersStore} />);

        expect(screen.getByTestId('trip-advisor-rating')).toBeInTheDocument();
        expect(screen.getAllByTestId('filter-check-control')).toHaveLength(4);
        expect(screen.getAllByTestId('tripadvisor-rating')).toHaveLength(4);
        expect(screen.getByTestId('trip-advisor-rating-header')).toBeInTheDocument();
        expect(screen.getAllByText(SitecoreDictionary.SearchPodFiltersLabelsAndUp)).toHaveLength(3);
        expect(screen.getByText(SitecoreDictionary.SearchPodFiltersLabelsOnly)).toBeInTheDocument();
        expect(
            screen.getByText(SitecoreDictionary.SearchPodFiltersTitlesTripAdvisorRatingSubtitle),
        ).toBeInTheDocument();
    });

    it('should call onChange when FilterCheckControl clicked', async () => {
        render(<TripAdvisorRatings storeInstance={mockStores.searchFiltersStore} />);

        const button = screen.getAllByTestId('filter-check-control')[0];

        await userEvent.click(button);

        expect(mockStores.searchFiltersStore.onChange).toHaveBeenCalledWith(tripAdvisorRatingData[4]);
    });

    it('should hide count when isCountHidden is true', async () => {
        mockStores.isCountHidden = true;
        render(<TripAdvisorRatings storeInstance={mockStores.searchFiltersStore} />);

        expect(screen.queryByText('(test formatted number)')).not.toBeInTheDocument();
    });

    describe('2-star option', () => {
        beforeEach(() => {
            mockStores.searchFiltersStore = {
                ...mockStores.searchFiltersStore,
                getPreparedGroupContent: jest.fn(() => [
                    { code: '5', count: 4, groupCode: 'tripAdvisorRating' },
                    { code: '4', count: 7, groupCode: 'tripAdvisorRating' },
                    { code: '3', count: 10, groupCode: 'tripAdvisorRating' },
                    { code: '2', count: 10, groupCode: 'tripAdvisorRating' },
                ]),
            };
        });

        it('should hide duplicate 2-star option for SearchFilterStore', () => {
            Object.setPrototypeOf(mockStores.searchFiltersStore, SearchFilterStore.prototype);

            render(<TripAdvisorRatings storeInstance={mockStores.searchFiltersStore} />);

            expect(mockTripadvisorRatingProps).toHaveBeenCalledTimes(3);
            expect(mockTripadvisorRatingProps).not.toHaveBeenCalledWith(expect.objectContaining({ rating: 2 }));
            expect(mockTripadvisorRatingProps).toHaveBeenCalledWith(expect.objectContaining({ rating: 3 }));
            expect(mockTripadvisorRatingProps).toHaveBeenCalledWith(expect.objectContaining({ rating: 4 }));
            expect(mockTripadvisorRatingProps).toHaveBeenCalledWith(expect.objectContaining({ rating: 5 }));
        });

        it('should hide duplicate 2-star option for TradePortalSearchFilterStore', () => {
            Object.setPrototypeOf(mockStores.searchFiltersStore, TradePortalSearchFilterStore.prototype);

            render(<TripAdvisorRatings storeInstance={mockStores.searchFiltersStore} />);

            expect(mockTripadvisorRatingProps).toHaveBeenCalledTimes(3);
            expect(mockTripadvisorRatingProps).not.toHaveBeenCalledWith(expect.objectContaining({ rating: 2 }));
            expect(mockTripadvisorRatingProps).toHaveBeenCalledWith(expect.objectContaining({ rating: 3 }));
            expect(mockTripadvisorRatingProps).toHaveBeenCalledWith(expect.objectContaining({ rating: 4 }));
            expect(mockTripadvisorRatingProps).toHaveBeenCalledWith(expect.objectContaining({ rating: 5 }));
        });

        it('should keep 2-star option for AmendHotelStoreFilters', () => {
            Object.setPrototypeOf(mockStores.searchFiltersStore, AmendHotelStoreFilters.prototype);

            render(<TripAdvisorRatings storeInstance={mockStores.searchFiltersStore} />);

            expect(mockTripadvisorRatingProps).toHaveBeenCalledTimes(4);
            expect(mockTripadvisorRatingProps).toHaveBeenCalledWith(expect.objectContaining({ rating: 2 }));
            expect(mockTripadvisorRatingProps).toHaveBeenCalledWith(expect.objectContaining({ rating: 3 }));
            expect(mockTripadvisorRatingProps).toHaveBeenCalledWith(expect.objectContaining({ rating: 4 }));
            expect(mockTripadvisorRatingProps).toHaveBeenCalledWith(expect.objectContaining({ rating: 5 }));
        });
    });
});
