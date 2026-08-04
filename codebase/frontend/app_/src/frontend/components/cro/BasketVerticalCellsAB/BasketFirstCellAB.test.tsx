import * as React from 'react';
import { configure, render, screen } from '@testing-library/react';

import { mockUnitRoom } from 'frontend/__mocks__';
import { IBoardType, IHotel, IHotelDestination, IRoomType } from 'models/data/IHotel';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { BasketFirstCellAB, IBasketFirstCellABProps } from './BasketFirstCellAB';
configure({ testIdAttribute: 'data-tid' });

const notEmptyOffer: IOfferWithoutAltBoards = {
    accom: {
        unit: [
            {
                occupation: {
                    adults: 2,
                    children: 0,
                },
            },
        ],
    },
    transport: {
        routes: [
            {
                direction: 'outbound',
                arrDate: '2019-09-16T14:20:00+00:00',
                arrName: 'Palma Airport',
                arrPt: 'PMI',
                depDate: '2019-09-16T11:55:00+00:00',
                depName: 'London Gatwick Airport',
                depPt: 'LGW',
            },
            {
                direction: 'inbound',
                depDate: '2019-09-16T14:20:00+00:00',
                depName: 'Palma Airport',
                depPt: 'PMI',
                arrDate: '2019-09-16T11:55:00+00:00',
                arrName: 'London Gatwick Airport',
                arrPt: 'LGW',
            },
        ],
    },
} as IOfferWithoutAltBoards;

const createProps = (): IBasketFirstCellABProps => ({
    offer: notEmptyOffer,
    board: null as Nullable<IBoardType>,
    room: null as Nullable<IRoomType>,
    className: 'first',
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    bookingStore: { whoValueOnlyGuests: '1 adult', totalGuestsQuantity: 1 },
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BasketFirstCellAB />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render without hotel-location if hotel in offer is missing, board-type if board is missing, room-type if room is missing', () => {
        render(<BasketFirstCellAB {...mockProps} />);

        expect(screen.getByTestId('first-cell')).toBeInTheDocument();
        expect(screen.queryByTestId('hotel-location')).not.toBeInTheDocument();
        expect(screen.queryByTestId('board-type')).not.toBeInTheDocument();
        expect(screen.queryByTestId('room-type')).not.toBeInTheDocument();
    });

    it('should render with hotel-location when offer hotel is defined', () => {
        mockProps = {
            ...mockProps,
            offer: {
                hotel: {
                    name: 'hotel name',
                    resort: {
                        name: 'name',
                        code: 'code',
                    },
                },
            } as IOfferWithoutAltBoards,
        };
        render(<BasketFirstCellAB {...mockProps} />);

        expect(screen.getByTestId('first-cell')).toBeInTheDocument();
        expect(screen.getByTestId('hotel-location')).toBeInTheDocument();
    });

    it('should render with board-type when board is defined', () => {
        mockProps = {
            ...mockProps,
            board: {
                code: 'code',
                title: 'title',
            } as IBoardType,
        };
        render(<BasketFirstCellAB {...mockProps} />);

        expect(screen.getByTestId('first-cell')).toBeInTheDocument();
        expect(screen.getByTestId('board-type')).toBeInTheDocument();
    });

    it('should render with room-type when room is defined', () => {
        mockProps = {
            ...mockProps,
            room: {
                code: 'code',
            } as IRoomType,
        };
        render(<BasketFirstCellAB {...mockProps} />);

        expect(screen.getByTestId('first-cell')).toBeInTheDocument();
        expect(screen.getByTestId('room-type')).toBeInTheDocument();
    });

    it('should render with empty destination text', () => {
        mockProps.offer.hotel = {
            resort: {} as IHotelDestination,
        } as IHotel;
        render(<BasketFirstCellAB {...mockProps} />);

        expect(screen.getByTestId('first-cell')).toBeInTheDocument();
    });

    describe('Rooms count label', () => {
        it('should render rooms count with who label', () => {
            mockProps = {
                ...mockProps,
                offer: notEmptyOffer,
                room: {
                    code: 'code',
                } as IRoomType,
            };
            render(<BasketFirstCellAB {...mockProps} />);

            expect(screen.getByTestId('room-type')).toBeInTheDocument();
            expect(screen.queryByText(`1 adult, 1 ${SitecoreDictionary.GlobalsLabelsRoom}`)).toBeInTheDocument();
        });

        it('should render multiple rooms count with who label', () => {
            mockProps = {
                ...mockProps,
                offer: {
                    ...notEmptyOffer,
                    accom: {
                        unit: [mockUnitRoom, mockUnitRoom],
                    },
                } as IOfferWithoutAltBoards,
                room: {
                    code: 'code',
                } as IRoomType,
            };
            render(<BasketFirstCellAB {...mockProps} />);

            expect(screen.getByTestId('room-type')).toBeInTheDocument();
            expect(screen.queryByText(`1 adult, 2 ${SitecoreDictionary.GlobalsLabelsRooms}`)).toBeInTheDocument();
        });
    });
});
