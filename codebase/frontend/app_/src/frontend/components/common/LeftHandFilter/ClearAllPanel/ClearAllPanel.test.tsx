import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ClearAllPanel from './ClearAllPanel';

const createStores = () =>
    createMockStores({
        searchFiltersStore: {
            countableFilters: [{}, {}],
            onClearAll: jest.fn(),
        },
    });

let mockStores;
let searchFiltersStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ClearAllPanel />', () => {
    beforeEach(() => {
        mockStores = createStores();
        searchFiltersStore = mockStores.searchFiltersStore;
    });

    it('should NOT be rendered when isScreenLessMedium is false', () => {
        const { container } = render(<ClearAllPanel storeInstance={searchFiltersStore} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should be rendered when isScreenLessMedium is true', () => {
        mockStores.appStore.isScreenLessMedium = true;

        render(<ClearAllPanel storeInstance={searchFiltersStore} />);

        expect(screen.getByText(SitecoreDictionary.GlobalsButtonsClearAll)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.SearchPodFiltersLabelsNumberOfSelectedFilters)).toBeInTheDocument();
    });

    it('should render SearchPodFiltersLabelsNumberOfSelectedFiltersSingle when 1 countableFilter is provided', () => {
        mockStores.searchFiltersStore.countableFilters = [{}];
        mockStores.appStore.isScreenLessMedium = true;

        render(<ClearAllPanel storeInstance={searchFiltersStore} />);

        expect(
            screen.getByText(SitecoreDictionary.SearchPodFiltersLabelsNumberOfSelectedFiltersSingle),
        ).toBeInTheDocument();
    });

    it('should call onClearAll when clicked', async () => {
        mockStores.appStore.isScreenLessMedium = true;

        render(<ClearAllPanel storeInstance={searchFiltersStore} />);

        const button = screen.getByRole('button') as HTMLButtonElement;

        await userEvent.click(button);

        expect(mockStores.searchFiltersStore.onClearAll).toHaveBeenCalled();
    });

    it('should NOT render clearAllButton when hideClearAllBtn is true', () => {
        mockStores.searchFiltersStore.hideClearAllBtn = true;

        render(<ClearAllPanel storeInstance={searchFiltersStore} />);

        expect(screen.queryByText(SitecoreDictionary.GlobalsButtonsClearAll)).not.toBeInTheDocument();
    });
});
