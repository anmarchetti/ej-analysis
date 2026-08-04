import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import SelectedAirportParkingCard from './SelectedAirportParkingCard';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/date.utils', () => ({
    __esModule: true,
    formatDateL10n: jest.fn(date => date),
    getTimeWithoutSeconds: jest.fn(date => date),
}));

const props = {
    promoBanner: <div data-tid='promo-banner' />,
    selectedFromDate: 'From: {Date} {Time}',
    selectedParkingText: 'Selected Parking',
    selectedToDate: 'To: {Date} {Time}',
    cardTitle: 'Test Parking',
};

const createLocalStore = () => ({
    tracking: {
        trackParkingModuleInExtrasPageImpression: jest.fn(),
        trackBuyNowCtaClick: jest.fn(),
        trackSelectedParkingRemoveButton: jest.fn(),
        trackSelectedParkingEditButton: jest.fn(),
        trackAirportParkingUpdatedInExtrasPage: jest.fn(),
    },
});

let mockUseAirportParkingLocalStore;

jest.mock('frontend/components/renderings/AirportParking/stores/airportParkingLocalStore', () => ({
    ...jest.requireActual('frontend/components/renderings/AirportParking/stores/airportParkingLocalStore'),
    useAirportParkingLocalStore: () => mockUseAirportParkingLocalStore,
    withAirportParkingLocalStore: Component => Component,
}));

describe('<SelectedAirportParkingCard />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            airportParkingStore: {
                toggleIsParkingPopupOpened: jest.fn(),
                validateParking: jest.fn(),
                selectedAirportParking: {
                    brandImage: 'test-image-url.png',
                    title: 'Test Parking',
                    bookingDetails: {
                        totalPrice: 100,
                        startDate: '2023-10-01',
                        startTime: '10:00',
                        endDate: '2023-10-10',
                        endTime: '18:00',
                    },
                },
            },
        });
        mockUseAirportParkingLocalStore = createLocalStore();
    });

    it('should render correctly with all props', () => {
        render(<SelectedAirportParkingCard {...props} />);
        expect(screen.getByText('Test Parking')).toBeInTheDocument();
        expect(screen.getByText('£100')).toBeInTheDocument();
        expect(screen.getByTestId('selected-parking-from-date')).toBeInTheDocument();
        expect(screen.getByTestId('selected-parking-to-date')).toBeInTheDocument();
        expect(screen.getByTestId('selected-parking-image-box')).toBeInTheDocument();
    });

    it('should render null if no selectedAirportParking', () => {
        mockStores.airportParkingStore.selectedAirportParking = null;

        const { container } = render(<SelectedAirportParkingCard {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render image when imageUrl is provided', () => {
        render(<SelectedAirportParkingCard {...props} />);

        expect(screen.queryByTestId('selected-parking-image-box')).toBeInTheDocument();
        expect(screen.queryByTestId('selected-parking-image-box')).toHaveStyle({
            backgroundImage: 'url(test-image-url.png)',
        });
        expect(screen.queryByTestId('selected-parking-no-image-box')).not.toBeInTheDocument();
    });

    it('should render buttons', () => {
        render(<SelectedAirportParkingCard {...props} />);

        expect(screen.getByTestId('selected-parking-remove-btn')).toBeInTheDocument();
        expect(screen.getByTestId('selected-parking-edit-btn')).toBeInTheDocument();
    });

    it('should render grey background when imageUrl is not provided', () => {
        mockStores.airportParkingStore.selectedAirportParking.brandImage = '';
        render(<SelectedAirportParkingCard {...props} />);

        expect(screen.queryByTestId('selected-parking-image-box')).not.toBeInTheDocument();
        expect(screen.getByTestId('selected-parking-no-image-box')).toBeInTheDocument();
    });

    it('should call validateParking when selected-parking-remove-btn is clicked', async () => {
        render(<SelectedAirportParkingCard {...props} />);

        await userEvent.click(screen.getByTestId('selected-parking-remove-btn'));

        expect(mockStores.airportParkingStore.validateParking).toHaveBeenCalledWith(
            null,
            mockUseAirportParkingLocalStore.tracking.trackAirportParkingUpdatedInExtrasPage,
        );
        expect(mockUseAirportParkingLocalStore.tracking.trackSelectedParkingRemoveButton).toHaveBeenCalledWith(
            mockStores.airportParkingStore.selectedAirportParking,
        );
    });

    it('should call toggleIsParkingPopupOpened popup when selected-parking-edit-btn is clicked', async () => {
        render(<SelectedAirportParkingCard {...props} />);

        await userEvent.click(screen.getByTestId('selected-parking-edit-btn'));

        expect(mockStores.airportParkingStore.toggleIsParkingPopupOpened).toHaveBeenCalledTimes(1);
        expect(mockUseAirportParkingLocalStore.tracking.trackSelectedParkingEditButton).toHaveBeenCalledWith(
            SitecoreDictionary.GlobalsButtonsEdit,
            props.cardTitle,
        );
    });
});
