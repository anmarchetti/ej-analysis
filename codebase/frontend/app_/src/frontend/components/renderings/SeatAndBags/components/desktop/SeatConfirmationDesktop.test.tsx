import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { getPassengerByDisplayName } from 'frontend/utils/seatAndBags.utils';
import { PassengerDisplayName } from 'models/enum/PassengerType';
import { mockPassenger, mockPersonFields } from 'frontend/components/renderings/SeatAndBags/__mocks__/mockPasenger';
import {
    mockAncillariesChildren,
    mockSeatsAndBagsFields,
} from 'frontend/components/renderings/SeatAndBags/__mocks__/mockSeatAndBagsFields';

import SeatConfirmationDesktop from './SeatConfirmationDesktop';

const createProps = () => ({
    outboundPassenger: mockPassenger,
    inboundPassenger: mockPassenger,
    fields: mockSeatsAndBagsFields,
    numberOfPerson: 1,
});

const createStore = () =>
    createMockStores({
        seatMapStore: {
            getLuggageAllowance: jest.fn(() => []),
            rowsDeparture: [],
            rowsReturn: [],
        },
    });

let mockProps;
let mockStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStore,
}));

jest.mock('frontend/utils/seatAndBags.utils', () => ({
    __esModule: true,
    getPassengerByDisplayName: jest.fn(() => mockPersonFields),
    getTitle: jest.fn(() => 'pax title'),
    getTitleConstant: jest.fn(() => 'pax title const'),
}));

jest.mock('./SeatSelectionAndLuggageDesktop', () => ({
    __esModule: true,
    default: () => <div data-tid='seat-selection-and-luggage-desktop' />,
}));

const mockPersonDetails = jest.fn();
jest.mock('frontend/components/common/AncillariesPersonDetails/AncillariesPersonDetails', () => ({
    __esModule: true,
    default: props => {
        mockPersonDetails(props);

        return <div data-tid='ancillaries-person-details' {...props} />;
    },
}));

describe('<SeatConfirmationDesktop />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStore = createStore();
    });

    it('should skip when NO Children in props', () => {
        const { container } = render(<SeatConfirmationDesktop {...mockProps} fields={undefined} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component', () => {
        const { container } = render(<SeatConfirmationDesktop {...mockProps} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(screen.getAllByTestId('seat-selection-and-luggage-desktop')).toHaveLength(2);

        expect(getPassengerByDisplayName).toHaveBeenCalledTimes(3);
        expect(getPassengerByDisplayName).toHaveBeenNthCalledWith(
            1,
            mockAncillariesChildren,
            PassengerDisplayName.AdultInfant,
        );
        expect(getPassengerByDisplayName).toHaveBeenNthCalledWith(
            2,
            mockAncillariesChildren,
            PassengerDisplayName.Adult,
        );
        expect(getPassengerByDisplayName).toHaveBeenNthCalledWith(
            3,
            mockAncillariesChildren,
            PassengerDisplayName.Child,
        );

        expect(screen.getByTestId('ancillaries-person-details')).toBeInTheDocument();
        expect(mockPersonDetails).toHaveBeenCalledWith({
            personIcon: mockPersonFields.Icon,
            title: 'pax title',
            titleConstant: 'pax title const',
        });
    });
});
