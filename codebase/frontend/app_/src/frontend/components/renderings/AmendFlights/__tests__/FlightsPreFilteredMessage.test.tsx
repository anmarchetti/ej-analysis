import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import FlightsPreFilteredMessage from 'frontend/components/renderings/AmendFlights/components/FlightsPreFilteredMessage';

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    amendFlightsStore: { togglePreFilteredMessage: jest.fn(), selectedDepartureAirports: [] },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FlightsPreFilteredMessage />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render all elements', () => {
        const { getByRole, getByText, container } = render(<FlightsPreFilteredMessage />);

        expect(getByRole('button')).toBeInTheDocument();
        expect(getByText(SitecoreDictionary.AmendFlightsLabelsPreFilteredResultsMessage)).toBeInTheDocument();
        expect(container.getElementsByClassName('filters-tooltip__icon').length).toBe(1);
    });

    it('should call togglePreFilteredMessage if button clicked', () => {
        const { getByRole } = render(<FlightsPreFilteredMessage />);

        const button = getByRole('button');
        fireEvent.click(button);
        expect(mockStores.amendFlightsStore.togglePreFilteredMessage).toBeCalled();
    });
});
