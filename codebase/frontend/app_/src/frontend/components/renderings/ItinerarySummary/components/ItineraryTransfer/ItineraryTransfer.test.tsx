import React from 'react';
import { act, render, screen } from '@testing-library/react';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { IBookingTransfer } from 'models/data/ITransfer';
import { TransferType } from 'models/enum/transfer/TransferType';
import itinerarySummaryFieldsMocks from 'frontend/components/renderings/ItinerarySummary/__mocks__/itinerarySummaryFields';

import ItineraryTransfer, { TItineraryTransferProps } from './ItineraryTransfer';

const mockItineraryItemComponent = jest.fn();
jest.mock('frontend/components/renderings/ItinerarySummary/components/ItineraryItem/ItineraryItem', () => ({
    __esModule: true,
    default: props => {
        mockItineraryItemComponent(props);

        return (
            <div data-tid='itinerary-item'>
                {props.icon}
                {props.children}
            </div>
        );
    },
}));

const mockTransferDescriptionItem = jest.fn();
jest.mock('./TransferDescriptionItem', () => ({
    __esModule: true,
    default: props => {
        mockTransferDescriptionItem(props);

        return <div data-tid='transfer-description-item'>{props.text}</div>;
    },
}));

const mockVehicleInfo = jest.fn();
jest.mock('./VehicleInfo', () => ({
    __esModule: true,
    default: props => {
        mockVehicleInfo(props);

        return <div data-tid='vehicle-info' />;
    },
}));

const mockTransferInstructionsPopup = jest.fn();
jest.mock(
    'frontend/components/renderings/ItinerarySummary/components/TransferInstructionsPopup/TransferInstructionsPopup',
    () => ({
        __esModule: true,
        default: props => {
            mockTransferInstructionsPopup(props);

            return (
                <div data-tid='transfer-instructions-popup'>
                    <button data-tid='transfer-instructions-popup-close-btn' onClick={props.onClose} />
                </div>
            );
        },
    }),
);

jest.mock('frontend/components/common/InfoBlock/InfoBlock', () => ({
    __esModule: true,
    default: ({ text, title }) => (
        <div data-tid='info-block'>
            {title?.value}
            {text?.value}
        </div>
    ),
}));

const createMockTransfer = (): IBookingTransfer => ({
    airport: 'ACE',
    pickupDate: '2024-07-15',
    pickupTime: '2024-07-15T10:30:00',
    pickupLocation: {
        latitude: 28.945449,
        longitude: -13.598199,
    },
    pickupLocationName: 'Hotel Example',
    pickupLocationInstructions: 'Meet at lobby',
    transferMinutes: 30,
    transferType: TransferType.Private,
    vehicle: {
        provider: 'Transfer Company',
        vehicleType: 'Sedan',
        vehicleColour: 'Black',
        vehicleRegistration: 'ABC123',
        vehicleDriverName: 'John Doe',
        vehicleDriverPhone: '+34123456789',
    },
});

const createProps = (): TItineraryTransferProps => ({
    ...itinerarySummaryFieldsMocks,
    booking: mockBooking,
    isExpanded: false,
    setExpanded: jest.fn(),
    isArrival: false,
    transfer: createMockTransfer(),
});

