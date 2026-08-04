import * as React from 'react';
import { configure, render } from '@testing-library/react';

import { mockUnitRoom } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { BasketFirstCell } from './BasketFirstCell';

configure({ testIdAttribute: 'data-tid' });

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({
        layoutStore: { getPhrase: jest.fn(p => p) },
        bookingStore: { whoValueOnlyGuests: '1 adult', totalGuestsQuantity: 1 },
    }),
}));

describe('<BasketFirstCell />', () => {
    const resetMocks = () => ({
        offer: notEmptyOffer,
        board: null as any,
        room: null as any,
        className: 'first',
        isABTestingComponent: false,
    });

    const notEmptyOffer = {
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
                    depDate: '',
                },
                {
                    arrDate: '',
                },
            ],
        },
    } as any;

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render without hotel-location if hotel in offer is missing, board-type if board is missing, room-type if room is missing', () => {
        const { container, queryByTestId } = render(<BasketFirstCell {...mocks} />);

        expect(container.querySelector('.first-cell')).toBeInTheDocument();
        expect(queryByTestId('hotel-location')).not.toBeInTheDocument();
        expect(queryByTestId('board-type')).not.toBeInTheDocument();
        expect(queryByTestId('room-type')).not.toBeInTheDocument();
    });

    it('should render with hotel-location when offer hotel is defined', () => {
        mocks = {
            ...mocks,
            offer: {
                hotel: {
                    name: 'hotel name',
                    resort: {
                        name: 'name',
                    },
                },
            },
        };
        const { container, getByTestId } = render(<BasketFirstCell {...mocks} />);

        expect(container.querySelector('.first-cell')).toBeInTheDocument();
        expect(getByTestId('hotel-location')).toBeInTheDocument();
    });

    it('should not render hotel-location on AB testing component', () => {
        mocks = {
            ...mocks,
            offer: {
                hotel: {
                    name: 'hotel name',
                    resort: {
                        name: 'name',
                    },
                },
            },
            isABTestingComponent: true,
        };
        const { queryByTestId } = render(<BasketFirstCell {...mocks} />);

        expect(queryByTestId('hotel-location')).toBeNull();
    });

    it('should render with board-type when board is defined', () => {
        mocks = {
            ...mocks,
            board: {
                code: 'code',
                title: 'title',
            },
        };
        const { container, getByTestId } = render(<BasketFirstCell {...mocks} />);

        expect(container.querySelector('.first-cell')).toBeInTheDocument();
        expect(getByTestId('board-type')).toBeInTheDocument();
    });

    it('should render with room-type when room is defined', () => {
        mocks = {
            ...mocks,
            room: {
                code: 'code',
            },
        };
        const { container, getByTestId } = render(<BasketFirstCell {...mocks} />);

        expect(container.querySelector('.first-cell')).toBeInTheDocument();
        expect(getByTestId('room-type')).toBeInTheDocument();
    });

    it('should render with empty destination text', () => {
        mocks.offer.hotel = {
            resort: {},
        };
        const { container } = render(<BasketFirstCell {...mocks} />);

        expect(container.querySelector('.first-cell')).toBeInTheDocument();
    });

    describe('Rooms count label', () => {
        it('should render rooms count with who label', () => {
            mocks = {
                ...mocks,
                offer: notEmptyOffer,
                room: {
                    code: 'code',
                },
                isABTestingComponent: false,
            };
            const { getByTestId, queryByText } = render(<BasketFirstCell {...mocks} />);

            expect(getByTestId('room-type')).not.toBeNull();
            expect(queryByText(`1 adult, 1 ${SitecoreDictionary.GlobalsLabelsRoom}`)).not.toBeNull();
        });

        it('should render multiple rooms count with who label', () => {
            mocks = {
                ...mocks,
                offer: {
                    ...notEmptyOffer,
                    accom: {
                        unit: [mockUnitRoom, mockUnitRoom],
                    },
                },
                room: {
                    code: 'code',
                },
                isABTestingComponent: false,
            };
            const { getByTestId, queryByText } = render(<BasketFirstCell {...mocks} />);

            expect(getByTestId('room-type')).not.toBeNull();
            expect(queryByText(`1 adult, 2 ${SitecoreDictionary.GlobalsLabelsRooms}`)).not.toBeNull();
        });

        it('should render rooms count with guests label on AB testing component', () => {
            mocks = {
                ...mocks,
                offer: notEmptyOffer,
                room: {
                    code: 'code',
                },
                isABTestingComponent: true,
            };
            const { getByTestId, queryByText } = render(<BasketFirstCell {...mocks} />);

            expect(getByTestId('room-type')).not.toBeNull();
            expect(
                queryByText(`1 ${SitecoreDictionary.GlobalsLabelsGuest}, 1 ${SitecoreDictionary.GlobalsLabelsRoom}`),
            ).not.toBeNull();
        });
    });

    it('should add reverse class on AB testing component', () => {
        mocks.isABTestingComponent = true;
        const { container } = render(<BasketFirstCell {...mocks} />);

        expect(container.querySelector('.first-cell.reverse')).toBeInTheDocument();
    });
});
