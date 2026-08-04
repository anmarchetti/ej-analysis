import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockFlightsRoutes } from 'frontend/__mocks__';
import { IOffer } from 'models/data/IOffer';

import { OtherRoutesResultsList, TOtherRoutesListProps } from './OtherRoutesList';

jest.mock('./RouteItem/OtherRoutesItem', () => ({ onSelect }) => <a data-tid='route-item' onClick={onSelect} />);

const createProps = () =>
    ({
        offer: { transport: { routes: [...mockFlightsRoutes] } } as IOffer,
        alternativeFlights: [
            { transport: { routes: [...mockFlightsRoutes] } } as IOffer,
            { transport: { routes: [{}, {}] } } as IOffer,
        ],
        onSelectRoute: jest.fn(),
    } as TOtherRoutesListProps);

const createStores = () => ({
    layoutStore: { getSetting: jest.fn(), isPromoPage: false, currentPath: '' },
    routerStore: { hotelDetailsUrl: jest.fn() },
    queryParamStore: { buildHotelDetailsQuery: jest.fn() },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<OtherRoutesList />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render list', () => {
        render(<OtherRoutesResultsList {...mockProps} />);

        expect(screen.getAllByTestId('route-item')).toHaveLength(mockProps.alternativeFlights.length);
    });

    it('Should call onSelectRoute when item clicked', () => {
        render(<OtherRoutesResultsList {...mockProps} />);

        fireEvent.click(screen.getAllByTestId('route-item')[0]);

        expect(mockProps.onSelectRoute).toHaveBeenCalledWith(mockProps.alternativeFlights[0], true);
    });
});
