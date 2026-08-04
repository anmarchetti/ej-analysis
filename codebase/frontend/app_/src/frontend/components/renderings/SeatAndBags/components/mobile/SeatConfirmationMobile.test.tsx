import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { getPassengerByDisplayName } from 'frontend/utils/seatAndBags.utils';
import { ISeatMapRow } from 'models/data/ISeatMapStore';
import { PassengerDisplayName } from 'models/enum/PassengerType';
import { SeatType } from 'models/enum/SeatType';
import { mockPassenger, mockPersonFields } from 'frontend/components/renderings/SeatAndBags/__mocks__/mockPasenger';
import {
    mockAncillariesChildren,
    mockSeatsAndBagsFields,
} from 'frontend/components/renderings/SeatAndBags/__mocks__/mockSeatAndBagsFields';

import SeatConfirmationMobile from './SeatConfirmationMobile';

const createProps = () => ({
    passenger: { ...mockPassenger, firstName: 'Ben', lastName: 'Black', title: 'Mr' },
    color: 'orange',
    rows: [] as ISeatMapRow[],
    fields: mockSeatsAndBagsFields,
    numberOfPerson: 1,
});

const createStore = () =>
    createMockStores({
        marketStore: {
            formatMoney: jest.fn(a => `${a >= 0 ? '+' : '-'}£${Math.abs(a)}`),
        },
        seatMapStore: {
            currency: CurrencyCode.GBP,
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

jest.mock('../SeatProducts/SeatProducts', () => ({
    __esModule: true,
    default: () => <div>SeatProducts</div>,
}));

jest.mock('frontend/components/renderings/SeatAndBags/components/SeatBag', () => ({
    __esModule: true,
    default: ({ text }) => <div>SeatBag {text}</div>,
}));

const mockSeatSelectionMobile = jest.fn();
jest.mock('frontend/components/renderings/SeatAndBags/components/mobile/SeatSelectionMobile', () => ({
    __esModule: true,
    default: props => {
        mockSeatSelectionMobile(props);

        return <div data-tid='seat-selection-mobile' />;
    },
}));

const mockPersonDetails = jest.fn();
jest.mock('frontend/components/common/AncillariesPersonDetails/AncillariesPersonDetails', () => ({
    __esModule: true,
    default: props => {
        mockPersonDetails(props);

        return <div data-tid='ancillaries-person-details' {...props} />;
    },
}));

describe('<SeatConfirmationMobile />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStore = createStore();
    });

    it('should skip when NO Children in props', () => {
        const { container } = render(<SeatConfirmationMobile {...mockProps} fields={undefined} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component', () => {
        const { container } = render(<SeatConfirmationMobile {...mockProps} />);

        expect(container).not.toBeEmptyDOMElement();

        expect(screen.getByText('SeatProducts')).toBeInTheDocument();
        expect(screen.getByText('+£8.49')).toBeInTheDocument();

        expect(screen.getByTestId('seat-selection-mobile')).toBeInTheDocument();
        expect(mockSeatSelectionMobile).toHaveBeenCalledWith({
            seatColor: 'orange',
            seatNumber: '5A',
            text: SeatType.Standard,
        });

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

    it('SeatSelectionMobile should render component with "no selected" label', () => {
        delete mockProps.passenger.seat;

        render(<SeatConfirmationMobile {...mockProps} />);

        expect(screen.getByTestId('seat-selection-mobile')).toBeInTheDocument();
        expect(mockSeatSelectionMobile).toHaveBeenCalledWith({ text: 'Globals.Labels.NoSeatSelected' });
    });

    it('SeatBag should render seat bag with fallback benefit when no seat number', () => {
        mockProps.passenger.seat = { ...mockPassenger.seat, seatNumber: undefined };

        render(<SeatConfirmationMobile {...mockProps} />);

        expect(screen.getByText('SeatBag Fallback Benefit Name')).toBeInTheDocument();
    });

    describe('Price', () => {
        it('should NOT render price when isPricesHidden is true', () => {
            mockProps.isPricesHidden = true;

            render(<SeatConfirmationMobile {...mockProps} />);

            expect(screen.queryByTestId('confirmed-seat-price')).not.toBeInTheDocument();
        });

        it('should NOT render price when no price', () => {
            delete mockProps.passenger.seat.price;

            render(<SeatConfirmationMobile {...mockProps} />);

            expect(screen.queryByTestId('confirmed-seat-price')).not.toBeInTheDocument();
        });

        it('should render price when it is equal to zero', () => {
            mockProps.passenger.seat.price = 0;

            render(<SeatConfirmationMobile {...mockProps} />);

            expect(screen.queryByTestId('confirmed-seat-price')).toHaveTextContent('+£0');
        });
    });
});
