import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import OtherDepartureAirportsPopup from './OtherDepartureAirportsPopup';

const createProps = () => ({
    airportName: 'airport',
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    routerStore: { redirectToAmendFlightsPage: jest.fn() },
    amendFlightsStore: {
        isFilterSelected: jest.fn(),
        onSelectFilter: jest.fn(),
        departureAirports: [{ name: 'name1', code: '1', count: 2 }],
        selectedDepartureAirports: [],
        toggleOtherDepartureAirportsPopup: jest.fn(),
    },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<OtherDepartureAirportsPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        global.scrollTo = jest.fn();
    });

    it('should render all elements', () => {
        const { getByRole, getAllByRole, getByText } = render(<OtherDepartureAirportsPopup {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent(SitecoreDictionary.AmendFlightsOtherAirportsPopupLabelsTitle);
        expect(getByText(SitecoreDictionary.AmendFlightsOtherAirportsPopupLabelsDescription)).toBeInTheDocument();
        expect(getAllByRole('checkbox').length).toBe(1);
        expect(getAllByRole('button').length).toBe(3);
    });

    it('should NOT render description', () => {
        mockStores.layoutStore.getPhrase = jest.fn(p => {
            if (p === SitecoreDictionary.AmendFlightsOtherAirportsPopupLabelsDescription) {
                return '';
            }

            return p;
        });
        const { container } = render(<OtherDepartureAirportsPopup {...mockProps} />);

        expect(container.getElementsByClassName('my-0').length).toBe(0);
    });

    it('should call toggleOtherDepartureAirportsPopup when cancel button is clicked', () => {
        const { getByText } = render(<OtherDepartureAirportsPopup {...mockProps} />);

        const button = getByText(SitecoreDictionary.AmendFlightsOtherAirportsPopupButtonsCancel);
        fireEvent.click(button);
        expect(mockStores.amendFlightsStore.toggleOtherDepartureAirportsPopup).toHaveBeenCalled();
    });

    it('should NOT call redirectToAmendFlightsPage when submit button is clicked but no airports selected', () => {
        const { getByText } = render(<OtherDepartureAirportsPopup {...mockProps} />);

        const button = getByText(SitecoreDictionary.AmendFlightsOtherAirportsPopupButtonsSeeFlights);
        fireEvent.click(button);
        expect(mockStores.routerStore.redirectToAmendFlightsPage).toHaveBeenCalledTimes(0);
    });

    it('should call redirectToAmendFlightsPage when submit button is clicked and airport is selected', () => {
        mockStores.amendFlightsStore.selectedDepartureAirports.length = 1;
        const { getByText } = render(<OtherDepartureAirportsPopup {...mockProps} />);

        const button = getByText(SitecoreDictionary.AmendFlightsOtherAirportsPopupButtonsSeeFlights);
        fireEvent.click(button);
        expect(mockStores.routerStore.redirectToAmendFlightsPage).toHaveBeenCalledTimes(1);
    });
});
