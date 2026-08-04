import React from 'react';
import { render } from '@testing-library/react';

import { SeatType } from 'models/enum/SeatType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import Flight from './Flight';

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: () => <div data-tid='jss-image' />,
}));

const createMockProps = () => ({
    flight: {
        arrDate: '2019-09-22T17:20:00',
        depDate: '2019-09-22T15:00:00',
        arrName: 'inbound arr name',
        depName: 'inbound dep name',
    },
    flightType: 'inbound',
    passengers: [
        {
            seat: {
                products: [
                    {
                        id: 'B0003',
                        name: 'LargeOverheadBag',
                        icon: {
                            value: {
                                src: 'icon src',
                            },
                        },
                    },
                ],
            },
            index: 1,
        },
        {
            seat: {
                products: [
                    {
                        id: 'B0001',
                        name: 'SmallUnderSeatBag',
                        icon: {
                            value: {
                                src: 'icon src',
                            },
                        },
                    },
                ],
                priceBand: SeatType.ExtraLegroom,
                seatNumber: '3A',
            },
            index: 2,
        },
        {
            seat: {
                products: [
                    {
                        id: 'B0001',
                        name: 'SmallUnderSeatBag',
                        icon: {
                            value: {
                                src: 'icon src',
                            },
                        },
                    },
                ],
                priceBand: SeatType.UpFront,
                seatNumber: '3D',
            },
            index: 3,
        },
    ],
    areFlightsExternal: true,
    haveNotSelectedSeats: false,
    haveSelectedSeats: true,
});

const createMockStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
    seatMapStore: {
        isSeatMapFlowEnabled: true,
    },
    marketStore: {
        formatMoney: jest.fn(a => `£${a}`),
    },
    bookingStore: {
        totalGuestsQuantity: 2,
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('Flight', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockProps = createMockProps();
        mockStores = createMockStores();
    });

    it('should render flight data', () => {
        const { getByText } = render(<Flight {...mockProps} />);

        expect(getByText('inbound dep name - inbound arr name')).not.toBeNull();
        expect(getByText('Sun 22nd Sep 2019 15:00 - 17:20')).not.toBeNull();
    });

    it('should render no seats selected is seats are not selected', () => {
        mockProps.haveSelectedSeats = false;
        const { getByText } = render(<Flight {...mockProps} />);

        expect(getByText(SitecoreDictionary.GlobalsLabelsNoSeatSelected)).not.toBeNull();
    });

    it('should render bags if seats are selected', () => {
        const { queryByText, getByText } = render(<Flight {...mockProps} />);

        expect(queryByText(SitecoreDictionary.GlobalsLabelsNoSeatSelected)).toBeNull();
        expect(getByText('1 x LargeOverheadBag')).not.toBeNull();
    });

    it('should render small under seat bag for each passenger', () => {
        const { queryByText, getByText } = render(<Flight {...mockProps} />);

        expect(queryByText(SitecoreDictionary.GlobalsLabelsNoSeatSelected)).toBeNull();
        expect(getByText(`2 x ${SitecoreDictionary.SmallUnderSeatBagsPlural}`)).not.toBeNull();
    });

    it('should render seats if seats are selected', () => {
        mockProps.haveSelectedSeats = true;
        const { getByText } = render(<Flight {...mockProps} />);

        expect(getByText(SeatType.UpFront)).not.toBeNull();
        expect(getByText('3D')).not.toBeNull();

        expect(getByText(SeatType.ExtraLegroom)).not.toBeNull();
        expect(getByText('3A')).not.toBeNull();
    });

    it('should not render seats if seats are not selected', () => {
        mockProps.passengers = [
            {
                seat: {
                    products: [
                        {
                            id: 'B0003',
                            name: 'LargeOverheadBag',
                            icon: {
                                value: {
                                    src: 'icon src',
                                },
                            },
                        },
                    ],
                },
                index: 1,
            },
            {
                seat: {
                    products: [
                        {
                            id: 'B0001',
                            name: 'SmallUnderSeatBag',
                            icon: {
                                value: {
                                    src: 'icon src',
                                },
                            },
                        },
                    ],
                },
                index: 2,
            },
            {
                seat: {
                    products: [
                        {
                            id: 'B0001',
                            name: 'SmallUnderSeatBag',
                            icon: {
                                value: {
                                    src: 'icon src',
                                },
                            },
                        },
                    ],
                },
                index: 3,
            },
        ];
        const { queryByTestId } = render(<Flight {...mockProps} />);

        expect(queryByTestId('seat-confirmation')).toBeNull();
    });
});
