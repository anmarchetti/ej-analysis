import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { IParkingCardProps, ParkingCard } from './ParkingCard';

let props;
let mockStores;
let mockUseAirportParkingLocalStore;

const createMockStoreContext = () =>
    createMockStores({
        layoutStore: {
            getPhrase: jest.fn(k => k),
            isShortlistPage: false,
            isParkingDetailsViewPageEnabled: true,
            isAirportParkingFreeCancellationPillEnabled: false,
        },
        airportParkingStore: {
            validateParking: jest.fn(),
            setSelectedAirportParkingDetails: jest.fn(),
            toggleIsParkingDetailsPopupOpened: jest.fn(),
        },
    });
const createProps: () => IParkingCardProps = () => ({
    ParkingCardTransfersText: mockSitecoreField('transfers'),
    ParkingListMoreInfoButtonText: mockSitecoreField('More Info'),
    airportParking: {
        address: '123 Main St., Luton 123EAB',
        title: 'Parking title',
        description: 'Parking description',
        brandImage: 'test/image-url',
        transferTip: 'Meet and Greet',
        bookingDetails: {
            productCode: 'LTM9',
            totalPrice: 56.99,
            startTime: '14:35:00',
            endTime: '14:50:00',
            extRefId: 'Ref1',
            type: 'MEET_AND_GREET',
            startDate: '2025-01-12T00:00:00',
            endDate: '2025-01-16T00:00:00',
            promotionCode: 'PROMO',
            keyData: 'Testing',
        },
        isMeetAndGreet: false,
        isParkAndRide: false,
        isParkAndStroll: false,
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid={props['data-tid'] || 'sitecore-jss-text'}>{props.field.value}</div>;
    },
}));

const createLocalStore = () => ({
    tracking: {
        trackBookParkingCtaClick: jest.fn(),
        trackAirportParkingUpdatedInExtrasPage: jest.fn(),
        trackExtrasPageLoadAfterSelectingParking: jest.fn(),
    },
});

jest.mock('frontend/components/renderings/AirportParking/stores/airportParkingLocalStore', () => ({
    ...jest.requireActual('frontend/components/renderings/AirportParking/stores/airportParkingLocalStore'),
    useAirportParkingLocalStore: () => mockUseAirportParkingLocalStore,
}));

