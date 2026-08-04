import React from 'react';
import { configure, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IFlightPassenger, IPassengerFlights } from 'models/data/AncillariesInfo';
import { ISeat, ISeatMapRow } from 'models/data/ISeatMapStore';
import { SeatType } from 'models/enum/SeatType';

import { BookSeatsSummary } from './BookSeatsSummary';

configure({ testIdAttribute: 'data-tid' });

const createProps = () => ({
    showCta: true,
    fields: {
        Title: mockSitecoreField('Title'),
        BtnBookSeats: mockSitecoreField('BtnBookSeats'),
        BtnReturnSeats: mockSitecoreField('BtnReturnSeats'),
        BtnOutboundSeats: mockSitecoreField('BtnOutboundSeats'),
        BtnChangeSeats: mockSitecoreField('BtnChangeSeats'),
        OutboundTitle: mockSitecoreField('OutboundTitle'),
        ReturnTitle: mockSitecoreField('ReturnTitle'),
        FallbackBenefit: {
            fields: {
                Code: mockSitecoreField('Code'),
                Description: mockSitecoreField('Description'),
                Icon: mockSitecoreField(mockSitecoreImageField('ChildrenIcon')),
                Name: mockSitecoreField('Name'),
            },
            id: 'fallback-benefit-id',
        },
        SeatDescription: mockSitecoreField('SeatDescription'),
        LegRoomDescription: mockSitecoreField('LegRoomDescription'),
        ErrorDepartureMessage: mockSitecoreField('ErrorDepartureMessage'),
        OutboundIcon: mockSitecoreField(mockSitecoreImageField('OutboundIcon')),
        ReturnIcon: mockSitecoreField(mockSitecoreImageField('ReturnIcon')),
        Children: {
            displayName: 'displayName',
            fields: {
                Icon: mockSitecoreField(mockSitecoreImageField('ChildrenIcon')),
                Title: mockSitecoreField('ChildrenTitle'),
            },
            id: 'children-id',
            name: 'name',
        },
        AmendSeatsAndBagsInfo: mockSitecoreField('AmendSeatsAndBagsInfo'),
        SeriesSeatFlights: mockSitecoreField('SeriesSeatFlights'),
        BookingOutOfSync: mockSitecoreField('BookingOutOfSync'),
    },
    passengers: [] as IPassengerFlights[],
    handleBookSeatsClick: jest.fn(),
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('< BookSeatsSummary />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should NOT render when no fields', () => {
        delete mockProps.fields;
        const { container } = render(<BookSeatsSummary {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render standard', () => {
        const { container } = render(<BookSeatsSummary {...mockProps} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(container.querySelector('.flights-summary')).toBeInTheDocument();
        expect(container.querySelector('.flights-summary__info')).toBeInTheDocument();
        expect(container.querySelectorAll('.flights-summary__paragraph')).toHaveLength(0);
        expect(screen.getByRole('button')).toHaveTextContent(mockProps.fields.BtnBookSeats.value);
    });

    describe('Flight summary info', () => {
        it('should render summary info on Holidays', () => {
            render(<BookSeatsSummary {...mockProps} />);

            expect(screen.queryByTestId('flights-summary-info')).toBeInTheDocument();
        });

        describe('on TradePortal', () => {
            beforeEach(() => {
                mockStores.layoutStore.isTradePortal = true;
            });

            it('should render summary info on Extras page when isPricesHidden = false', () => {
                mockStores.layoutStore.isExtrasPage = true;

                render(<BookSeatsSummary {...mockProps} />);

                expect(screen.queryByTestId('flights-summary-info')).toBeInTheDocument();
            });

            it('should NOT render summary info on Extras page when isPricesHidden = true', () => {
                mockStores.layoutStore.isExtrasPage = true;
                mockStores.layoutStore.isPricesHidden = true;

                render(<BookSeatsSummary {...mockProps} />);

                expect(screen.queryByTestId('flights-summary-info')).not.toBeInTheDocument();
            });

            it('should render summary info on any page except Extras', () => {
                render(<BookSeatsSummary {...mockProps} />);

                expect(screen.queryByTestId('flights-summary-info')).toBeInTheDocument();
            });
        });
    });

    describe('Paragraphs', () => {
        describe('Cheapest Seats Price', () => {
            const dataTid = 'cheapest-seats-price';

            beforeEach(() => {
                mockProps.passengers = [
                    {
                        outboundPassenger: { seat: { seatNumber: 's2o' } } as IFlightPassenger,
                        inboundPassenger: { seat: {} } as IFlightPassenger,
                    },
                ] as IPassengerFlights[];
                mockStores.seatMapStore.rowsDeparture = [
                    {
                        blocks: [{ seats: [{ isAvailable: true, priceBand: SeatType.Standard }] }] as ISeat[],
                    },
                ] as ISeatMapRow[];
            });

            it('should render paragraph when at least one passenger is without seat and  SeatDescription prop value is defined', () => {
                const { container, queryByTestId } = render(<BookSeatsSummary {...mockProps} />);

                expect(container.querySelectorAll('.flights-summary__paragraph')).toHaveLength(1);
                expect(queryByTestId(dataTid)).toBeInTheDocument();
            });

            it('should NOT render paragraph when all passengers have seats', () => {
                mockProps.passengers = [
                    {
                        outboundPassenger: { seat: { seatNumber: 's2o' } } as IFlightPassenger,
                        inboundPassenger: { seat: { seatNumber: 's1i' } } as IFlightPassenger,
                    },
                ] as IPassengerFlights[];
                const { queryByTestId } = render(<BookSeatsSummary {...mockProps} />);

                expect(queryByTestId(dataTid)).not.toBeInTheDocument();
            });

            it('should NOT render paragraph when SeatDescription prop value is undefined', () => {
                mockProps.fields.SeatDescription.value = undefined;
                const { queryByTestId } = render(<BookSeatsSummary {...mockProps} />);

                expect(queryByTestId(dataTid)).not.toBeInTheDocument();
            });
        });

        describe('Paragraphs', () => {
            const dataTid = 'cheapest-extra-leg-room-price';

            beforeEach(() => {
                mockProps.passengers = [
                    {
                        outboundPassenger: {
                            seat: { seatNumber: 's1o', priceBand: SeatType.Standard },
                        } as IFlightPassenger,
                        inboundPassenger: {
                            seat: { seatNumber: 's1i', priceBand: SeatType.Standard },
                        } as IFlightPassenger,
                    },
                    {
                        outboundPassenger: {
                            seat: { seatNumber: 's2o', priceBand: SeatType.ExtraLegroom },
                        } as IFlightPassenger,
                        inboundPassenger: {
                            seat: { seatNumber: 's2i', priceBand: SeatType.ExtraLegroom },
                        } as IFlightPassenger,
                    },
                ] as IPassengerFlights[];
                mockStores.seatMapStore.rowsDeparture = [
                    {
                        blocks: [
                            {
                                seats: [{ isAvailable: true, priceBand: SeatType.ExtraLegroom, price: 10 }],
                            },
                        ] as ISeat[],
                    },
                ] as ISeatMapRow[];
            });

            it('should render paragraph when seats upgrade is available and LegRoomDescription prop value is defined', () => {
                const { container, queryByTestId } = render(<BookSeatsSummary {...mockProps} />);

                expect(container.querySelectorAll('.flights-summary__paragraph')).toHaveLength(1);
                expect(queryByTestId(dataTid)).toBeInTheDocument();
            });

            it('should NOT render paragraph when seats upgrade is unavailable', () => {
                mockProps.passengers = [
                    {
                        outboundPassenger: {
                            seat: { seatNumber: 's1o', priceBand: SeatType.ExtraLegroom },
                        } as IFlightPassenger,
                        inboundPassenger: {
                            seat: { seatNumber: 's1i', priceBand: SeatType.ExtraLegroom },
                        } as IFlightPassenger,
                    },
                    {
                        outboundPassenger: {
                            seat: { seatNumber: 's2o', priceBand: SeatType.ExtraLegroom },
                        } as IFlightPassenger,
                        inboundPassenger: {
                            seat: { seatNumber: 's2i', priceBand: SeatType.ExtraLegroom },
                        } as IFlightPassenger,
                    },
                ] as IPassengerFlights[];
                const { queryByTestId } = render(<BookSeatsSummary {...mockProps} />);

                expect(queryByTestId(dataTid)).not.toBeInTheDocument();
            });

            it('should NOT render paragraph when LegRoomDescription prop value is undefined', () => {
                mockProps.fields.LegRoomDescription.value = undefined;
                const { queryByTestId } = render(<BookSeatsSummary {...mockProps} />);

                expect(queryByTestId(dataTid)).not.toBeInTheDocument();
            });
        });
    });

    describe('Book Seats Button', () => {
        it('should render button when handleBookSeatsClick is defined', async () => {
            render(<BookSeatsSummary {...mockProps} />);

            const submitButton = screen.getByRole('button') as Element;

            expect(submitButton).toBeInTheDocument();
            expect(submitButton).toHaveTextContent(mockProps.fields.BtnBookSeats.value);

            await userEvent.click(submitButton);

            expect(mockProps.handleBookSeatsClick).toBeCalled();
        });

        it('should NOT render button when handleBookSeatsClick is not defined', () => {
            delete mockProps.handleBookSeatsClick;

            render(<BookSeatsSummary {...mockProps} />);

            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });

        it('should render button with BtnChangeSeats prop field value when both haveOutboundSelectedSeats and haveInboundSelectedSeats are true', () => {
            mockStores.seatMapStore.haveOutboundSelectedSeats = true;
            mockStores.seatMapStore.haveInboundSelectedSeats = true;

            render(<BookSeatsSummary {...mockProps} />);

            expect(screen.getByRole('button')).toHaveTextContent(mockProps.fields.BtnChangeSeats.value);
        });

        it('should render button with BtnReturnSeats prop field value when haveOutboundSelectedSeats is true', () => {
            mockStores.seatMapStore.haveOutboundSelectedSeats = true;

            render(<BookSeatsSummary {...mockProps} />);

            expect(screen.getByRole('button')).toHaveTextContent(mockProps.fields.BtnReturnSeats.value);
        });

        it('should render button with BtnOutboundSeats prop field value when haveInboundSelectedSeats is true', () => {
            mockStores.seatMapStore.haveInboundSelectedSeats = true;

            render(<BookSeatsSummary {...mockProps} />);

            expect(screen.getByRole('button')).toHaveTextContent(mockProps.fields.BtnOutboundSeats.value);
        });

        it('should render outline button when isPostBookingFlow is true', () => {
            mockProps.isPostBookingFlow = true;

            render(<BookSeatsSummary {...mockProps} />);
            expect(screen.getByRole('button')).toHaveClass('btn--outlined');
        });
    });
});
