import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import * as utils from 'frontend/utils/getSlidersToShow';
import { DataStatus } from 'models/enum/DataStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import ClearAllPanel from './ClearAllPanel';
import {
    DEFAULT_OFFSET,
    ILeftHandFilterProps,
    LeftHandFilter,
    PAGINATION_OFFSET,
    RECOMMENDER_OFFSET,
} from './LeftHandFilter';

const createStores = () =>
    createMockStores({
        layoutStore: {
            isPromoPage: false,
            isMaintenance: false,
        },
        searchFiltersStore: {
            isFiltersLoaded: true,
            filters: [{}],
        },
        hotelsStore: {
            status: DataStatus.Loaded,
        },
        bookingStore: {
            recommendedHotels: undefined,
        },
    });

let mockStores = createStores();
let mockProps;

const createMockProps = (): ILeftHandFilterProps => ({
    isCollapsed: true,
    rendering: {},
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: () => <div data-tid='search-results-map' />,
}));

const mockFiltersContainer = jest.fn();
jest.mock('./FilterContent/FilterContentWrapper', () => props => {
    mockFiltersContainer(props);

    return <div data-tid='filters-container' />;
});

jest.mock('./ClearAllPanel', () => jest.fn(() => <div data-tid='clear-all-panel' />));

describe('<LeftHandFilters />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createMockProps();
    });

    it('should not render when isMaintenance is true', () => {
        mockStores.layoutStore.isMaintenance = true;

        const { container } = render(<LeftHandFilter {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render when status is error and isPromoPage is true', () => {
        mockStores.layoutStore.isPromoPage = true;
        mockStores.hotelsStore.status = DataStatus.Error;

        const { container } = render(<LeftHandFilter {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render when status is error and isFiltersLoaded is false', () => {
        mockStores.hotelsStore.status = DataStatus.Error;
        mockStores.searchFiltersStore.isFiltersLoaded = false;

        const { container } = render(<LeftHandFilter {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render', () => {
        render(<LeftHandFilter {...mockProps} />);

        expect(screen.getByTestId('search-results-map')).toBeInTheDocument();
        expect(screen.getByTestId('filters-container')).toBeInTheDocument();
        expect(screen.getByTestId('clear-all-panel')).toBeInTheDocument();
        expect(mockFiltersContainer).toHaveBeenCalledWith({
            isCollapsed: true,
        });
        expect(ClearAllPanel).toHaveBeenCalledWith(
            expect.objectContaining({
                storeInstance: mockStores.searchFiltersStore,
            }),
            {},
        );
    });

    it('should render filters-wrapper with filtersMapWrapper class when isMap is true', () => {
        mockProps.isOnMapPopup = true;

        render(<LeftHandFilter {...mockProps} />);

        expect(screen.queryByTestId('search-results-map')).toBeNull();
        expect(screen.getByTestId('filters-wrapper')).toHaveClass('filtersWrapper filtersMapWrapper');
    });

    describe('useLayoutEffect', () => {
        beforeEach(() => {
            jest.spyOn(utils, 'getSlidesToShow').mockReturnValue(1);
        });

        it('should render filters-wrapper with min-height 100% - 0', () => {
            render(<LeftHandFilter {...mockProps} />);

            expect(screen.getByTestId('filters-wrapper')).toHaveAttribute('style', 'min-height: calc(100% - 0px);');
        });

        it('should render filters-wrapper with min-height 100% - (DEFAULT_OFFSET + RECOMMENDER_OFFSET) when recommendedHotelsNumber > getSlidesToShow', () => {
            mockStores.bookingStore.recommendedHotels = [{}, {}, {}];

            render(<LeftHandFilter {...mockProps} />);

            expect(screen.getByTestId('filters-wrapper')).toHaveAttribute(
                'style',
                `min-height: calc(100% - ${DEFAULT_OFFSET + RECOMMENDER_OFFSET}px);`,
            );
        });

        it('should render filters-wrapper with min-height 100% - RECOMMENDER_OFFSET when recommendedHotelsNumber < getSlidesToShow', () => {
            mockStores.bookingStore.recommendedHotels = [{}];

            render(<LeftHandFilter {...mockProps} />);

            expect(screen.getByTestId('filters-wrapper')).toHaveAttribute(
                'style',
                `min-height: calc(100% - ${RECOMMENDER_OFFSET}px);`,
            );
        });

        it('should render filters-wrapper with min-height 100% - (PAGINATION_OFFSET) when isPaginationShown is true', () => {
            mockProps.isPaginationShown = true;

            render(<LeftHandFilter {...mockProps} />);

            expect(screen.getByTestId('filters-wrapper')).toHaveAttribute(
                'style',
                `min-height: calc(100% - ${PAGINATION_OFFSET}px);`,
            );
        });
    });

    describe('Skeleton', () => {
        beforeEach(() => {
            mockStores.hotelsStore.status = DataStatus.Loading;
            mockStores.searchFiltersStore.isFiltersLoaded = true;
            mockStores.searchFiltersStore.filters = [];
            mockProps.rendering = {
                placeholders: {
                    'search-results-map': [{ fields: { IsSearchResultsMapButtonDisabled: { value: true } } }],
                },
            };
        });

        it('should render skeleton when status is loading and isFiltersLoaded is false', () => {
            mockStores.hotelsStore.status = DataStatus.Loading;
            mockStores.searchFiltersStore.isFiltersLoaded = false;

            render(<LeftHandFilter {...mockProps} />);

            const skeleton = screen.getByTestId('search-pod-filters-skeleton');

            expect(skeleton).toHaveClass('placeholder-shimmer filtersSkeleton');
        });

        it('should render skeleton without map when status is loading and isFiltersLoaded is true, no filters are provided and map is NOT in placeholders', () => {
            render(<LeftHandFilter {...mockProps} />);

            const skeleton = screen.getByTestId('search-pod-filters-skeleton');

            expect(skeleton).toHaveClass('placeholder-shimmer filtersSkeleton');
            expect(screen.queryByTestId('search-results-map-skeleton')).not.toBeInTheDocument();
        });

        it('should NOT render map skeleton when map placeholder is empty', () => {
            mockProps.rendering!.placeholders[PlaceholderNames.SearchResultsMap] = [];

            render(<LeftHandFilter {...mockProps} />);

            expect(screen.queryByTestId('search-results-map-skeleton')).not.toBeInTheDocument();
        });

        it('should NOT render map skeleton when map is disabled', () => {
            render(<LeftHandFilter {...mockProps} />);

            expect(screen.queryByTestId('search-results-map-skeleton')).not.toBeInTheDocument();
        });

        it('should render map skeleton when map is NOT disabled', () => {
            mockProps.rendering!.placeholders[
                PlaceholderNames.SearchResultsMap
            ][0].fields.IsSearchResultsMapButtonDisabled.value = false;

            render(<LeftHandFilter {...mockProps} />);

            expect(screen.getByTestId('search-results-map-skeleton')).toBeInTheDocument();
        });
    });
});