describe('<ParkingCard />', () => {
    beforeEach(() => {
        props = createProps();
        mockUseAirportParkingLocalStore = createLocalStore();
        mockStores = createMockStoreContext();
    });

    it('should render correctly', () => {
        render(<ParkingCard {...props} />);

        expect(screen.getByText('Parking description')).toBeInTheDocument();
        expect(screen.getByText('Meet and Greet')).toBeInTheDocument();
        expect(screen.getByText('Parking title')).toBeInTheDocument();
    });

    it('should render image when imageUrl is provided', () => {
        render(<ParkingCard {...props} />);

        expect(screen.queryByTestId('image-box')).toBeInTheDocument();
        expect(screen.queryByTestId('image-box')).toHaveStyle({ backgroundImage: 'url(test/image-url)' });
        expect(screen.queryByTestId('no-image-box')).not.toBeInTheDocument();
    });

    it('should render "Book for" button', () => {
        render(<ParkingCard {...props} />);

        expect(screen.queryByRole('button', { name: 'Globals.Buttons.BookFor' })).toBeInTheDocument();
    });

    it('should render grey background when imageUrl is not provided', () => {
        props.airportParking.brandImage = '';
        render(<ParkingCard {...props} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByTestId('no-image-box')).toBeInTheDocument();
    });

    it('should call validate parking on book button click', async () => {
        render(<ParkingCard {...props} />);

        const bookParkingBtn = screen.getByTestId('parking-card-book-now-btn');
        await userEvent.click(bookParkingBtn);

        expect(mockStores.airportParkingStore.validateParking).toHaveBeenCalledWith(
            props.airportParking,
            expect.any(Function),
        );
    });

    it('should not show more info btn when isParkingDetailsViewPageEnabled is false', async () => {
        mockStores.layoutStore.isParkingDetailsViewPageEnabled = false;
        render(<ParkingCard {...props} />);

        expect(screen.queryByTestId('parking-card-more-info-btn')).not.toBeInTheDocument();
    });

    it('should set selectedAirportParkingDetails when click more info btn', async () => {
        render(<ParkingCard {...props} />);

        const bookParkingBtn = screen.getByTestId('parking-card-more-info-btn');
        await userEvent.click(bookParkingBtn);

        expect(mockStores.airportParkingStore.setSelectedAirportParkingDetails).toHaveBeenCalledWith(
            props.airportParking,
        );
    });

    it('should toggle airport parking details popup when click more info btn', async () => {
        render(<ParkingCard {...props} />);

        const bookParkingBtn = screen.getByTestId('parking-card-more-info-btn');
        await userEvent.click(bookParkingBtn);

        expect(mockStores.airportParkingStore.toggleIsParkingDetailsPopupOpened).toHaveBeenCalled();
    });

    it('should call tracking methods on book button click', async () => {
        mockStores.airportParkingStore.validateParking.mockImplementation(
            async (_airportParking, onSuccessCallback) => {
                await onSuccessCallback();
            },
        );

        render(<ParkingCard {...props} />);

        const bookParkingBtn = screen.getByTestId('parking-card-book-now-btn');
        await userEvent.click(bookParkingBtn);

        await waitFor(() => {
            expect(
                mockUseAirportParkingLocalStore.tracking.trackExtrasPageLoadAfterSelectingParking,
            ).toHaveBeenCalled();
        });
        expect(mockUseAirportParkingLocalStore.tracking.trackAirportParkingUpdatedInExtrasPage).toHaveBeenCalled();
    });

    it('should add Transfers to transferTip', async () => {
        props.airportParking.isMeetAndGreet = false;
        render(<ParkingCard {...props} />);

        expect(mockTextProps).toHaveBeenCalledWith({
            field: props.ParkingCardTransfersText,
            tag: 'span',
            ['data-tid']: 'transfers-text',
            className: 'transferTip',
        });

        expect(screen.getByTestId('transfers-text')).toHaveTextContent(props.ParkingCardTransfersText.value);
    });

    it('should NOT add Transfers to transferTip when isMeetAndGreet is true', async () => {
        props.airportParking.isMeetAndGreet = true;
        render(<ParkingCard {...props} />);

        expect(screen.queryByTestId('transfers-text')).not.toBeInTheDocument();
    });

    it('should call tracking.trackBookParkingCtaClick on book button click', async () => {
        render(<ParkingCard {...props} />);
        const bookParkingBtn = screen.getByTestId('parking-card-book-now-btn');
        await userEvent.click(bookParkingBtn);

        expect(mockUseAirportParkingLocalStore.tracking.trackBookParkingCtaClick).toHaveBeenCalledWith(
            props.airportParking,
        );
    });

    it('should add FreeCancellationPill if isAirportParkingFreeCancellationPillEnabled is true', async () => {
        mockStores.layoutStore.isAirportParkingFreeCancellationPillEnabled = true;
        render(<ParkingCard {...props} />);

        expect(screen.queryByTestId('free-cancellation-pill')).toBeInTheDocument();
        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalled();
    });

    it('should NOT add FreeCancellationPill if isAirportParkingFreeCancellationPillEnabled is false', async () => {
        mockStores.layoutStore.isAirportParkingFreeCancellationPillEnabled = false;
        render(<ParkingCard {...props} />);

        expect(screen.queryByTestId('free-cancellation-pill')).not.toBeInTheDocument();

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalled();
    });

    it('should add MeetAndGreetPill if isMeetAndGreet is true', async () => {
        props.airportParking.isMeetAndGreet = true;
        render(<ParkingCard {...props} />);

        expect(screen.queryByTestId('meet-and-greet-pill')).toBeInTheDocument();

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalled();
    });

    it('should NOT add MeetAndGreetPill if isMeetAndGreet is false', async () => {
        props.airportParking.isMeetAndGreet = false;
        render(<ParkingCard {...props} />);

        expect(screen.queryByTestId('meet-and-greet-pill')).not.toBeInTheDocument();

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalled();
    });

    it('should add ParkAndRidePill if isParkAndRide is true', async () => {
        props.airportParking.isParkAndRide = true;
        render(<ParkingCard {...props} />);

        expect(screen.queryByTestId('park-and-ride-pill')).toBeInTheDocument();

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalled();
    });

    it('should NOT add ParkAndRidePill if isParkAndRide is false', async () => {
        props.airportParking.isParkAndRide = false;
        render(<ParkingCard {...props} />);

        await waitFor(() => {
            expect(screen.queryByTestId('park-and-ride-pill')).not.toBeInTheDocument();
        });
        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalled();
    });

    it('should add ParkAndStrollPill if isParkAndStroll is true', async () => {
        props.airportParking.isParkAndStroll = true;
        render(<ParkingCard {...props} />);

        expect(screen.queryByTestId('park-and-stroll-pill')).toBeInTheDocument();

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalled();
    });

    it('should NOT add ParkAndStrollPill if isParkAndStroll is false', async () => {
        props.airportParking.isParkAndStroll = false;
        render(<ParkingCard {...props} />);

        expect(screen.queryByTestId('park-and-stroll-pill')).not.toBeInTheDocument();

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalled();
    });
});
