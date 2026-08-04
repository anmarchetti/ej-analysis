import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { availableFilters } from 'frontend/__mocks__/filters';
import * as viewportUtils from 'frontend/hooks/useMediaQuery';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import StarRatings from './StarRatings';

jest.mock(
    'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/BaseCheckboxGroup/FilterCheckControl',
    () => ({
        __esModule: true,
        default: ({ onChange, label }) => (
            <button onClick={onChange} onKeyDown={jest.fn()} data-tid='filter-check-control'>
                {label}
            </button>
        ),
    }),
);

const mockTextWithTooltip = jest.fn();
jest.mock('frontend/components/common/TextWithTooltip/TextWithTooltip', () => ({
    __esModule: true,
    default: props => {
        mockTextWithTooltip(props);

        return <div data-tid='text-with-tooltip' />;
    },
}));

const mockUseMobileViewport = jest.spyOn(viewportUtils, 'useMobileViewport');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;
const starRatingData = availableFilters[1].options;

describe('<StarRatings />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchFiltersStore: {
                onChange: jest.fn(),
                isOptionDisabled: jest.fn(() => false),
                isFilterGroupSelected: jest.fn(() => true),
                getPreparedGroupContent: jest.fn(() => starRatingData),
            },
        });

        mockUseMobileViewport.mockReturnValue(false);
    });

    it('returns null when there is no star rating content', () => {
        mockStores.searchFiltersStore.getPreparedGroupContent = jest.fn(() => []);

        const { container } = render(<StarRatings storeInstance={mockStores.searchFiltersStore} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render StarRatings with FilterCheckControl and Tooltip', () => {
        render(<StarRatings storeInstance={mockStores.searchFiltersStore} />);

        expect(screen.getByTestId('star-rating')).toBeInTheDocument();
        expect(screen.getAllByTestId('filter-check-control')).toHaveLength(4);
        expect(screen.getByTestId('text-with-tooltip')).toBeInTheDocument();
        expect(mockTextWithTooltip).toHaveBeenCalledWith({
            message: SitecoreDictionary.SearchPodFiltersTitlesStarRatingSubtitle,
            tooltipMessage: SitecoreDictionary.SearchPodFiltersLabelsStarRatingTooltip,
            tag: 'p',
            tooltipTriggerClassName: 'tooltipTrigger',
            wrapperClassName: 'ratingTitle',
            dataTid: 'star-rating-header',
        });
    });

    it('should call onChange when FilterCheckControl clicked', async () => {
        render(<StarRatings storeInstance={mockStores.searchFiltersStore} />);

        const button = screen.getAllByTestId('filter-check-control')[1];

        await userEvent.click(button);

        expect(mockStores.searchFiltersStore.onChange).toHaveBeenCalledWith(starRatingData[3]);
    });

    it('hides count when hideCount is true', async () => {
        mockStores.isCountHidden = true;
        render(<StarRatings storeInstance={mockStores.searchFiltersStore} />);

        expect(screen.queryByText('(2)')).not.toBeInTheDocument();
    });
});
