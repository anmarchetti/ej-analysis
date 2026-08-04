import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IAirportParking } from 'models/data/externalExtras/IAirportParking';
import SiteSettings from 'models/enum/SiteSettings';

import ParkingListPopup from './ParkingListPopup';

const mockShowMoreButton = jest.fn();
jest.mock('frontend/components/common/ShowMoreButton', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockShowMoreButton(props);

        return <button data-tid='show-more-button' onClick={onClick} />;
    },
}));

const mockFullScreenPopup = jest.fn();
jest.mock('frontend/components/common/FullScreenPopup/FullScreenPopup', () => ({
    __esModule: true,
    default: ({ navigationActionBlock, popupBarContent, children, onClose, ...props }) => {
        mockFullScreenPopup(props);

        return (
            <div data-tid='full-screen-popup'>
                {navigationActionBlock}
                {popupBarContent}
                {children}
                <button data-tid='close-popup' onClick={onClose} />
            </div>
        );
    },
}));

const mockParkingCard = jest.fn();
jest.mock('frontend/components/renderings/AirportParking/components/ParkingCard/ParkingCard', () => ({
    __esModule: true,
    default: airportParking => {
        mockParkingCard(airportParking);

        return <div data-tid='parking-card' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const fillParkings = (length: number = 7): IAirportParking[] =>
    Array.from({ length }, (_, i) => ({
        title: `Parking Title ${i}`,
        address: '123 Main St., Luton 123EAB',
        bookingDetails: {
            totalPrice: 25,
            endDate: '',
            endTime: '',
            extRefId: '',
            productCode: '',
            promotionCode: '',
            startDate: '',
            startTime: '',
            type: '',
            keyData: '',
        },
        description: 'Sell point',
        transferTip: 'Transfer tip',
        brandImage: '/image.jpg',
        isMeetAndGreet: false,
        isParkAndRide: false,
        isParkAndStroll: false,
    }));

const props = {
    ParkingCardTransfersText: mockSitecoreField('Transfers'),
    BackToExtrasButtonText: mockSitecoreField('Back to Extras'),
    ParkingListMoreInfoButtonText: mockSitecoreField('More Info'),
    onClose: jest.fn(),
    SkipParkingButtonText: mockSitecoreField('Skip Parking'),
    title: 'Parking List',
    promoBanner: <div data-tid='promo-banner' />,
};

const createLocalStore = () => ({
    tracking: {
        trackParkingListPageLoad: jest.fn(),
        trackParkingListCtaClick: jest.fn(),
        trackParkingListEcommerceDimensions: jest.fn(),
    },
});

jest.mock('frontend/components/renderings/AirportParking/stores/airportParkingLocalStore', () => ({
    ...jest.requireActual('frontend/components/renderings/AirportParking/stores/airportParkingLocalStore'),
    useAirportParkingLocalStore: () => mockUseAirportParkingLocalStore,
}));

let mockStores;
let mockUseAirportParkingLocalStore;

describe('ParkingListPopup', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            airportParkingStore: {
                airportParkings: fillParkings(),
                fetchAirportParkings: jest.fn(),
                toggleIsParkingPopupOpened: jest.fn(),
            },
            layoutStore: {
                getSetting: jest.fn().mockReturnValue(6),
            },
        });
        mockUseAirportParkingLocalStore = createLocalStore();
    });

    it('should render null when airportParkings is not defined', () => {
        mockStores = createMockStores({
            airportParkingStore: {
                airportParkings: undefined,
            },
        });

        const { container } = render(<ParkingListPopup {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should use maxVisibleParkings setting from sitecore', () => {
        render(<ParkingListPopup {...props} />);

        expect(mockStores.layoutStore.getSetting).toHaveBeenCalledWith(SiteSettings.MaxVisibleParkings);
    });

    it('should display maximum of 6 parkings if maxVisibleParkings setting is not present', () => {
        mockStores.layoutStore.getSetting = jest.fn();

        render(<ParkingListPopup {...props} />);

        expect(mockStores.layoutStore.getSetting).toHaveBeenCalledWith(SiteSettings.MaxVisibleParkings);
        expect(screen.getAllByTestId('parking-card')).toHaveLength(6);
    });

    it('should display maximum of 6 parkings if maxVisibleParkings setting is not an integer', () => {
        mockStores.layoutStore.getSetting = jest.fn().mockReturnValue('notAnInteger');

        render(<ParkingListPopup {...props} />);

        expect(mockStores.layoutStore.getSetting).toHaveBeenCalledWith(SiteSettings.MaxVisibleParkings);

        expect(screen.getAllByTestId('parking-card')).toHaveLength(6);
    });

    it('should display price of parking correctly', () => {
        mockStores.layoutStore.getSetting = jest.fn().mockReturnValue('notAnInteger');

        render(<ParkingListPopup {...props} />);

        expect(mockStores.layoutStore.getSetting).toHaveBeenCalledWith(SiteSettings.MaxVisibleParkings);

        expect(screen.getAllByTestId('parking-card')).toHaveLength(6);
    });

    it('should show all parkings when "Show More" button is clicked', async () => {
        render(<ParkingListPopup {...props} />);

        const showMoreButton = screen.getByTestId('show-more-button');
        await userEvent.click(showMoreButton);

        await waitFor(() => {
            expect(screen.queryByTestId('show-more-button')).toBeInTheDocument();
            expect(mockShowMoreButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isChevronUp: true,
                    title: 'Globals.Labels.ShowLess',
                }),
            );
            expect(screen.getAllByTestId('parking-card')).toHaveLength(7);
        });
    });

    it('should not show "Show More" button and add parkingContainerFull class when there are fewer parkings than maxVisibleParkings', () => {
        mockStores.airportParkingStore.airportParkings = fillParkings(1);

        render(<ParkingListPopup {...props} />);

        expect(screen.getByTestId('parking-cards-container')).toHaveClass('parkingContainerFull');
        expect(screen.queryByTestId('show-more-button')).not.toBeInTheDocument();
    });

    it('should show "Show More" button and NOT add parkingContainerFull class when there are more parkings than maxVisibleParkings', () => {
        render(<ParkingListPopup {...props} />);

        expect(screen.getByTestId('parking-cards-container')).not.toHaveClass('parkingContainerFull');
        expect(screen.getByTestId('show-more-button')).toBeInTheDocument();
    });

    it('should hide parkings when "Show less" button is clicked', async () => {
        render(<ParkingListPopup {...props} />);

        const showMoreButton = screen.getByTestId('show-more-button');
        await userEvent.click(showMoreButton);

        expect(mockShowMoreButton).toHaveBeenCalledWith(
            expect.objectContaining({
                isChevronUp: true,
                title: 'Globals.Labels.ShowLess',
            }),
        );

        await userEvent.click(showMoreButton);

        await waitFor(() => {
            expect(mockShowMoreButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isChevronUp: false,
                    title: 'Globals.Labels.ShowMore',
                }),
            );
            expect(screen.getAllByTestId('parking-card')).toHaveLength(6);
        });
    });

    it('should toggle pop up with close button is pressed', async () => {
        render(<ParkingListPopup {...props} />);

        const closePopUpButton = screen.getByTestId('close-popup');
        closePopUpButton.click();

        expect(mockStores.airportParkingStore.toggleIsParkingPopupOpened).toHaveBeenCalled();
    });

    it('should NOT call tracking methods when isAirportParkingsInitialized is false', () => {
        mockStores.airportParkingStore.isAirportParkingsInitialized = false;

        render(<ParkingListPopup {...props} />);

        expect(mockUseAirportParkingLocalStore.tracking.trackParkingListPageLoad).not.toHaveBeenCalled();
        expect(mockUseAirportParkingLocalStore.tracking.trackParkingListEcommerceDimensions).not.toHaveBeenCalled();
    });

    it('should call tracking methods when the popup is loaded and isAirportParkingsInitialized is true', async () => {
        mockStores.airportParkingStore.isAirportParkingsInitialized = true;

        render(<ParkingListPopup {...props} />);

        await waitFor(() => {
            expect(mockUseAirportParkingLocalStore.tracking.trackParkingListPageLoad).toHaveBeenCalled();
        });
        expect(mockUseAirportParkingLocalStore.tracking.trackParkingListEcommerceDimensions).toHaveBeenCalled();
    });

    it('should call tracking.trackParkingListCtaClick when the close button is clicked', async () => {
        render(<ParkingListPopup {...props} />);

        const closePopUpButton = screen.getByTestId('close-popup');
        await userEvent.click(closePopUpButton);

        expect(mockUseAirportParkingLocalStore.tracking.trackParkingListCtaClick).toHaveBeenCalledWith(
            'Back to Extras',
            props.title,
        );
    });

    it('should call tracking.trackParkingListCtaClick when the show more button is clicked', async () => {
        render(<ParkingListPopup {...props} />);

        const showMoreButton = screen.getByTestId('show-more-button');
        await userEvent.click(showMoreButton);

        expect(mockUseAirportParkingLocalStore.tracking.trackParkingListCtaClick).toHaveBeenCalledWith(
            'Globals.Labels.ShowMore',
            props.title,
        );
    });

    it('should not call trackParkingListEcommerceDimensions when displayedAirportParkings is null', async () => {
        mockStores.airportParkingStore.airportParkings = null;
        mockStores.airportParkingStore.isAirportParkingsInitialized = true;

        render(<ParkingListPopup {...props} />);

        await waitFor(() => {
            expect(mockUseAirportParkingLocalStore.tracking.trackParkingListPageLoad).toHaveBeenCalled();
            expect(mockUseAirportParkingLocalStore.tracking.trackParkingListEcommerceDimensions).not.toHaveBeenCalled();
        });
    });
});
