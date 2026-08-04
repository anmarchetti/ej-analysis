import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FiltersHeader from './FilterHeader';

jest.mock('frontend/components/common/AnimatedCounter/AnimatedCounter', () => ({
    __esModule: true,
    default: () => <div data-tid='animated-counter' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;
let searchFiltersStore;

describe('<FiltersHead />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchFiltersStore: {
                onClearAll: jest.fn(),
                countableFilters: {
                    length: 1,
                },
            },
        });

        searchFiltersStore = mockStores.searchFiltersStore;
    });

    it('should render clear-all-button with single-label when amount is 1', () => {
        const { getAllByTestId } = render(<FiltersHeader storeInstance={searchFiltersStore} />);

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(
            SitecoreDictionary.SearchPodFiltersLabelsNumberOfSelectedFiltersSingle,
        );
        expect(getAllByTestId('clear-all-button')).toHaveLength(1);
    });

    it('should NOT render clear-all-button when amount is negative', () => {
        mockStores.searchFiltersStore.countableFilters.length = 0;

        const { queryByTestId } = render(<FiltersHeader storeInstance={searchFiltersStore} />);

        expect(queryByTestId('clear-all-button')).not.toBeInTheDocument();
    });

    it('should render clear-all-button with plural-label when amount is positive', () => {
        mockStores.searchFiltersStore.countableFilters.length = 5;

        const { getAllByTestId } = render(<FiltersHeader storeInstance={searchFiltersStore} />);

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(
            SitecoreDictionary.SearchPodFiltersLabelsNumberOfSelectedFilters,
        );
        expect(getAllByTestId('clear-all-button')).toHaveLength(1);
    });

    it('should call onClick when clear-all-button clicked', () => {
        const { getByText } = render(<FiltersHeader storeInstance={searchFiltersStore} />);

        fireEvent.click(getByText(SitecoreDictionary.GlobalsButtonsClearAll));

        expect(mockStores.searchFiltersStore.onClearAll).toHaveBeenCalled();
    });

    it('should render clear-all-button when hideClearAllBtn is false and amount is positive', () => {
        mockStores.searchFiltersStore.countableFilters.length = 2;
        mockStores.searchFiltersStore.hideClearAllBtn = false;

        const { getAllByTestId } = render(<FiltersHeader storeInstance={searchFiltersStore} />);

        expect(getAllByTestId('clear-all-button')).toHaveLength(1);
    });

    it('should NOT render clear-all-button when hideClearAllBtn is true and amount is positive', () => {
        mockStores.searchFiltersStore.countableFilters.length = 3;
        mockStores.searchFiltersStore.hideClearAllBtn = true;

        const { queryByTestId } = render(<FiltersHeader storeInstance={searchFiltersStore} />);

        expect(queryByTestId('clear-all-button')).not.toBeInTheDocument();
    });

    it('should NOT render clear-all-button when hideClearAllBtn is true and amount is zero', () => {
        mockStores.searchFiltersStore.countableFilters.length = 0;
        mockStores.searchFiltersStore.hideClearAllBtn = true;

        const { queryByTestId } = render(<FiltersHeader storeInstance={searchFiltersStore} />);

        expect(queryByTestId('clear-all-button')).not.toBeInTheDocument();
    });
});