let props: TItineraryTransferProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ItineraryTransfer />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            viewBookingStore: {
                isFlightAndHotelPackage: false,
            },
        });
    });

    describe('No Transfer', () => {
        it('should render no transfer message when transfer type is NoTransfer', () => {
            props.transfer = {
                ...createMockTransfer(),
                transferType: TransferType.NoTransfer,
            };

            render(<ItineraryTransfer {...props} />);

            expect(mockItineraryItemComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    canExpand: false,
                }),
            );
            expect(screen.getByText('You chose to make your own way')).toBeInTheDocument();
        });

        it('should render no transfer message when booking transfer type is NoTransfer', () => {
            props.transfer = undefined;
            props.booking = {
                ...mockBooking,
                transfers: [{ ...mockBooking.transfers[0], type: TransferType.NoTransfer }],
            };

            render(<ItineraryTransfer {...props} />);

            expect(mockItineraryItemComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    canExpand: false,
                }),
            );
            expect(screen.getByText('You chose to make your own way')).toBeInTheDocument();
        });

        it('should render no transfer when booking has no transfers array', () => {
            props.transfer = undefined;
            props.booking = {
                ...mockBooking,
                transfers: [],
            };

            render(<ItineraryTransfer {...props} />);

            expect(screen.getByText('You chose to make your own way')).toBeInTheDocument();
        });
    });

    describe('Error state', () => {
        it('should render error message when transfer is missing', () => {
            props.transfer = undefined;

            render(<ItineraryTransfer {...props} />);

            expect(screen.getByTestId('info-block')).toHaveTextContent('Error loading transfer');
        });

        it('should render error message when transfer is unknown type', () => {
            props.transfer!.transferType = TransferType.Unknown;

            render(<ItineraryTransfer {...props} />);

            expect(screen.getByTestId('info-block')).toHaveTextContent('Error loading transfer');
        });

        it('should render error message when transferType is missing', () => {
            props.transfer = {
                ...createMockTransfer(),
                transferType: undefined,
            };

            render(<ItineraryTransfer {...props} />);

            expect(screen.getByTestId('info-block')).toHaveTextContent('Error loading transfer');
        });
    });

    describe('Collapsed state', () => {
        it('should render basic transfer information when collapsed', () => {
            render(<ItineraryTransfer {...props} />);

            expect(mockItineraryItemComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isExpanded: false,
                    setExpanded: props.setExpanded,
                    isGreyedOut: undefined,
                }),
            );

            expect(mockTransferDescriptionItem).toHaveBeenCalled();
        });

        it('should show arrival message for arrival transfers', () => {
            props.isArrival = true;

            render(<ItineraryTransfer {...props} />);

            expect(mockItineraryItemComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: expect.objectContaining({
                        value: expect.stringContaining('to hotel'),
                    }),
                }),
            );
        });

        it('should show departure message for departure transfers', () => {
            props.isArrival = false;

            render(<ItineraryTransfer {...props} />);

            expect(mockItineraryItemComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: expect.objectContaining({
                        value: expect.stringContaining('to airport'),
                    }),
                }),
            );
        });
    });

    describe('Expanded state', () => {
        beforeEach(() => {
            props.isExpanded = true;
        });

        it('should render expanded content', () => {
            render(<ItineraryTransfer {...props} />);

            expect(screen.getAllByTestId('transfer-description-item').length).toBeGreaterThan(0);
        });

        it('should render vehicle info when expanded', () => {
            render(<ItineraryTransfer {...props} />);

            expect(mockVehicleInfo).toHaveBeenCalledWith(
                expect.objectContaining({
                    transfer: props.transfer,
                    fields: expect.any(Object),
                }),
            );
        });

        it('should render pickup instructions button', () => {
            render(<ItineraryTransfer {...props} />);

            expect(screen.getByText('Pickup instructions & help')).toBeInTheDocument();
        });

        it('should render pickup time with time may vary text when pickup time exists', () => {
            render(<ItineraryTransfer {...props} />);

            const timeMayVaryElements = screen.getAllByText(/Time may vary/);
            expect(timeMayVaryElements.length).toBeGreaterThan(0);
        });

        it('should render duration with time may vary text when transfer minutes exist', () => {
            render(<ItineraryTransfer {...props} />);

            expect(screen.getAllByText(/Time may vary/).length).toBeGreaterThan(0);
        });
    });

    describe('Pickup time handling', () => {
        it('should show no pickup time message when pickup time is missing and not 24hrs before departure', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: undefined,
            };
            props.isLess24HoursBeforeDeparture = false;
            props.isExpanded = true;

            render(<ItineraryTransfer {...props} />);

            const noPickupTimeElements = screen.getAllByText('No pickup time yet');
            expect(noPickupTimeElements.length).toBeGreaterThan(0);
        });

        it('should show pickup instructions when pickup time is missing and 24hrs before departure', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: undefined,
                pickupLocationInstructions: 'Meet at lobby',
            };
            props.isLess24HoursBeforeDeparture = true;
            props.isExpanded = true;

            render(<ItineraryTransfer {...props} />);

            expect(screen.getByText('Meet at lobby')).toBeInTheDocument();
        });

        it('should return null when isLess24HoursBeforeDeparture is true but no pickupLocationInstructions', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: undefined,
                pickupLocationInstructions: undefined,
            };
            props.isLess24HoursBeforeDeparture = true;
            props.isExpanded = true;

            render(<ItineraryTransfer {...props} />);

            expect(screen.queryByText('No pickup time yet')).not.toBeInTheDocument();
            expect(screen.queryByText('Instructions label')).not.toBeInTheDocument();
        });
    });

    describe('Greyed out state', () => {
        it('should pass isGreyedOut to ItineraryItem', () => {
            props.isGreyedOut = true;

            render(<ItineraryTransfer {...props} />);

            expect(mockItineraryItemComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isGreyedOut: true,
                }),
            );
        });
    });

    describe('Transfer type specific behavior', () => {
        it('should render shared transfer correctly', () => {
            props.transfer = {
                ...createMockTransfer(),
                transferType: TransferType.Shared,
            };
            props.isExpanded = true;

            render(<ItineraryTransfer {...props} />);

            expect(mockItineraryItemComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: expect.objectContaining({
                        value: expect.stringContaining('Shared transfer'),
                    }),
                }),
            );
        });
    });

    describe('InfoBlock rendering based on pickupTime', () => {
        it('should render InfoBlocks for departure when pickupTime exists but no pickup location', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: '2024-07-15T10:30:00',
                pickupLocationName: undefined,
                pickupLocation: undefined,
                transferType: TransferType.Private,
            };
            props.isArrival = false;
            props.isExpanded = true;

            render(<ItineraryTransfer {...props} />);

            expect(screen.getAllByTestId('info-block').length).toBeGreaterThan(0);
        });

        it('should not render InfoBlocks for departure when pickupTime is missing', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: undefined,
                pickupLocationName: 'Hotel Example',
                pickupLocation: { latitude: 28.945, longitude: -13.598 },
                transferType: TransferType.Private,
            };
            props.isArrival = false;
            props.isExpanded = true;

            render(<ItineraryTransfer {...props} />);

            expect(screen.queryByTestId('info-block')).not.toBeInTheDocument();
        });

        it('should render InfoBlocks for arrival regardless of pickupTime', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: undefined,
                pickupLocationName: 'Airport Terminal',
                transferType: TransferType.Private,
            };
            props.isArrival = true;
            props.isExpanded = true;

            render(<ItineraryTransfer {...props} />);

            expect(screen.getAllByTestId('info-block').length).toBeGreaterThan(0);
        });

        it('should render InfoBlocks for departure with pickupTime even without pickupLocationName', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: '2024-07-15T10:30:00',
                pickupLocationName: undefined,
                pickupLocation: undefined,
                transferType: TransferType.Shared,
            };
            props.isArrival = false;
            props.isExpanded = true;

            render(<ItineraryTransfer {...props} />);

            expect(screen.getAllByTestId('info-block').length).toBeGreaterThan(0);
        });
    });

    describe('Closed pickup time text', () => {
        it('should render only date when no pickupTime and no transferMinutes', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: undefined,
                transferMinutes: undefined,
            };

            render(<ItineraryTransfer {...props} />);

            expect(mockTransferDescriptionItem).toHaveBeenCalled();
        });
    });

    describe('Pickup location info', () => {
        it('should render pickup location when pickupTime and pickupLocationName exist', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: '2024-07-15T10:30:00',
                pickupLocationName: 'Hotel Example',
            };
            props.isExpanded = false;

            render(<ItineraryTransfer {...props} />);

            expect(mockTransferDescriptionItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Pickup location',
                    text: 'Hotel Example',
                }),
            );
        });

        it('should render pickup location name for arrival transfers', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: '2024-07-15T10:30:00',
                pickupLocationName: undefined,
            };
            props.isArrival = true;
            props.isExpanded = true;

            render(<ItineraryTransfer {...props} />);

            expect(mockTransferDescriptionItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Pickup location',
                    text: '',
                }),
            );
        });

        it('should render DiffPickupLocationText when departure with lat/long but no name', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: '2024-07-15T10:30:00',
                pickupLocationName: undefined,
                pickupLocation: { latitude: 28.945, longitude: -13.598 },
            };
            props.isArrival = false;
            props.isExpanded = true;

            render(<ItineraryTransfer {...props} />);

            expect(mockTransferDescriptionItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Pickup location',
                    text: 'Different location',
                }),
            );
        });

        it('should render SameLocationText when departure with no name and no lat/long', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: '2024-07-15T10:30:00',
                pickupLocationName: undefined,
                pickupLocation: undefined,
            };
            props.isArrival = false;
            props.isExpanded = true;

            render(<ItineraryTransfer {...props} />);

            expect(mockTransferDescriptionItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Pickup location',
                    text: 'Same location',
                }),
            );
        });

        it('should not render pickup location when pickupTime exists but collapsed with lat/long and no name', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: '2024-07-15T10:30:00',
                pickupLocationName: undefined,
                pickupLocation: { latitude: 28.945, longitude: -13.598 },
            };
            props.isArrival = false;
            props.isExpanded = false;

            render(<ItineraryTransfer {...props} />);

            expect(mockTransferDescriptionItem).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Pickup location',
                }),
            );
        });

        it('should render no pickup time text when collapsed, departure, no pickupTime and not 24hrs before departure', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: undefined,
                pickupLocationName: undefined,
                pickupLocation: undefined,
            };
            props.isArrival = false;
            props.isLess24HoursBeforeDeparture = false;
            props.isExpanded = false;

            render(<ItineraryTransfer {...props} />);

            const noPickupTimeElements = screen.getAllByText('No pickup time yet');
            expect(noPickupTimeElements.length).toBeGreaterThan(0);
        });

        it('should render pickup location for arrival transfer without pickupTime when expanded', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: undefined,
                pickupLocationName: 'Airport Terminal',
            };
            props.isArrival = true;
            props.isExpanded = true;

            render(<ItineraryTransfer {...props} />);

            expect(mockTransferDescriptionItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Pickup location',
                    text: 'Airport Terminal',
                }),
            );
        });

        it('should render pickup location for arrival transfer without pickupTime when collapsed with pickupLocationName', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: undefined,
                pickupLocationName: 'Airport Terminal',
            };
            props.isArrival = true;
            props.isExpanded = false;

            render(<ItineraryTransfer {...props} />);

            expect(mockTransferDescriptionItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Pickup location',
                    text: 'Airport Terminal',
                }),
            );
        });

        it('should render pickup location for arrival transfer without pickupTime, collapsed, no name and no lat/long', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: undefined,
                pickupLocationName: undefined,
                pickupLocation: undefined,
            };
            props.isArrival = true;
            props.isExpanded = false;

            render(<ItineraryTransfer {...props} />);

            expect(mockTransferDescriptionItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Pickup location',
                    text: '',
                }),
            );
        });

        it('should not render pickup location for arrival transfer without pickupTime, collapsed, no name but with lat/long', () => {
            props.transfer = {
                ...createMockTransfer(),
                pickupTime: undefined,
                pickupLocationName: undefined,
                pickupLocation: { latitude: 28.945, longitude: -13.598 },
            };
            props.isArrival = true;
            props.isExpanded = false;

            render(<ItineraryTransfer {...props} />);

            expect(mockTransferDescriptionItem).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Pickup location',
                }),
            );
        });
    });

    it('should render transfer instructions popup when pickup instructions button is clicked and close it when close button is clicked', () => {
        props.isExpanded = true;
        render(<ItineraryTransfer {...props} />);

        const button = screen.getByTestId('pickup-instructions-popup-button');
        act(() => {
            button.click();
        });

        expect(screen.getByTestId('transfer-instructions-popup')).toBeInTheDocument();
        expect(mockTransferInstructionsPopup).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: expect.any(Object),
                onClose: expect.any(Function),
                transferType: props.transfer?.transferType,
                instructions: props.transfer?.pickupLocationInstructions,
                mapLocation: props.transfer?.pickupLocation,
                popupTitle: { value: 'Private transfer to airport' },
                what3WordsLocation: props.transfer?.what3WordsLocation,
                CloseButtonLabel: props.CloseDrawerLabel,
            }),
        );

        const closeButton = screen.getByTestId('transfer-instructions-popup-close-btn');
        act(() => {
            closeButton.click();
        });

        expect(screen.queryByTestId('transfer-instructions-popup')).not.toBeInTheDocument();
    });

    it('should NOT render components when it is a flight and hotel package', () => {
        mockStores.viewBookingStore.isFlightAndHotelPackage = true;

        const { container } = render(<ItineraryTransfer {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
