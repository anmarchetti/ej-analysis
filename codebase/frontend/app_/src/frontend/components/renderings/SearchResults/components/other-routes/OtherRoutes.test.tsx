import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import bookingService from 'frontend/services/booking.service';
import * as sortUtils from 'frontend/utils/sort.utils';
import { IOffer } from 'models/data/IOffer';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { OtherRoutesActions } from 'models/enum/tracking/OtherRoutesActions';

import OtherRoutes from './OtherRoutes';

jest.mock('frontend/services/booking.service');
const mockGetOtherRoutes = bookingService.getOtherRoutes as jest.MockedFn<typeof bookingService.getOtherRoutes>;
const mockOtherRoutesPopup = jest.fn();
const mockSortFlights = jest.spyOn(sortUtils, 'sortFlights');

jest.mock(
    './OtherRoutesPopup/OtherRoutesPopup',
    () =>
        ({ isOpen, onClose, onSelectRoute, alternativeFlights, ...props }) => {
            mockOtherRoutesPopup(props);

            return isOpen ? (
                <div data-tid='popup'>
                    <button onClick={onClose}>Popup Close</button>
                    <>
                        {alternativeFlights.map((o, i) => (
                            <a key={i} onClick={() => onSelectRoute(o, false)} data-tid='route' />
                        ))}
                    </>
                </div>
            ) : null;
        },
);

const createProps = () => ({
    offer: {} as IOffer,
    alternativeFlightsDefaultSort: AlternativeFlightsSortBy.PriceHightToLow,
    alternativeFlightsSortOrders: [
        {
            label: 'default code',
            value: AlternativeFlightsSortBy.PriceHightToLow,
        },
        {
            label: 'default code 1 ',
            value: 'default sort 1',
        },
    ],
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), layoutId: 'id' },
    bookingStore: { setOtherRoutesValue: jest.fn() },
    trackingStore: { trackOtherRoutesClick: jest.fn() },
    promoPageStore: { saveSearchParamsAndFilterToLocalStorage: jest.fn() },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<OtherRoutes />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render link and closed popup', () => {
        render(<OtherRoutes {...mockProps} />);

        expect(
            screen.getByRole('link', { name: SitecoreDictionary.SearchResultsLabelsShowOtherRoutes }),
        ).toBeInTheDocument();
        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
    });

    it('should render with custom class', () => {
        mockProps.className = 'custom-class';

        const { container } = render(<OtherRoutes {...mockProps} />);

        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should load routes and open popup when click on link', async () => {
        render(<OtherRoutes {...mockProps} />);

        const link = screen.getByRole('link', { name: SitecoreDictionary.SearchResultsLabelsShowOtherRoutes });

        await userEvent.click(link);
        await waitFor(() => expect(mockGetOtherRoutes).toHaveBeenCalledWith(mockProps.offer));

        expect(mockStores.trackingStore.trackOtherRoutesClick).toBeCalledWith(EventTypes.ShowOtherRoutesClick);
        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockOtherRoutesPopup).toHaveBeenNthCalledWith(1, {
            isLoading: false,
            offer: {},
            onFlightsSort: expect.any(Function),
            selectedSortOption: { label: 'default code', value: 'PRICEDESC' },
            sortBy: mockProps.alternativeFlightsDefaultSort,
            sortOptions: mockProps.alternativeFlightsSortOrders,
        });
    });

    it('should close popup when click on close button', async () => {
        render(<OtherRoutes {...mockProps} />);

        const link = screen.getByRole('link', { name: SitecoreDictionary.SearchResultsLabelsShowOtherRoutes });

        await userEvent.click(link);
        await waitFor(() => expect(screen.getByTestId('popup')).toBeInTheDocument());

        const closeButton = screen.getByRole('button', { name: 'Popup Close' });
        fireEvent.click(closeButton);

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();

        expect(mockStores.trackingStore.trackOtherRoutesClick).toHaveBeenLastCalledWith(
            EventTypes.OtherRoutes,
            OtherRoutesActions.ModalClosed,
        );
    });

    it('should select route when click on route', async () => {
        const altFlights = [{ id: '1', otherRoutes: ['2'] } as IOffer, { id: '2', otherRoutes: ['1'] } as IOffer];
        mockGetOtherRoutes.mockResolvedValueOnce(altFlights);

        render(<OtherRoutes {...mockProps} />);

        const link = screen.getByRole('link', { name: SitecoreDictionary.SearchResultsLabelsShowOtherRoutes });

        fireEvent.click(link);

        const routes = await screen.findAllByTestId('route');

        const route = routes[0];
        fireEvent.click(route);

        expect(mockStores.bookingStore.setOtherRoutesValue).toBeCalledWith(altFlights[0].otherRoutes);
        expect(mockStores.trackingStore.trackOtherRoutesClick).toHaveBeenLastCalledWith(
            EventTypes.OtherRoutes,
            OtherRoutesActions.NewRoute,
        );
        expect(mockStores.promoPageStore.saveSearchParamsAndFilterToLocalStorage).toHaveBeenCalled();
    });

    it('should sort offers on link click change and on load', async () => {
        render(<OtherRoutes {...mockProps} />);

        expect(mockSortFlights).toHaveBeenCalled();

        const link = screen.getByRole('link', { name: SitecoreDictionary.SearchResultsLabelsShowOtherRoutes });
        await userEvent.click(link);

        expect(mockSortFlights).toHaveBeenCalledTimes(2);
    });
});
