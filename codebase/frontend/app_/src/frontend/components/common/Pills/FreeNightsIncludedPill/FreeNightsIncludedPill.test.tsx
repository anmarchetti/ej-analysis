import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { FreeNightsIncludedPill } from './FreeNightsIncludedPill';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Pills/PricePill/PricePill', () => ({ children }) => (
    <div data-tid='price-pill'>{children}</div>
));

describe('<FreeNightsIncludedPill />', () => {
    beforeEach(() => {
        mockStores = createMockStores({ layoutStore: { isFreeNightsEnabled: true } });
    });

    it('Should be empty render if free nights setting turned off', () => {
        mockStores.layoutStore.isFreeNightsEnabled = false;
        const { container } = render(<FreeNightsIncludedPill nights={1} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Should be empty render if no included free nights', () => {
        const { container } = render(<FreeNightsIncludedPill nights={0} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Should render the pill with one included free night', () => {
        render(<FreeNightsIncludedPill nights={1} />);
        expect(screen.getByTestId('price-pill')).toHaveTextContent(
            SitecoreDictionary.FreeUpgradesLabelsFreeNightIncludedSingular,
        );
    });

    it('Should render the pill with several included free nights', () => {
        render(<FreeNightsIncludedPill nights={2} />);
        expect(screen.getByTestId('price-pill')).toHaveTextContent(
            SitecoreDictionary.FreeUpgradesLabelsFreeNightsIncludedPlural,
        );
    });
});
