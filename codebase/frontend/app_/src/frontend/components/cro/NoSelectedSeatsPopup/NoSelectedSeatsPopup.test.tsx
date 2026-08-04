import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { ISeat, ISeatMapRow } from 'models/data/ISeatMapStore';
import { SeatType } from 'models/enum/SeatType';

import NoSelectedSeatsPopup, { INoSelectedSeatsPopupProps } from './NoSelectedSeatsPopup';

const createProps = (): INoSelectedSeatsPopupProps => ({
    onClose: jest.fn(),
    continueBookingFunnel: jest.fn(),
});

const createStores = () =>
    createMockStores({
        seatMapStore: {
            rowsDeparture: [
                {
                    blocks: [
                        {
                            seats: [{ isAvailable: true, priceBand: SeatType.ExtraLegroom, price: 10 }],
                        },
                    ] as ISeat[],
                },
            ] as ISeatMapRow[],
            rowsReturn: [
                {
                    blocks: [
                        {
                            seats: [{ isAvailable: true, priceBand: SeatType.Standard, price: 20 }],
                        },
                    ] as ISeat[],
                },
            ] as ISeatMapRow[],
            setSeatMapOpened: jest.fn(),
        },
        marketStore: {
            formatMoney: jest.fn(a => `£${a}`),
        },
        flightsPassengersStore: {
            passengersByQueue: [
                {
                    outboundPassenger: {
                        passengerId: 'passengerId',
                        seat: {
                            price: 'price',
                            seatNumber: 'seatNumber',
                            priceBand: SeatType.ExtraLegroom,
                            products: [],
                        },
                        firstName: 'firstName',
                        lastName: 'lastName',
                        title: 'title',
                        type: 'type',
                        withInfant: false,
                        age: 20,
                        index: 'index',
                        isLead: true,
                        notBornYet: false,
                        sex: 'sex',
                        dateOfBirth: 'dateOfBirth',
                    },
                    inboundPassenger: {
                        passengerId: 'passengerId',
                        seat: {
                            price: 'price',
                            seatNumber: 'seatNumber',
                            priceBand: SeatType.ExtraLegroom,
                            products: [],
                        },
                        firstName: 'firstName',
                        lastName: 'lastName',
                        title: 'title',
                        type: 'type',
                        withInfant: false,
                        age: 20,
                        index: 'index',
                        isLead: true,
                        notBornYet: false,
                        sex: 'sex',
                        dateOfBirth: 'dateOfBirth',
                    },
                },
            ],
        },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<NoSelectedSeatsPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render', async () => {
        render(<NoSelectedSeatsPopup {...mockProps} />);
        expect(screen.getByTestId('no-selected-seats-title')).toBeInTheDocument();
        expect(screen.getByTestId('no-selected-seats-content')).toBeInTheDocument();
        expect(screen.getByTestId('no-selected-seats-book-seats-button')).toBeInTheDocument();
        expect(screen.getByTestId('no-selected-seats-continue-booking-button')).toBeInTheDocument();
    });

    it('should show cheapest seats price', async () => {
        render(<NoSelectedSeatsPopup {...mockProps} />);
        expect(screen.getByTestId('cheapest-seats-price')).toBeInTheDocument();
    });

    it('should show cheapest extra leg room price', async () => {
        render(<NoSelectedSeatsPopup {...mockProps} />);
        expect(screen.getByTestId('cheapest-extra-leg-room-price')).toBeInTheDocument();
    });

    it('should call continueBookingFunnel when clicking the continue booking button', async () => {
        render(<NoSelectedSeatsPopup {...mockProps} />);
        const continueButton = screen.getByTestId('no-selected-seats-continue-booking-button');
        fireEvent.click(continueButton);
        expect(mockProps.continueBookingFunnel).toHaveBeenCalledTimes(1);
    });

    it('should call openSeatMap and onClose when clicking the book seats button', async () => {
        render(<NoSelectedSeatsPopup {...mockProps} />);
        const bookSeatsButton = screen.getByTestId('no-selected-seats-book-seats-button');
        fireEvent.click(bookSeatsButton);
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
        expect(mockStores.seatMapStore.setSeatMapOpened).toHaveBeenCalledWith(true);
    });
});
