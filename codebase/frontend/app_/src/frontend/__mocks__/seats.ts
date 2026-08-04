import { ISelectedSeat, ISelectedSeatDetails } from 'models/data/ISeatMapStore';
import { SeatType } from 'models/enum/SeatType';

export const mockSeats: ISelectedSeatDetails[] = [
    {
        paxIndex: 0,
        seatNumber: '12A',
        priceBand: SeatType.Standard,
        products: [
            {
                id: '1',
                name: 'Extra Legroom',
                icon: 'https://example.com/extra-legroom.png',
            },
        ],
        price: 50,
    },
    {
        paxIndex: 1,
        seatNumber: '15C',
        priceBand: SeatType.UpFront,
        products: [
            {
                id: '2',
                name: 'Window View',
                icon: 'https://example.com/window-view.png',
            },
        ],
        price: 20,
    },
];

export const mockSelectedSeat: ISelectedSeat = {
    sectorId: '1',
    seats: mockSeats,
    flightNumber: 'FL123',
    isSeatReservationPossible: true,
};

export const mockSelectedSeats: ISelectedSeat[] = [
    mockSelectedSeat,
    { ...mockSelectedSeat, sectorId: '2', flightNumber: 'FL124' },
];

export const mockedSeatsFromWidget = [
    {
        flightNumber: '2331',
        sectorId: '1',
        seats: [
            {
                paxIndex: 1,
                seatNumber: '5E',
                price: 10.99,
                priceBand: SeatType.Standard,
            },
            {
                paxIndex: 2,
                seatNumber: '3E',
                price: 37.49,
                priceBand: SeatType.UpFront,
            },
        ],
    },
    {
        flightNumber: '2330',
        sectorId: '2',
        seats: [
            {
                paxIndex: 1,
                seatNumber: '7D',
                price: 10.99,
                priceBand: SeatType.Standard,
            },
            {
                paxIndex: 2,
                seatNumber: '7F',
                price: 10.99,
                priceBand: SeatType.UpFront,
            },
        ],
    },
];
