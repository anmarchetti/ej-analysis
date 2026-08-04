import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockAmendDatesStore, mockBooking } from 'frontend/__mocks__';
import { DataStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendDatesSummaryFlight from './AmendDatesSummaryFlight';

const createProps = () => ({
    icon: {
        value: {
            src: 'icon',
        },
    },
    title: {
        value: 'title',
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAmendSummaryAccordionProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockAmendSummaryAccordionProps(props);

        return <div data-tid={props.dataTid}>{children}</div>;
    },
}));

const mockEditButtonProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/EditButton/EditButton', () => ({
    __esModule: true,
    default: ({ onClick, children, ...props }) => {
        mockEditButtonProps(props);

        return (
            <button data-tid={props.dataTid} onClick={onClick}>
                {children}
            </button>
        );
    },
}));

const mockSummaryFlightItemProps = jest.fn();
jest.mock('./components/AmendDatesSummaryFlightItem/AmendDatesSummaryFlightItem', () => ({
    __esModule: true,
    default: props => {
        mockSummaryFlightItemProps(props);

        return <div data-tid='summary-flight-item' />;
    },
}));

describe('<AmendDatesSummaryFlight />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendDatesStore: {
                ...mockAmendDatesStore,
                booking: mockBooking,
                flights: {
                    noAvailableFlightOffers: false,
                },
            },
            amendFlightsStore: {},
        });
        mockProps = createProps();
    });

    describe('AmendDatesSummaryEditBtn', () => {
        it('Should be rendered', () => {
            render(<AmendDatesSummaryFlight {...mockProps} />);

            expect(screen.getByTestId('amend-dates-flight-edit-button')).toHaveTextContent(
                SitecoreDictionary.GlobalsLabelsChangeSingular,
            );
            expect(mockEditButtonProps).toHaveBeenCalledWith({
                dataTid: 'amend-dates-flight-edit-button',
                isLoading: false,
                isCapitalize: true,
            });
        });

        it('Should NOT be rendered when no available offers', () => {
            mockStores.amendDatesStore.flights.noAvailableFlightOffers = true;
            render(<AmendDatesSummaryFlight {...mockProps} />);

            expect(screen.queryByTestId('amend-dates-flight-edit-button')).not.toBeInTheDocument();
        });

        it('Call onChangeDatesAmendFlightClick', async () => {
            render(<AmendDatesSummaryFlight {...mockProps} />);

            await userEvent.click(screen.getByTestId('amend-dates-flight-edit-button'));

            expect(mockStores.amendDatesStore.onChangeDatesAmendFlightClick).toBeCalled();
        });

        it('Show loading state when amendFlightsStore.status is loading', () => {
            mockStores.amendFlightsStore.status = DataStatus.Loading;
            render(<AmendDatesSummaryFlight {...mockProps} />);

            expect(mockEditButtonProps).toBeCalledWith(
                expect.objectContaining({
                    isLoading: true,
                }),
            );
        });
    });

    describe('outbound and inbound flights', () => {
        it('Render outbound and inbound flights', () => {
            render(<AmendDatesSummaryFlight {...mockProps} />);

            expect(screen.getAllByTestId('summary-flight-item').length).toBe(2);
        });

        it('Render none of flights', () => {
            mockStores.amendDatesStore.booking.package.transport.routes.forEach(t => {
                t.direction = 'any';
            });
            render(<AmendDatesSummaryFlight {...mockProps} />);

            expect(screen.queryByTestId('summary-flight-item')).not.toBeInTheDocument();
        });

        it('Render null when no flights', () => {
            mockStores.amendDatesStore.offer = {
                ...mockStores.amendDatesStore.offer,
                transport: null,
            };
            const { container } = render(<AmendDatesSummaryFlight {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('Do not render flights if they are not returned', () => {
            jest.mock('frontend/utils/airports.utils', () => ({
                __esModule: true,
                getRouteByDirection: () => ({
                    outbound: null,
                    inbound: null,
                }),
            }));

            render(<AmendDatesSummaryFlight {...mockProps} />);

            expect(screen.queryByText('AmendDatesSummaryFlightItem')).not.toBeInTheDocument();
        });
    });
});
