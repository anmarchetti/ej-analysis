import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FiltersLoadingScreen from './FiltersLoadingScreen';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/LoadingAnimation/LoadingAnimation', () => () => (
    <div data-tid='loading-animation' />
));

describe('<FiltersLoadingScreen />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('should render LoadingAnimation, title and subtitle', () => {
        render(<FiltersLoadingScreen />);

        expect(screen.getByTestId('loading-animation')).toBeInTheDocument();
        expect(screen.getByRole('heading')).toHaveTextContent(
            SitecoreDictionary.SearchPodFiltersPromoPageLabelsLoadingTitle,
        );
        expect(screen.getByTestId('filters-loading-subtitle')).toHaveTextContent(
            'SearchPodFilters.PromoPage.Labels.LoadingSubtitle',
        );
    });
});
