import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IBookingTransfer } from 'models/data/ITransfer';
import { TransferType } from 'models/enum/transfer/TransferType';
import itinerarySummaryFieldsMocks from 'frontend/components/renderings/ItinerarySummary/__mocks__/itinerarySummaryFields';

import VehicleInfo from './VehicleInfo';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/BusLined', () => ({
    __esModule: true,
    default: () => <svg data-tid='bus-icon' />,
}));

jest.mock('frontend/components/icons-new/TaxiLined', () => ({
    __esModule: true,
    default: () => <svg data-tid='taxi-icon' />,
}));

describe('<VehicleInfo />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    describe('No vehicle info', () => {
        it('should not render when vehicle is undefined', () => {
            const transfer: IBookingTransfer = {
                transferType: TransferType.Private,
            };

            const { container } = render(<VehicleInfo transfer={transfer} fields={itinerarySummaryFieldsMocks} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should not render when vehicle has only empty fields', () => {
            const transfer: IBookingTransfer = {
                transferType: TransferType.Private,
                vehicle: {
                    provider: '',
                    vehicleType: '',
                    vehicleRegistration: '',
                    vehicleDriverName: '',
                    vehicleDriverPhone: '',
                    vehicleColour: '',
                },
            };

            const { container } = render(<VehicleInfo transfer={transfer} fields={itinerarySummaryFieldsMocks} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    describe('Shared transfer', () => {
        it('should render vehicle info for shared transfer', () => {
            const transfer: IBookingTransfer = {
                transferType: TransferType.Shared,
                vehicle: {
                    provider: 'Transfer Co',
                    vehicleRegistration: 'ABC123',
                    vehicleType: '',
                    vehicleColour: '',
                    vehicleDriverName: '',
                    vehicleDriverPhone: '',
                },
            };

            render(<VehicleInfo transfer={transfer} fields={itinerarySummaryFieldsMocks} />);

            expect(screen.getByTestId('bus-icon')).toBeInTheDocument();
            expect(screen.getByText('Vehicle')).toBeInTheDocument();
        });

        it('should render vehicle registration when available', () => {
            const transfer: IBookingTransfer = {
                transferType: TransferType.Shared,
                vehicle: {
                    provider: 'Transfer Co',
                    vehicleRegistration: 'ABC123',
                    vehicleType: '',
                    vehicleColour: '',
                    vehicleDriverName: '',
                    vehicleDriverPhone: '',
                },
            };

            render(<VehicleInfo transfer={transfer} fields={itinerarySummaryFieldsMocks} />);

            expect(screen.getByText('Registration')).toBeInTheDocument();
            expect(screen.getByText(/ABC123/)).toBeInTheDocument();
            expect(screen.getByText(/Subject to change/)).toBeInTheDocument();
        });

        it('should not render registration when not available', () => {
            const transfer: IBookingTransfer = {
                transferType: TransferType.Shared,
                vehicle: {
                    provider: 'Transfer Co',
                    vehicleRegistration: '',
                    vehicleType: '',
                    vehicleColour: '',
                    vehicleDriverName: '',
                    vehicleDriverPhone: '',
                },
            };

            render(<VehicleInfo transfer={transfer} fields={itinerarySummaryFieldsMocks} />);

            expect(screen.queryByText('Registration')).not.toBeInTheDocument();
        });
    });

    describe('Private transfer', () => {
        it('should render provider text for private transfer', () => {
            const transfer: IBookingTransfer = {
                transferType: TransferType.Private,
                vehicle: {
                    provider: 'Private Co',
                    vehicleType: '',
                    vehicleRegistration: '',
                    vehicleDriverName: '',
                    vehicleDriverPhone: '',
                    vehicleColour: '',
                },
            };

            render(<VehicleInfo transfer={transfer} fields={itinerarySummaryFieldsMocks} />);

            expect(screen.getByText('Vehicle')).toBeInTheDocument();
            expect(screen.getByText(/Private Co/)).toBeInTheDocument();
        });

        it('should render vehicle info for private transfer', () => {
            const transfer: IBookingTransfer = {
                transferType: TransferType.Private,
                vehicle: {
                    provider: '',
                    vehicleType: 'Sedan',
                    vehicleRegistration: 'XYZ789',
                    vehicleDriverName: 'John Doe',
                    vehicleDriverPhone: '+123456789',
                    vehicleColour: 'Black',
                },
            };

            render(<VehicleInfo transfer={transfer} fields={itinerarySummaryFieldsMocks} />);

            expect(screen.getByTestId('taxi-icon')).toBeInTheDocument();
            expect(screen.getByText('Vehicle')).toBeInTheDocument();
            expect(screen.getByText(/Sedan/)).toBeInTheDocument();
        });

        it('should render driver name when available', () => {
            const transfer: IBookingTransfer = {
                transferType: TransferType.Private,
                vehicle: {
                    provider: '',
                    vehicleType: '',
                    vehicleRegistration: '',
                    vehicleDriverName: 'John Doe',
                    vehicleDriverPhone: '',
                    vehicleColour: '',
                },
            };

            render(<VehicleInfo transfer={transfer} fields={itinerarySummaryFieldsMocks} />);

            expect(screen.getByText('Driver name')).toBeInTheDocument();
            expect(screen.getByText(/John Doe/)).toBeInTheDocument();
        });

        it('should render driver phone when available', () => {
            const transfer: IBookingTransfer = {
                transferType: TransferType.Private,
                vehicle: {
                    provider: '',
                    vehicleType: '',
                    vehicleRegistration: '',
                    vehicleDriverName: '',
                    vehicleDriverPhone: '+123456789',
                    vehicleColour: '',
                },
            };

            render(<VehicleInfo transfer={transfer} fields={itinerarySummaryFieldsMocks} />);

            expect(screen.getByText('Driver number')).toBeInTheDocument();
            expect(screen.getByText(/\+123456789/)).toBeInTheDocument();
        });

        it('should not render driver info when not available', () => {
            const transfer: IBookingTransfer = {
                transferType: TransferType.Private,
                vehicle: {
                    provider: '',
                    vehicleType: 'Sedan',
                    vehicleRegistration: '',
                    vehicleDriverName: '',
                    vehicleDriverPhone: '',
                    vehicleColour: '',
                },
            };

            render(<VehicleInfo transfer={transfer} fields={itinerarySummaryFieldsMocks} />);

            expect(screen.queryByText('Driver name')).not.toBeInTheDocument();
            expect(screen.queryByText('Driver number')).not.toBeInTheDocument();
        });
    });
});
