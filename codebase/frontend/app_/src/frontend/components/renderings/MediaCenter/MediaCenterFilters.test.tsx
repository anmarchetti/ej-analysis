import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import MediaCenterFilters, { TMediaCenterFiltersProps } from './MediaCenterFilters';

jest.mock('frontend/hooks/useMediaQuery');

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='text' />;
    },
}));

jest.mock('frontend/components/renderings/DestinationBreadcrumbs', () => {
    const MockPathBreadcrumbs = props => <div data-tid='mock-path-breadcrumbs' {...props} />;

    return MockPathBreadcrumbs;
});

const mockFiltersContainer = jest.fn();
jest.mock('frontend/components/common/SearchFilters/FiltersContainer', () => {
    const MockFiltersContainer = props => {
        mockFiltersContainer(props);

        return <div data-tid='mock-filters-container' {...props} />;
    };

    return MockFiltersContainer;
});

const createStores = () =>
    createMockStores({
        mediaCenterStore: {
            activeFilterCode: FilterGroupCodes.Topics,
            onSelectFilterGroup: jest.fn(),
            onCloseFilters: jest.fn(),
            selectedFilters: [],
            onSelectFilters: jest.fn(),
            onClearAllSelectedFilters: jest.fn(),
            onRemoveSelectedFilter: jest.fn(),
            filters: [],
            isFiltersLoaded: false,
            isApplyDisabled: false,
            fetchResults: jest.fn(),
            setPageNumber: jest.fn(),
            status: DataStatus.NotLoaded,
            isFilterSelected: jest.fn(),
            setFiltersFromQueryParamsStore: jest.fn(),
            isFilterGroupDisabled: jest.fn(),
        },
        queryParamStore: {
            parseBrowserQuery: jest.fn(),
        },
    });

let mockStores = createStores();
let mocks: TMediaCenterFiltersProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const resetMocks = (): TMediaCenterFiltersProps => ({
    fields: {
        Title: mockSitecoreField('Title'),
    },
    params: {},
    rendering: {},
});

describe('<MediaCenterFilters />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should render correctly on desktop', () => {
        jest.mocked(useMoreThenMobileViewport).mockReturnValue(true);
        render(<MediaCenterFilters {...mocks} />);

        expect(screen.getByTestId('media-center-filters-wrapper')).toHaveClass('filtersApplied');
        expect(mockTextProps).toHaveBeenCalledWith(expect.objectContaining({ field: mocks.fields!.Title }));
        expect(mockFiltersContainer).toHaveBeenCalledWith({
            activeFilterCode: mockStores.mediaCenterStore.activeFilterCode,
            availableFilters: mockStores.mediaCenterStore.filters,
            checkIsFilterSelected: mockStores.mediaCenterStore.isFilterSelected,
            className: 'mediaCenterFilters',
            fetchResults: mockStores.mediaCenterStore.fetchArticles,
            isApplyDisabled: mockStores.mediaCenterStore.isApplyDisabled,
            isFilterGroupDisabled: mockStores.mediaCenterStore.isFilterGroupDisabled,
            isFiltersLoaded: mockStores.mediaCenterStore.isFiltersLoaded,
            onApply: mockStores.mediaCenterStore.onApplyDateFilter,
            onCancel: mockStores.mediaCenterStore.onCloseDateFilter,
            onClearSelectedFilters: mockStores.mediaCenterStore.onClearAllSelectedFilters,
            onCloseFilters: mockStores.mediaCenterStore.onCloseFilters,
            onRemoveSpecificFilter: mockStores.mediaCenterStore.onRemoveSelectedFilter,
            onSelectFilterGroup: mockStores.mediaCenterStore.onSelectFilterGroup,
            selectedDestinationCodesQuery: null,
            selectedFilters: mockStores.mediaCenterStore.selectedFilters,
            setPageNumber: mockStores.mediaCenterStore.setPageNumber,
            status: mockStores.mediaCenterStore.status,
            onSelectFilters: mockStores.mediaCenterStore.onSelectFilters,
        });
    });

    it('should NOT render title when no fields', () => {
        mocks.fields = undefined;
        mockStores.mediaCenterStore.activeFilterCode = FilterGroupCodes.NoFilter;
        render(<MediaCenterFilters {...mocks} />);

        expect(mockTextProps).toHaveBeenCalledWith(expect.objectContaining({ field: undefined }));
        expect(screen.getByTestId('media-center-filters-wrapper')).not.toHaveClass('filtersApplied');
    });

    it('should NOT pass onCancel to FiltersContainer on mobile', () => {
        jest.mocked(useMoreThenMobileViewport).mockReturnValue(false);
        render(<MediaCenterFilters {...mocks} />);

        expect(mockFiltersContainer).toHaveBeenCalledWith(expect.objectContaining({ onCancel: undefined }));
    });

    it('should call parseBrowserQuery and setFiltersFromQueryParamsStore when mounted', () => {
        render(<MediaCenterFilters {...mocks} />);

        expect(mockStores.queryParamStore.parseBrowserQuery).toHaveBeenCalledWith(window.location.search);
        expect(mockStores.mediaCenterStore.setFiltersFromQueryParamsStore).toHaveBeenCalled();
    });

    it('should call onClearSelectedFilters when unmounted', () => {
        const { unmount } = render(<MediaCenterFilters {...mocks} />);

        unmount();

        expect(mockStores.mediaCenterStore.onClearAllSelectedFilters).toHaveBeenCalled();
    });
});
