import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import StartBookingButton from './StartBookingButton';

let mockProps;
let mockStores;

const createProps = () => ({
    render: jest.fn(onClick => <button onClick={onClick}>render</button>),
});

const createStores = () => ({
    bookingStore: {
        changeIsClickChangeButton: jest.fn(),
        updatePreviousPriceFormOffer: jest.fn(),
        validatePackage: jest.fn(),
        updateRoomsAllocationFromSearchStore: jest.fn(),
        storeOriginalBooking: jest.fn(),
        isGuestsParametersValid: false,
    },
    searchStore: {
        validateSearchParameters: jest.fn(() => true),
        retreiveSearchParameters: jest.fn(),
    },
    routerStore: {
        redirectToExtrasPage: jest.fn(),
        redirectToBundlesPage: jest.fn(),
    },
    appStore: {
        setNavigationBooking: jest.fn(),
    },
    trackingStore: {
        clearSitTogetherSessionStorage: jest.fn(),
    },
    layoutStore: {
        isBundlesPageEnabled: false,
        isBundlesPage: false,
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<StartBookingButton />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('should render children', () => {
        const { getByText } = render(<StartBookingButton {...mockProps} />);

        expect(getByText('render')).toBeInTheDocument();
    });

    it('should handle invalid guest information', () => {
        const { getByText } = render(<StartBookingButton {...mockProps} />);

        const children = getByText('render');
        fireEvent.click(children);

        expect(mockStores.bookingStore.updateRoomsAllocationFromSearchStore).not.toHaveBeenCalled();
    });

    it('should handle valid guest information', () => {
        mockStores.searchStore.validateSearchParameters = jest.fn(() => false);
        const { getByText } = render(<StartBookingButton {...mockProps} />);

        const children = getByText('render');
        fireEvent.click(children);

        expect(mockStores.bookingStore.updateRoomsAllocationFromSearchStore).toHaveBeenCalled();
        expect(mockStores.bookingStore.changeIsClickChangeButton).toHaveBeenCalledWith(false);
        expect(mockStores.appStore.setNavigationBooking).toHaveBeenCalledWith(true);
        expect(mockStores.bookingStore.updatePreviousPriceFormOffer).toHaveBeenCalled();
        expect(mockStores.bookingStore.validatePackage).toHaveBeenCalled();
        expect(mockStores.trackingStore.clearSitTogetherSessionStorage).toHaveBeenCalled();
        expect(mockStores.routerStore.redirectToExtrasPage).toHaveBeenCalled();
        expect(mockStores.searchStore.retreiveSearchParameters).toHaveBeenCalled();
    });

    it('should handle reliable information about guests', () => {
        mockStores.bookingStore.isGuestsParametersValid = true;
        const { getByText } = render(<StartBookingButton {...mockProps} />);

        const children = getByText('render');
        fireEvent.click(children);

        expect(mockStores.bookingStore.updateRoomsAllocationFromSearchStore).not.toHaveBeenCalled();
        expect(mockStores.bookingStore.changeIsClickChangeButton).toHaveBeenCalledWith(false);
    });

    it('should redirect to bundles page when bundles page is enabled and page is not bundles', () => {
        mockStores.layoutStore.isBundlesPageEnabled = true;
        mockStores.bookingStore.isGuestsParametersValid = true;

        const { getByText } = render(<StartBookingButton {...mockProps} />);
        const children = getByText('render');
        fireEvent.click(children);

        expect(mockStores.routerStore.redirectToBundlesPage).toHaveBeenCalled();
        expect(mockStores.routerStore.redirectToExtrasPage).not.toHaveBeenCalled();
    });

    it('should redirect to extras page when bundles page is enabled and the page is bundles', () => {
        mockStores.layoutStore.isBundlesPageEnabled = true;
        mockStores.layoutStore.isBundlesPage = true;
        mockStores.bookingStore.isGuestsParametersValid = true;

        const { getByText } = render(<StartBookingButton {...mockProps} />);
        const children = getByText('render');
        fireEvent.click(children);

        expect(mockStores.routerStore.redirectToBundlesPage).not.toHaveBeenCalled();
        expect(mockStores.routerStore.redirectToExtrasPage).toHaveBeenCalled();
    });

    it('should redirect to extras page when bundles page is NOT enabled', () => {
        mockStores.bookingStore.isGuestsParametersValid = true;

        const { getByText } = render(<StartBookingButton {...mockProps} />);
        const children = getByText('render');
        fireEvent.click(children);

        expect(mockStores.routerStore.redirectToBundlesPage).not.toHaveBeenCalled();
        expect(mockStores.routerStore.redirectToExtrasPage).toHaveBeenCalled();
    });

    it('should store the base accommodation in the session storage when validating package', () => {
        mockStores.bookingStore.isGuestsParametersValid = true;

        const { getByText } = render(<StartBookingButton {...mockProps} />);
        const children = getByText('render');
        fireEvent.click(children);

        expect(mockStores.bookingStore.storeOriginalBooking).toHaveBeenCalled();
    });
});
