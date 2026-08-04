import React from 'react';

jest.mock('frontend/hooks/useReCaptcha');

import { render, screen } from '@testing-library/react';

import { mockFields } from 'frontend/components/renderings/TradePortalGroupBooking/__mocks__/tradePortalGroupBookingFields';
import * as groupBookingStore from 'frontend/components/renderings/TradePortalGroupBooking/store/createStore';

import GroupBookingHolidayInformation from './GroupBookingHolidayInformation';

const createProps = () => ({
    fields: mockFields,
    params: {},
    rendering: {},
});

const createBookingStore = (): any => ({
    groupBooking: {
        departureDate: '',
        duration: '',
        destination: '',
        additionalDetails: '',
        departureAirport: '',
        boards: [],
        isFlexible: false,
        isValid: false,
        isValidField: jest.fn(() => true),
        validateField: jest.fn(),
        onChangeField: jest.fn(),
        isFieldRequired: jest.fn(),
        onChangeCheckboxField: jest.fn(),
    },
    forceErrors: false,
});

const createStores = () => ({
    layoutStore: { isTradePortal: true, getPhrase: jest.fn(p => p) },
    trackingStore: { trackValidation: jest.fn() },
});

let mockStores = createStores();
let mockProps = createProps();

jest.mock('frontend/components/common/Callout/Callout', () => () => <div data-tid='callout' />);

jest.mock('frontend/components/common/ValidatableTextarea/ValidatableTextarea', () => ({ label }) => (
    <div data-tid='validatable-textarea'>{label}</div>
));

const mockSetState = jest.fn();
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useState: initial => [initial, mockSetState],
}));

describe('<GroupBookingHolidayInformation />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createStores();
        mockProps = createProps();
        jest.spyOn(groupBookingStore, 'useGroupBookingStore').mockImplementation(createBookingStore);
    });

    describe('Initial Form State', () => {
        it('Should NOT render when groupBooking does NOT exist', () => {
            jest.spyOn(groupBookingStore, 'useGroupBookingStore').mockReturnValueOnce([null, false] as any);
            const { container } = render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    describe('Is Flexible Checkbox', () => {
        it('Should render checkbox with label', () => {
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.getByTestId('flexible-checkbox')).toHaveTextContent('Is Flexible Label');
        });

        it('Should render checkbox without label when label not provided', () => {
            mockProps.fields.IsFlexibleLabel = null as any;
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.getByTestId('flexible-checkbox')).toHaveTextContent('');
        });

        it('Should render checkbox tooltip', () => {
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.getByTestId('callout')).toBeInTheDocument();
        });
    });

    describe('Departure Date Field', () => {
        it('Should render departure date field with label', () => {
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.getByText('Departure Date Label')).toBeInTheDocument();
        });

        it('Should render departure date field without label when label not provided', () => {
            mockProps.fields.DepartureDateLabel = null as any;
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.queryByText('Departure Date Label')).not.toBeInTheDocument();
        });
    });

    describe('Duration Of Holiday Field', () => {
        it('Should render duration of holiday with label and note', () => {
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.getByText('Duration Of Holiday Label')).toBeInTheDocument();
            expect(screen.getByTestId('holiday-information-additional-description-duration')).toHaveTextContent(
                'Duration Of Holiday Note',
            );
        });

        it('Should render duration of holiday without label when label not provided', () => {
            mockProps.fields.DurationOfHolidayLabel = null as any;
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.queryByText('Duration Of Holiday Label')).not.toBeInTheDocument();
        });
    });

    describe('Destination Field', () => {
        it('Should render destination field with label', () => {
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.getByText('Destination Label')).toBeInTheDocument();
        });

        it('Should render destination field without label when label not provided', () => {
            mockProps.fields.DestinationLabel = null as any;
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.queryByText('Destination Label')).not.toBeInTheDocument();
        });

        it('Should render destination field with note', () => {
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.getByTestId('holiday-information-additional-description-destination')).toHaveTextContent(
                'Destination Note',
            );
        });
    });

    describe('Additional Details Field', () => {
        it('Should render additional details field with label', () => {
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.getByText('Additional Details Label')).toBeInTheDocument();
        });

        it('Should render additional details field without label when label not provided', () => {
            mockProps.fields.AdditionalDetailsLabel = null as any;
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.queryByText('Additional Details Label')).not.toBeInTheDocument();
        });
    });

    describe('Departure Airport Select Field', () => {
        it('Should render airports select field with label', () => {
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.getByText('Departure Airport Label')).toBeInTheDocument();
        });

        it('Should render airports select field without label when label not provided', () => {
            mockProps.fields.DepartureAirportLabel = null as any;
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.queryByText('Departure Airport Label')).not.toBeInTheDocument();
        });
    });

    describe('Boards Select Field', () => {
        it('Should render boards select field with label and note', () => {
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.getByText('Boards Label')).toBeInTheDocument();
            expect(screen.getByTestId('holiday-information-additional-description-board-basis')).toHaveTextContent(
                'Boards Note',
            );
        });

        it('Should render boards select field without label when label not provided', () => {
            mockProps.fields.BoardsLabel = null as any;
            render(<GroupBookingHolidayInformation {...mockProps} />);

            expect(screen.queryByText('Boards Label')).not.toBeInTheDocument();
        });
    });
});
